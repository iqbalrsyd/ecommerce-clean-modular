import rateLimit from "express-rate-limit";
import { loadConfig } from "@ecom/shared-config";
import { RateLimitedError } from "@ecom/shared-errors";

export function rateLimitBy(keyFn, options = {}) {
  const cfg = loadConfig();
  return rateLimit({
    windowMs: options.windowMs ?? cfg.RATE_LIMIT_WINDOW_MS,
    max: options.max ?? cfg.RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: keyFn,
    handler: (_req, _res, next) => {
      next(new RateLimitedError(Math.ceil((options.windowMs ?? cfg.RATE_LIMIT_WINDOW_MS) / 1000)));
    },
  });
}

export function perIpRateLimit(options) {
  return rateLimitBy((req) => req.ip, options);
}

export function perUserRateLimit(options) {
  return rateLimitBy((req) => req.user?.id ?? req.ip, options);
}
