const CACHE_NAME = "jejuoreum-v1";

self.addEventListener("install", () => {
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
  const url = event.request.url;

  // Only handle http/https requests
  if (!url.startsWith("http")) return;

  // Network-only for API, admin, auth routes
  if (url.includes("/api/") || url.includes("/admin") || url.includes("/auth/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && event.request.method === "GET") {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, cloned)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
