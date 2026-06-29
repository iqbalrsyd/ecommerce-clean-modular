import { Router } from "express";
import { authRequired } from "@ecom/shared-auth";
import { parseOrThrow, CheckoutInput, OrderIdParam } from "../dto/checkout.js";
import { createOrderFromCart, computeTotals } from "../domain/checkout.js";

export function buildCheckoutRouter(ctx) {
  const router = Router();

  router.post("/orders", authRequired, async (req, res, next) => {
    try {
      const input = parseOrThrow(CheckoutInput, req.body);
      const order = await createOrderFromCart(
        { userId: req.user.id, ...input },
        ctx,
      );
      ctx.bus.emit("order.created", { orderId: order.orderId, userId: req.user.id, totalCents: order.totalCents });
      res.status(201).json({ data: order });
    } catch (err) { next(err); }
  });

  router.get("/orders/:id", authRequired, async (req, res, next) => {
    try {
      const { id } = parseOrThrow(OrderIdParam, req.params);
      const { rows } = await ctx.db.query(
        `SELECT o.id, o.user_id, o.status, o.subtotal_cents, o.discount_cents,
                o.tax_cents, o.shipping_cents, o.total_cents, o.currency,
                o.created_at
           FROM orders o
          WHERE o.id = $1`,
        [id],
        ctx,
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "order not found" } });
      }
      if (rows[0].user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "not your order" } });
      }
      res.json({ data: rows[0] });
    } catch (err) { next(err); }
  });

  router.post("/orders/:id/quote", authRequired, (req, res, next) => {
    try {
      const totals = computeTotals(req.body.items ?? [], req.body.discountCents ?? 0);
      res.json({ data: totals });
    } catch (err) { next(err); }
  });

  return router;
}
