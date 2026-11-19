/* Offline-first cache for the birthday journey. */
const CACHE = "dody-birthday-v1";
const CORE = [
  "./",
  "index.html",
  "css/main.css",
  "css/scenes.css",
  "css/garden.css",
  "css/computer.css",
  "css/chandelier.css",
  "css/celebration.css",
  "css/animations.css",
  "css/responsive.css",
  "js/password.js",
  "js/music.js",
  "js/countdown.js",
  "js/scenes.js",
  "js/interactions.js",
  "js/main.js",
  "assets/fonts/tajawal-400.ttf",
  "assets/fonts/tajawal-500.ttf",
  "assets/fonts/tajawal-700.ttf",
  "assets/fonts/tajawal-800.ttf",
  "assets/fonts/aref-ruqaa-400.ttf",
  "assets/fonts/aref-ruqaa-700.ttf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
