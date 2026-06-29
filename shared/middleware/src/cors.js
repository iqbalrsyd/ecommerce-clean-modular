import { loadConfig } from "@ecom/shared-config";

export function buildCors() {
  const cfg = loadConfig();
  const allow = new Set(cfg.corsOrigins);
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allow.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Idempotency-Key");
    res.setHeader("Access-Control-Max-Age", "600");
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  };
}
