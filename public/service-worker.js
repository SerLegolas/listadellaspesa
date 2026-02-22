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
      fetch(event.request)
        .then((networkResponse) => {
          // Aggiorna la cache con la risposta di rete
          caches.open(CACHE_NAME).then((cache) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
          });
          return networkResponse;
        })
        .catch(() => {
          // In caso di errore di rete, usa la cache
          return caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request);
          });
        });
      } catch (e) {
        return cachedResponse || Response.error();
      }
    })
  );
});
