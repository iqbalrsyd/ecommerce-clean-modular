import { query } from "@ecom/shared-db";
import { NotFoundError } from "@ecom/shared-errors";

export async function listProducts({ q, limit, offset }, ctx) {
  const { rows } = await query(
    `SELECT id, name, description, price_cents, currency, stock
       FROM products
      WHERE name ILIKE $1
      ORDER BY id
      LIMIT $2 OFFSET $3`,
    [`%${q}%`, limit, offset],
    ctx,
  );
  return rows;
}

export async function getProduct(id, ctx) {
  const { rows } = await query(
    `SELECT id, name, description, price_cents, currency, stock
       FROM products
      WHERE id = $1`,
    [id],
    ctx,
  );
  if (rows.length === 0) throw new NotFoundError("product");
  return rows[0];
}

export async function addReview(productId, userId, input, ctx) {
  const { rows } = await query(
    `INSERT INTO product_reviews (product_id, user_id, rating, title, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, rating, title, body, created_at`,
    [productId, userId, input.rating, input.title, input.body],
    ctx,
  );
  return rows[0];
}
