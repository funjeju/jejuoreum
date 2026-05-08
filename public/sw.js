const CACHE_NAME = "jejuoreum-v2";

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

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { return; }

  const title = payload.title ?? "제주 오름 패스포트";
  const options = {
    body:  payload.body ?? "",
    icon:  payload.icon  ?? "/icon.svg",
    badge: payload.badge ?? "/icon.svg",
    data:  payload.data  ?? {},
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/ko";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((all) => {
        const existing = all.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return clients.openWindow(url);
      })
  );
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
