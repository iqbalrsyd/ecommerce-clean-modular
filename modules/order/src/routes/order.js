import { Router } from "express";
import { authRequired } from "@ecom/shared-auth";
import { parseOrThrow, OrderListQuery } from "../dto/order.js";
import { listOrdersForUser } from "../domain/order.js";

export function buildOrderRouter(ctx) {
  const router = Router();

  router.get("/orders", authRequired, async (req, res, next) => {
    try {
      const q = parseOrThrow(OrderListQuery, req.query);
      const { items, nextCursor } = await listOrdersForUser({ userId: req.user.id, ...q }, ctx);
      res.json({ data: items, paging: { nextCursor, limit: q.limit } });
    } catch (err) { next(err); }
  });

  return router;
}
