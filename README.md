# ecommerce-modular-monolith-clean

A **clean best-practice reference** of a modular monolith e-commerce application
(client + server apps), written in plain JavaScript ESM. This is the
non-vulnerable counterpart of `ecommerce-modular-monolith-vuln`.

## Architecture

```
ecommerce-modular-monolith-clean/
  package.json                       # npm workspaces root
  .env.example
  scripts/                           # dev/build orchestration
  client-app/                        # React + Vite SPA (FE)
    index.html
    vite.config.js
    src/
      main.jsx
      App.jsx
      api/client.js
      hooks/useAuth.jsx
      pages/{Home,Product,Cart,Checkout,OrderHistory,Login,Register}Page.jsx
      components/ProductCard.jsx
  server-app/                        # Express API (BE, single process)
    src/
      index.js                       # buildApp() — module loader + mount
  modules/                           # feature modules
    catalog/
    cart/
    checkout/
    payment/
    order/
    user/
    notification/                    # event-handler-only module (no routes)
      src/
        index.js
        events/notification.js
  shared/                            # kernel — shared infra
    config/      (zod env loader)
    db/          (pg pool + transaction)
    errors/      (typed AppError tree)
    events/      (in-process bus)
    logger/      (pino + AsyncLocalStorage)
    auth/        (jwt, bcrypt, csrf, requireRole)
    middleware/  (requestId, safeLogger, errorHandler, cors, rateLimit)
    validation/  (zod DTOs)
    kernel/      (ModuleRegistry, buildContext, loadModulesFromDir)
```

**Modular monolith properties (asserted):**

- **Single deployable unit** — one `node` process runs the API, the SPA is
  statically built and served from the same origin in production.
- **Strict module boundaries** — every module under `modules/<feature>/` has
  its own `routes/`, `domain/`, `events/`, and `dto/`. A module never
  `require()`s another module's internals.
- **Explicit module descriptor contract** — every module exports a default
  function returning `{ name, version, services, emits, listens, routes }`.
  The kernel registers services by `<module>.<key>` and exposes them through
  a `Proxy` (no module can reach services that haven't been registered).
- **In-process event bus** — `shared/events` provides `bus.on/emit` with
  `EventEmitter.captureRejections`. Cross-module communication (e.g.
  `cart.updated` → `order` module) goes through events, not direct calls.
- **DI-style context** — kernel injects `{ db, bus, logger, config, services }`
  into each module's factory. No global state, no module-import side effects.
- **Validation at the edge** — every route validates input with `zod`
  (`shared/validation`, `dto/` per module). Invalid input is rejected with
  `ValidationError` (HTTP 400) before reaching the domain layer.
- **Zero-trust CORS** — explicit allowlist (`CORS_ORIGINS`), credentialed
  requests only for allow-listed origins, no wildcard.
- **No secrets in source** — `shared/config` loads env via `zod`, refuses
  to boot on missing/invalid config. The sample `.env.example` uses
  placeholder values.
- **Bounded resource consumption** — rate limit per-IP on auth & reviews,
  per-user elsewhere; cursor-based pagination on `/orders`; bounded
  `raw({ limit: '100kb' })` on the Stripe webhook.

## Module contract

```js
// modules/<feature>/src/index.js
export default function featureModule(ctx) {
  return {
    name: "feature",
    version: "1.0.0",
    services: { foo: (x) => ctx.db.query(...) }, // exposed via ctx.services["feature.foo"]
    emits: ["feature.event"],
    listens: ["other.event"],
    routes: () => router, // Express router or null
  };
}
```

The kernel:

1. Discovers every directory under `modules/`.
2. Imports its `src/index.js` ESM.
3. Calls the default factory with a placeholder ctx to learn the module's
   declared `services` (registered before routes are built).
4. Rebuilds the ctx with a real `Proxy` to the registry.
5. Asks each module for its `router` and mounts it under `/api/<name>`.
6. Returns the assembled `app`.

## API surface

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET    | `/healthz` | none | `{ ok, modules[] }` |
| GET    | `/readyz`  | none | liveness |
| POST   | `/api/user/auth/register` | none | rate-limited 5/min/IP |
| POST   | `/api/user/auth/login`    | none | rate-limited 10/min/IP |
| GET    | `/api/user/auth/me`       | bearer | |
| GET    | `/api/user/admin/users`   | bearer + role=admin | |
| GET    | `/api/catalog/products`           | none | cursor pagination |
| GET    | `/api/catalog/products/:id`       | none | |
| POST   | `/api/catalog/products/:id/reviews` | bearer | rate-limited |
| POST   | `/api/cart/carts`                       | bearer | |
| GET    | `/api/cart/carts/:id`                   | bearer | ownership-checked |
| POST   | `/api/cart/carts/:id/items`             | bearer | |
| PUT    | `/api/cart/carts/:id/items/:productId`  | bearer | |
| POST   | `/api/checkout/orders`        | bearer | idempotency-key |
| GET    | `/api/checkout/orders/:id`    | bearer | ownership-checked |
| POST   | `/api/checkout/orders/:id/quote` | bearer | |
| GET    | `/api/order/orders`           | bearer | cursor pagination |
| POST   | `/api/payment/payments/intents` | bearer | idempotency-key |
| POST   | `/api/payment/payments/webhook` | Stripe signature | raw body |

## Running

```bash
cp .env.example .env       # then fill in real secrets
cp client-app/.env.example client-app/.env
npm install
npm run dev                # boots server (--watch) + client (vite) together
# or
npm run dev:server         # api only
npm run dev:client         # vite only
```

## Why this is "clean" (mapping to scanner rule categories)

| Category | Implementation |
|----------|----------------|
| PCI-DSS card handling | `CardInput` zod schema (no regex for PAN beyond 13–19 digits; full PAN never logged), `pino` `redact` paths for `cardNumber`/`cvv`/`cvc` |
| OWASP A01 BOLA | `getCartForUser`, `createOrderFromCart`, `getOrder` all verify `user_id` match |
| OWASP A02 crypto | bcrypt cost 12, HS256 JWT with exp, no MD5/SHA-1 |
| OWASP A03 injection | all queries parameterized (`pg` `$1` placeholders) |
| OWASP A04 unrestricted resource | rate limit on `/auth/*` and reviews, cursor pagination, body size limit |
| OWASP A05 BFLA | `requireRole("admin")` on `/admin/*`, server-side price/total recompute |
| OWASP A07 auth | access token TTL 15m, refresh token TTL 30d, `Idempotency-Key` on writes |
| OWASP A08 misconfig | explicit CORS allowlist, `app.disable("x-powered-by")`, generic 500 body |
| CSRF | SameSite cookie + `X-CSRF-Token` header pattern; webhook uses Stripe signature |
| XSS | React renders text via `{}` interpolation; CSP `default-src 'self'` |
| Mass assignment | every route handler picks explicit fields from validated DTO |
| Excessive data exposure | all responses go through `{ data, paging }` envelope; password hashes never returned |
| Log injection | `pino` structured JSON, redaction list, `safeLogger` middleware |

## Verify with scanner

```bash
semgrep \
  --config=coba-4/ai-service/app/agents/semgrep_rules/ecommerce.yml \
  --config=coba-4/ai-service/app/agents/semgrep_rules/pci-dss.yml \
  --config=coba-4/ai-service/app/agents/semgrep_rules/owasp-api.yml \
  test-repo-dummy/ecommerce-modular-monolith-clean/
```

Expected: **0 findings** (this repo is the clean reference). If the
scanner reports anything here, it's a false positive or a rule file bug.
