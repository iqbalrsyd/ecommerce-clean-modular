import { Router } from "express";
import { parseOrThrow, ProductIdParam, ProductSearchQuery, ReviewInput } from "../dto/catalog.js";
import { listProducts, getProduct, addReview } from "../domain/catalog.js";
import { authRequired } from "@ecom/shared-auth";
import { perIpRateLimit } from "@ecom/shared-middleware/rateLimit";

export function buildCatalogRouter(ctx) {
  const router = Router();

  router.get("/products", async (req, res, next) => {
    try {
      const q = parseOrThrow(ProductSearchQuery, req.query);
      const products = await listProducts(q, ctx);
      res.json({ data: products, paging: { limit: q.limit, offset: q.offset } });
    } catch (err) { next(err); }
  });

  router.get("/products/:id", async (req, res, next) => {
    try {
      const { id } = parseOrThrow(ProductIdParam, req.params);
      const product = await getProduct(id, ctx);
      res.json({ data: product });
    } catch (err) { next(err); }
  });

  router.post(
    "/products/:id/reviews",
    authRequired,
    perIpRateLimit({ max: 5, windowMs: 60_000 }),
    async (req, res, next) => {
      try {
        const { id } = parseOrThrow(ProductIdParam, req.params);
        const input = parseOrThrow(ReviewInput, req.body);
        const review = await addReview(id, req.user.id, input, ctx);
        ctx.bus.emit("product.review.created", { productId: id, userId: req.user.id, reviewId: review.id });
        res.status(201).json({ data: review });
      } catch (err) { next(err); }
    },
  );

  return router;
}
