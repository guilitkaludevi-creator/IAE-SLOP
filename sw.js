const CACHE = "mosaique-sante-v2026-11-20-v11";
const CORE = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./data.js",
  "./firebase-init.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// Network-First strategy: guarantees fresh deployment updates are served immediately when online!
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is offline or unreachable
        return caches.match(event.request).then(cached => cached || caches.match("./index.html"));
      })
  );
});
