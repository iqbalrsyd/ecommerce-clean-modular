import { Router } from "express";
import crypto from "node:crypto";
import { query } from "@ecom/shared-db";
import { authRequired, signAccessToken, signRefreshToken, requireRole } from "@ecom/shared-auth";
import { perIpRateLimit } from "@ecom/shared-middleware/rateLimit";
import { parseOrThrow, RegisterInput, LoginInput, UserIdParam } from "../dto/user.js";
import { registerUser, authenticateUser, getUserById } from "../domain/user.js";

export function buildUserRouter(ctx) {
  const router = Router();

  router.post(
    "/auth/register",
    perIpRateLimit({ max: 5, windowMs: 60_000 }),
    async (req, res, next) => {
      try {
        const input = parseOrThrow(RegisterInput, req.body);
        const user = await registerUser(input, ctx);
        ctx.bus.emit("user.registered", { userId: user.id, email: user.email });
        res.status(201).json({ data: { id: user.id, email: user.email, displayName: user.display_name } });
      } catch (err) { next(err); }
    },
  );

  router.post(
    "/auth/login",
    perIpRateLimit({ max: 10, windowMs: 60_000 }),
    async (req, res, next) => {
      try {
        const input = parseOrThrow(LoginInput, req.body);
        const user = await authenticateUser(input, ctx);
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user, crypto.randomUUID());
        ctx.bus.emit("user.logged_in", { userId: user.id });
        res.json({ data: { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } } });
      } catch (err) { next(err); }
    },
  );

  router.get("/auth/me", authRequired, async (req, res, next) => {
    try {
      const user = await getUserById(req.user.id, ctx);
      res.json({ data: { id: user.id, email: user.email, displayName: user.display_name, role: user.role } });
    } catch (err) { next(err); }
  });

  router.get(
    "/admin/users",
    authRequired,
    requireRole("admin"),
    async (req, res, next) => {
      try {
        const { rows } = await query(
          `SELECT id, email, display_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 200`,
          [],
          ctx,
        );
        res.json({ data: rows });
      } catch (err) { next(err); }
    },
  );

  return router;
}
