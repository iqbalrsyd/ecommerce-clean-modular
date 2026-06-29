import { query, withTransaction } from "@ecom/shared-db";
import { ConflictError, NotFoundError } from "@ecom/shared-errors";

export function computeTotals(items, discountCents = 0) {
  const subtotalCents = items.reduce((acc, it) => acc + it.priceCents * it.quantity, 0);
  if (discountCents < 0 || discountCents > subtotalCents) {
    throw new ConflictError("invalid discount");
  }
  const taxCents = Math.floor(subtotalCents * 0.08);
  const shippingCents = subtotalCents >= 5000 ? 0 : 999;
  const totalCents = subtotalCents - discountCents + taxCents + shippingCents;
  return { subtotalCents, discountCents, taxCents, shippingCents, totalCents };
}

export async function createOrderFromCart({ userId, cartId, shippingAddress, paymentMethodId }, ctx) {
  return withTransaction(async (client) => {
    const cartResult = await client.query(
      `SELECT c.user_id, ci.product_id, ci.quantity, p.price_cents, p.currency
         FROM carts c
         JOIN cart_items ci ON ci.cart_id = c.id
         JOIN products p ON p.id = ci.product_id
        WHERE c.id = $1
        FOR UPDATE OF ci`,
      [cartId],
    );
    if (cartResult.rows.length === 0) throw new NotFoundError("cart");
    if (cartResult.rows[0].user_id !== userId) {
      throw new ConflictError("cart does not belong to user");
    }
    const items = cartResult.rows.map((r) => ({
      productId: r.product_id,
      quantity: r.quantity,
      priceCents: r.price_cents,
      currency: r.currency,
    }));
    const totals = computeTotals(items);
    const orderResult = await client.query(
      `INSERT INTO orders
         (user_id, status, subtotal_cents, discount_cents, tax_cents, shipping_cents,
          total_cents, currency, shipping_address, payment_method_id)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId,
        totals.subtotalCents,
        totals.discountCents,
        totals.taxCents,
        totals.shippingCents,
        totals.totalCents,
        items[0].currency,
        shippingAddress,
        paymentMethodId,
      ],
    );
    const orderId = orderResult.rows[0].id;
    for (const it of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4)`,
        [orderId, it.productId, it.quantity, it.priceCents],
      );
    }
    return { orderId, ...totals, currency: items[0].currency };
  }, ctx);
}
