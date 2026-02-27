// Increment this version whenever you deploy a new release so that
// the old HTML/css/js files are purged and clients fetch the fresh copy.
const CACHE_NAME = 'listaspesa-v2';
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

// Rete-primario: forziamo il reload dalla rete e aggiorniamo la cache.
// in particolare le richieste di navigazione (html) devono sempre passare
// dalla rete perché altrimenti il browser potrebbe rispondere con un 304 e
// il service worker restituire il vecchio contenuto.
self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);

    try {
      // usa cache: 'reload' per aggirare conditional GET e ricevere sempre
      // una versione aggiornata dal server
      const networkResponse = await fetch(event.request, { cache: 'reload' });

      // salva solo risposte davvero valide (200 OK)
      if (networkResponse && networkResponse.status === 200) {
        cache.put(event.request, networkResponse.clone());
      }
      // restituisci la risposta di rete in ogni caso (anche 304 o 500),
      // il browser la gestirà correttamente
      return networkResponse;
    } catch (e) {
      // rete non disponibile: prova a tornare alla cache
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
