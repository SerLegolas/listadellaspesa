const CACHE_NAME = 'listaspesa-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png',
  '/icon.svg',
  '/flaticon.svg',
  // aggiungi altri file statici se necessario
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  clients.claim();
});

// Forza reload dopo ogni fetch se la risposta è diversa dalla cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request);
      try {
        const networkResponse = await fetch(event.request);
        if (!cachedResponse || !networkResponse || cachedResponse.status !== networkResponse.status || cachedResponse.headers.get('ETag') !== networkResponse.headers.get('ETag')) {
          cache.put(event.request, networkResponse.clone());
          // Forza reload se la risposta è diversa
          if (self.clients) {
            self.clients.matchAll().then(clients => {
              clients.forEach(client => client.navigate(client.url));
            });
          }
        }
        return networkResponse;
      } catch (e) {
        return cachedResponse || Response.error();
      }
    })
  );
});
