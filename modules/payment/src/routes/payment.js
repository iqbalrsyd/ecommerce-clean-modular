import { Router, raw } from "express";
import { authRequired } from "@ecom/shared-auth";
import { parseOrThrow, CreatePaymentIntentInput } from "../dto/payment.js";
import { createPaymentIntentForOrder, handleWebhook } from "../domain/payment.js";

export function buildPaymentRouter(ctx) {
  const router = Router();

  router.post("/payments/intents", authRequired, async (req, res, next) => {
    try {
      const input = parseOrThrow(CreatePaymentIntentInput, req.body);
      const idempotencyKey = input.idempotencyKey;
      const result = await createPaymentIntentForOrder(
        { orderId: input.orderId, userId: req.user.id, idempotencyKey },
        ctx,
      );
      res.status(result.reused ? 200 : 201).json({ data: result });
    } catch (err) { next(err); }
  });

  router.post(
    "/payments/webhook",
    raw({ type: "application/json", limit: "100kb" }),
    async (req, res, next) => {
      try {
        const signature = req.headers["stripe-signature"];
        const result = await handleWebhook(req.body, signature, ctx);
        res.json(result);
      } catch (err) { next(err); }
    },
  );

  return router;
}
