// World Cup 2026 — Floating Lighthouse service worker
// Versioned caches; bump CACHE_VERSION to invalidate.
const CACHE_VERSION = "wc26-v1";
const SHELL = `${CACHE_VERSION}-shell`;
const RUNTIME = `${CACHE_VERSION}-runtime`;
const API = `${CACHE_VERSION}-api`;

const SHELL_URLS = ["/", "/matches", "/teams", "/bracket", "/me", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

const isApi = (url) => url.pathname.startsWith("/api/");
const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/_next/image") ||
  /\.(?:js|css|woff2|woff|ttf|png|jpg|jpeg|svg|ico|webp|avif)$/.test(url.pathname);

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok && res.type !== "opaque") cache.put(req, res.clone()).catch(() => undefined);
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone()).catch(() => undefined);
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    // Last resort: offline shell.
    const shell = await caches.match("/");
    if (shell) return shell;
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isApi(url)) {
    event.respondWith(staleWhileRevalidate(req, API));
    return;
  }
  if (isStatic(url)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }
  // HTML navigations
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(req, SHELL));
  }
});
