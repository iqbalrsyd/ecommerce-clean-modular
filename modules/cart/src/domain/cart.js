import { query, withTransaction } from "@ecom/shared-db";
import { NotFoundError, ForbiddenError } from "@ecom/shared-errors";

export async function getCart(cartId, ctx) {
  const { rows } = await query(
    `SELECT c.id, c.user_id, c.created_at, c.updated_at,
            ci.product_id, ci.quantity
       FROM carts c
       LEFT JOIN cart_items ci ON ci.cart_id = c.id
      WHERE c.id = $1`,
    [cartId],
    ctx,
  );
  if (rows.length === 0) throw new NotFoundError("cart");
  const first = rows[0];
  return {
    id: first.id,
    userId: first.user_id,
    items: rows
      .filter((r) => r.product_id != null)
      .map((r) => ({ productId: r.product_id, quantity: r.quantity })),
  };
}

export async function getCartForUser(cartId, userId, ctx) {
  const cart = await getCart(cartId, ctx);
  if (cart.userId !== userId) {
    throw new ForbiddenError("cart does not belong to user");
  }
  return cart;
}

export async function createCart(userId, ctx) {
  const { rows } = await query(
    `INSERT INTO carts (user_id) VALUES ($1) RETURNING id, user_id, created_at`,
    [userId],
    ctx,
  );
  return { id: rows[0].id, userId: rows[0].user_id };
}

export async function addItem(cartId, userId, input, ctx) {
  await assertOwnership(cartId, userId, ctx);
  return withTransaction(async (client) => {
    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [cartId, input.productId, input.quantity],
    );
    return getCart(cartId, ctx);
  });
}

export async function setItemQuantity(cartId, userId, productId, quantity, ctx) {
  await assertOwnership(cartId, userId, ctx);
  if (quantity === 0) {
    await query(
      `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [cartId, productId],
      ctx,
    );
  } else {
    await query(
      `UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND product_id = $2`,
      [cartId, productId, quantity],
      ctx,
    );
  }
  return getCart(cartId, ctx);
}

async function assertOwnership(cartId, userId, ctx) {
  const { rows } = await query(`SELECT user_id FROM carts WHERE id = $1`, [cartId], ctx);
  if (rows.length === 0) throw new NotFoundError("cart");
  if (rows[0].user_id !== userId) throw new ForbiddenError("cart does not belong to user");
}
