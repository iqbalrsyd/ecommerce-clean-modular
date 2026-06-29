import { spawnSync } from "node:child_process";
const r = spawnSync("npx", ["--prefix", "client-app", "vite", "build"], { stdio: "inherit" });
process.exit(r.status ?? 0);
