import Stripe from "stripe";
import { loadConfig } from "@ecom/shared-config";
import { query } from "@ecom/shared-db";
import { ConflictError, NotFoundError, AppError } from "@ecom/shared-errors";

let stripeClient;

function getStripe() {
  if (stripeClient) return stripeClient;
  const cfg = loadConfig();
  stripeClient = new Stripe(cfg.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
    maxNetworkRetries: 2,
    timeout: 10_000,
  });
  return stripeClient;
}

export async function createPaymentIntentForOrder({ orderId, userId, idempotencyKey }, ctx) {
  const stripe = getStripe();
  const { rows } = await query(
    `SELECT id, user_id, total_cents, currency, payment_intent_id, status
       FROM orders
      WHERE id = $1`,
    [orderId],
    ctx,
  );
  if (rows.length === 0) throw new NotFoundError("order");
  const order = rows[0];
  if (order.user_id !== userId) throw new ConflictError("not your order");
  if (order.payment_intent_id) {
    return { paymentIntentId: order.payment_intent_id, reused: true };
  }
  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: order.total_cents,
        currency: order.currency.toLowerCase(),
        metadata: { orderId: String(order.id), userId: String(userId) },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey },
    );
    await query(
      `UPDATE orders SET payment_intent_id = $2 WHERE id = $1`,
      [orderId, intent.id],
      ctx,
    );
    return { paymentIntentId: intent.id, clientSecret: intent.client_secret, reused: false };
  } catch (err) {
    throw new AppError("PAYMENT_PROVIDER_ERROR", err.message, { status: 502, cause: err });
  }
}

export async function handleWebhook(rawBody, signature, ctx) {
  const cfg = loadConfig();
  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, cfg.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new AppError("INVALID_SIGNATURE", "invalid webhook signature", { status: 400, cause: err });
  }
  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      await query(
        `UPDATE orders SET status = 'paid' WHERE payment_intent_id = $1`,
        [intent.id],
        ctx,
      );
      const { rows } = await query(
        `SELECT id, user_id, total_cents FROM orders WHERE payment_intent_id = $1`,
        [intent.id],
        ctx,
      );
      if (rows[0]) {
        ctx.bus.emit("payment.succeeded", { orderId: rows[0].id, userId: rows[0].user_id, totalCents: rows[0].total_cents });
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      await query(
        `UPDATE orders SET status = 'payment_failed' WHERE payment_intent_id = $1`,
        [intent.id],
        ctx,
      );
      ctx.bus.emit("payment.failed", { paymentIntentId: intent.id });
      break;
    }
    default:
      // ignore other events
      break;
  }
  return { received: true };
}
