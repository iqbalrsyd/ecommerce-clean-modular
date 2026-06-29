import { spawn } from "node:child_process";

function run(name, cmd, args, color) {
  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], env: process.env });
  const prefix = `\x1b[${color}m[${name}]\x1b[0m `;
  child.stdout.on("data", (b) => process.stdout.write(b.toString().split("\n").filter(Boolean).map((l) => prefix + l).join("\n") + "\n"));
  child.stderr.on("data", (b) => process.stderr.write(b.toString().split("\n").filter(Boolean).map((l) => prefix + l).join("\n") + "\n"));
  child.on("exit", (code) => process.exit(code ?? 0));
  return child;
}

run("server", "node", ["--watch", "server-app/src/index.js"], "36");
run("client", "npx", ["--prefix", "client-app", "vite"], "35");
