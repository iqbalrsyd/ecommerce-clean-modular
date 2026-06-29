import pg from "pg";
import { loadConfig } from "@ecom/shared-config";

const { Pool } = pg;

let pool;

export function getPool() {
  if (pool) return pool;
  const cfg = loadConfig();
  pool = new Pool({
    connectionString: cfg.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    ssl: cfg.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
  });
  pool.on("error", (err) => {
    console.error("[db] idle client error:", err);
  });
  return pool;
}

export async function query(text, params) {
  const start = Date.now();
  const res = await getPool().query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    console.warn(`[db] slow query (${duration}ms): ${text}`);
  }
  return res;
}

export async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
