import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";

const als = new AsyncLocalStorage();

export function createLogger(config) {
  return pino({
    level: config.NODE_ENV === "production" ? "info" : "debug",
    base: { service: "ecom-api", env: config.NODE_ENV },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.password",
        "req.body.cardNumber",
        "req.body.card_number",
        "req.body.cvv",
        "req.body.cvc",
        "*.cardNumber",
        "*.card_number",
        "*.cvv",
        "*.passwordHash",
        "*.password",
        "*.stripeCustomerId",
        "res.body.token",
      ],
      censor: "[REDACTED]",
    },
    mixin() {
      const store = als.getStore();
      return store ? { requestId: store.requestId, userId: store.userId } : {};
    },
  });
}

export function runWithRequestContext(ctx, fn) {
  return als.run(ctx, fn);
}

export function getRequestContext() {
  return als.getStore();
}
