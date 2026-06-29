import { query } from "@ecom/shared-db";
import { hashPassword, verifyPassword } from "@ecom/shared-auth";
import { ConflictError, NotFoundError, UnauthorizedError } from "@ecom/shared-errors";

export async function registerUser({ email, password, displayName }, ctx) {
  const existing = await query(`SELECT 1 FROM users WHERE email = $1`, [email], ctx);
  if (existing.rows.length > 0) {
    throw new ConflictError("email already registered");
  }
  const passwordHash = await hashPassword(password);
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, display_name, role)
     VALUES ($1, $2, $3, 'customer')
     RETURNING id, email, display_name, role, created_at`,
    [email, passwordHash, displayName],
    ctx,
  );
  return rows[0];
}

export async function authenticateUser({ email, password }, ctx) {
  const { rows } = await query(
    `SELECT id, email, password_hash, role FROM users WHERE email = $1`,
    [email],
    ctx,
  );
  if (rows.length === 0) throw new UnauthorizedError("invalid credentials");
  const ok = await verifyPassword(password, rows[0].password_hash);
  if (!ok) throw new UnauthorizedError("invalid credentials");
  return { id: rows[0].id, email: rows[0].email, role: rows[0].role };
}

export async function getUserById(id, ctx) {
  const { rows } = await query(
    `SELECT id, email, display_name, role, created_at FROM users WHERE id = $1`,
    [id],
    ctx,
  );
  if (rows.length === 0) throw new NotFoundError("user");
  return rows[0];
}
