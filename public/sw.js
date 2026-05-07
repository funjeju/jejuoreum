const CACHE_NAME = "jejuoreum-v1";
const STATIC_ASSETS = [
  "/ko",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network-first for API routes; cache-first for static assets
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => new Response("", { status: 503 }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ?? fetch(event.request).then((res) => {
        if (res.ok && event.request.method === "GET") {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, cloned));
        }
        return res;
      })
    )
  );
});
