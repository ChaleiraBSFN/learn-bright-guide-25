const isWorkboxCacheForThisRegistration = (name) => {
  const hasWorkboxBucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  return hasWorkboxBucket || name.includes("workbox") || name.includes("supabase-api");
};

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const shouldBypassCache =
    event.request.mode === "navigate" ||
    ["document", "script", "style"].includes(event.request.destination);

  if (!shouldBypassCache) return;

  event.respondWith(fetch(new Request(event.request, { cache: "no-store" })));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const appCacheNames = cacheNames.filter(isWorkboxCacheForThisRegistration);
        await Promise.allSettled(appCacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })()
  );
});