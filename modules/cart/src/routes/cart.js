import { Router } from "express";
import { authRequired } from "@ecom/shared-auth";
import { parseOrThrow, AddItemInput, UpdateQuantityInput, CartIdParam } from "../dto/cart.js";
import { getCartForUser, createCart, addItem, setItemQuantity } from "../domain/cart.js";

export function buildCartRouter(ctx) {
  const router = Router();

  router.post("/carts", authRequired, async (req, res, next) => {
    try {
      const cart = await createCart(req.user.id, ctx);
      res.status(201).json({ data: cart });
    } catch (err) { next(err); }
  });

  router.get("/carts/:id", authRequired, async (req, res, next) => {
    try {
      const { id } = parseOrThrow(CartIdParam, req.params);
      const cart = await getCartForUser(id, req.user.id, ctx);
      res.json({ data: cart });
    } catch (err) { next(err); }
  });

  router.post("/carts/:id/items", authRequired, async (req, res, next) => {
    try {
      const { id } = parseOrThrow(CartIdParam, req.params);
      const input = parseOrThrow(AddItemInput, req.body);
      const cart = await addItem(id, req.user.id, input, ctx);
      res.json({ data: cart });
    } catch (err) { next(err); }
  });

  router.put("/carts/:id/items/:productId", authRequired, async (req, res, next) => {
    try {
      const { id, productId } = req.params;
      const { quantity } = parseOrThrow(UpdateQuantityInput, req.body);
      const cart = await setItemQuantity(
        Number(id),
        req.user.id,
        Number(productId),
        quantity,
        ctx,
      );
      res.json({ data: cart });
    } catch (err) { next(err); }
  });

  return router;
}
