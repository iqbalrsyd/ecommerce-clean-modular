import express from "express";
import { loadConfig } from "@ecom/shared-config";
import { createLogger } from "@ecom/shared-logger";
import { bus } from "@ecom/shared-events";
import { getPool } from "@ecom/shared-db";
import { ModuleRegistry, buildContext, loadModulesFromDir } from "@ecom/shared-kernel";
import {
  requestId,
  safeLogger,
  notFound,
  errorHandler,
} from "@ecom/shared-middleware";
import { buildCors } from "@ecom/shared-middleware/cors";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const modulesRoot = resolve(__dirname, "../../../modules");

export async function buildApp() {
  const config = loadConfig();
  const logger = createLogger(config);
  const db = { query: getPool().query.bind(getPool()) };

  const registry = new ModuleRegistry();
  const discovered = await loadModulesFromDir(modulesRoot);
  const placeholderCtx = { db, bus, logger, config, services: {} };
  for (const { mod } of discovered) {
    const instance = mod(placeholderCtx);
    registry.register(instance);
  }

  const ctx = buildContext({ registry, db, bus, logger, config });
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestId());
  app.use(buildCors());
  app.use(safeLogger(logger));

  app.get("/healthz", (_req, res) => res.json({ ok: true, modules: registry.list().map((m) => m.name) }));
  app.get("/readyz", (_req, res) => res.json({ ok: true }));

  for (const mod of registry.list()) {
    if (typeof mod.routes === "function") {
      const router = mod.routes(ctx);
      if (router) {
        app.use(`/api/${mod.name}`, router);
        logger.info({ module: mod.name }, "mounted routes");
      }
    }
  }

  app.use(notFound());
  app.use(errorHandler(logger));
  return { app, registry, logger };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const { app } = await buildApp();
  app.listen(config.PORT, "0.0.0.0", () => {
    console.log(`ecom-api listening on :${config.PORT}`);
  });
}
