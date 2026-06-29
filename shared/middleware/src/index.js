import crypto from "node:crypto";
import { AppError } from "@ecom/shared-errors";
import { getRequestContext } from "@ecom/shared-logger";

const SAFE_HEADERS = new Set([
  "host",
  "user-agent",
  "accept",
  "accept-language",
  "content-type",
  "content-length",
  "referer",
  "origin",
]);

export function requestId() {
  return (req, res, next) => {
    const incoming = req.headers["x-request-id"];
    const id = typeof incoming === "string" && incoming.length <= 128
      ? incoming
      : crypto.randomUUID();
    res.setHeader("X-Request-Id", id);
    req.id = id;
    next();
  };
}

export function requestContext(als) {
  return (req, res, next) => {
    als.run({ requestId: req.id, userId: req.user?.id }, () => next());
  };
}

export function safeLogger(logger) {
  return (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const headers = Object.fromEntries(
        Object.entries(req.headers).filter(([k]) => SAFE_HEADERS.has(k.toLowerCase())),
      );
      logger.info({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
        requestId: req.id,
        userId: req.user?.id ?? null,
        headers,
      });
    });
    next();
  };
}

export function notFound() {
  return (req, res, next) => next(new AppError("NOT_FOUND", `route ${req.method} ${req.path} not found`, { status: 404 }));
}

export function errorHandler(logger) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, _next) => {
    if (err instanceof AppError) {
      logger.warn({ err, requestId: req.id, path: req.path }, "handled error");
      return res.status(err.status).json({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }
    logger.error({ err, requestId: req.id, path: req.path }, "unhandled error");
    return res.status(500).json({
      error: { code: "INTERNAL", message: "internal server error" },
    });
  };
}
