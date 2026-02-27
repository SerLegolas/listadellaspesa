// Increment this version whenever you deploy a new release so that
// the old HTML/css/js files are purged and clients fetch the fresh copy.
// versione cache incrementata per forzare aggiornamento su deploy
// il nome della cache include il timestamp di build in modo da
// aggiornarsi automaticamente a ogni nuovo deploy/build. non serve più
// modificare manualmente il valore prima del commit.
const CACHE_NAME = 'listaspesa-' + new Date().toISOString().replace(/[:\.]/g, '-');
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

// gestore messaggi dal client per skipWaiting
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Rete-primario: forziamo il reload dalla rete e aggiorniamo la cache.
// in particolare le richieste di navigazione (html) devono sempre passare
// dalla rete perché altrimenti il browser potrebbe rispondere con un 304 e
// il service worker restituire il vecchio contenuto.
self.addEventListener('fetch', event => {
  // per documenti di navigazione evitiamo completamente la cache del SW. in
  // questo modo la pagina verrà sempre scaricata da rete (con `no-store`)
  // e non saranno conservate versioni "vecchie" dal service worker.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(event.request, { cache: 'no-store' });
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;
        return new Response('Offline e nessuna cache', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);

    try {
      const networkResponse = await fetch(event.request, { cache: 'reload' });
      if (networkResponse && networkResponse.status === 200) {
        // solo cache richieste http/https e di tipo GET, per evitare errori
        // con schemi non supportati o metodi come POST/PUT
        if (event.request.method === 'GET' && /^https?:/.test(event.request.url)) {
          cache.put(event.request, networkResponse.clone());
        }
      }
      return networkResponse;
    } catch (e) {
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response('Offline e nessuna cache', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  })());
});
