import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { loadConfig } from "@ecom/shared-config";
import { UnauthorizedError, ForbiddenError } from "@ecom/shared-errors";

const BCRYPT_COST = 12;
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(user) {
  const cfg = loadConfig();
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, typ: "access" },
    cfg.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL, algorithm: "HS256" },
  );
}

export function signRefreshToken(user, jti) {
  const cfg = loadConfig();
  return jwt.sign(
    { sub: user.id, jti, typ: "refresh" },
    cfg.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL, algorithm: "HS256" },
  );
}

export function verifyToken(token) {
  const cfg = loadConfig();
  try {
    return jwt.verify(token, cfg.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    throw new UnauthorizedError("invalid or expired token");
  }
}

export function authRequired(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError());
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const claims = verifyToken(token);
    if (claims.typ !== "access") {
      return next(new UnauthorizedError("wrong token type"));
    }
    req.user = { id: claims.sub, email: claims.email, role: claims.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowed.includes(req.user.role)) {
      return next(new ForbiddenError(`role ${req.user.role} not allowed`));
    }
    return next();
  };
}

export function newCsrfToken() {
  return crypto.randomBytes(32).toString("base64url");
}
