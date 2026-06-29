import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.services = new Map();
  }

  register(mod) {
    if (!mod?.name) throw new Error("module must export { name }");
    if (this.modules.has(mod.name)) {
      throw new Error(`module ${mod.name} already registered`);
    }
    this.modules.set(mod.name, mod);
    for (const [key, value] of Object.entries(mod.services ?? {})) {
      this.services.set(`${mod.name}.${key}`, value);
    }
  }

  get(name) {
    return this.modules.get(name);
  }

  service(fqn) {
    return this.services.get(fqn);
  }

  list() {
    return Array.from(this.modules.values());
  }
}

export function buildContext({ registry, db, bus, logger, config }) {
  return {
    db,
    bus,
    logger,
    config,
    services: new Proxy(
      {},
      {
        get: (_target, fqn) => {
          if (typeof fqn !== "string") return undefined;
          const value = registry.service(fqn);
          if (!value) {
            throw new Error(`service "${fqn}" not found in module registry`);
          }
          return value;
        },
      },
    ),
  };
}

export async function loadModulesFromDir(dir) {
  const abs = resolve(dir);
  const entries = readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(abs, e.name, "src", "index.js"));
  const modules = [];
  for (const file of entries) {
    const mod = (await import(pathToFileURL(file).href)).default;
    if (mod?.name) modules.push({ mod, file });
  }
  return modules;
}
