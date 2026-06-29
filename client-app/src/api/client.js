let accessToken = null;
let csrfToken = null;
let refreshPromise = null;

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const api = {
  setAccessToken(token) {
    accessToken = token;
  },
  setCsrfToken(token) {
    csrfToken = token;
  },
  async request(path, init = {}) {
    const url = path.startsWith("/") ? path : `/${path}`;
    const headers = new Headers(init.headers ?? {});
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (init.method && init.method !== "GET") {
      headers.set("Idempotency-Key", newIdempotencyKey());
    }
    const res = await fetch(`/api${url}`, { ...init, headers, credentials: "same-origin" });
    if (res.status === 401 && !init._retried) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request(path, { ...init, _retried: true });
      }
    }
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const err = new Error(body?.error?.message ?? res.statusText);
      err.status = res.status;
      err.code = body?.error?.code;
      err.details = body?.error?.details;
      throw err;
    }
    return body;
  },
  async tryRefresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) return false;
        const body = await res.json();
        accessToken = body.data?.accessToken ?? null;
        return Boolean(accessToken);
      })
      .catch(() => false)
      .finally(() => { refreshPromise = null; });
    return refreshPromise;
  },
  get(path) { return this.request(path, { method: "GET" }); },
  post(path, body) { return this.request(path, { method: "POST", body }); },
  put(path, body) { return this.request(path, { method: "PUT", body }); },
  delete(path) { return this.request(path, { method: "DELETE" }); },
};
