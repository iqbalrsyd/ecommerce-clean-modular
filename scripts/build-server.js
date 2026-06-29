import { spawnSync } from "node:child_process";
const r = spawnSync("node", ["--check", "server-app/src/index.js"], { stdio: "inherit" });
process.exit(r.status ?? 0);
