import { query } from "@ecom/shared-db";

export async function listOrdersForUser({ userId, status, limit, cursor }, ctx) {
  const params = [userId];
  let where = "user_id = $1";
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  if (cursor) {
    params.push(cursor);
    where += ` AND id < $${params.length}`;
  }
  params.push(limit + 1);
  const { rows } = await query(
    `SELECT id, status, total_cents, currency, created_at
       FROM orders
      WHERE ${where}
      ORDER BY id DESC
      LIMIT $${params.length}`,
    params,
    ctx,
  );
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}
