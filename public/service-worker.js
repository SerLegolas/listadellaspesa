// Increment this version whenever you deploy a new release so that
// the old HTML/css/js files are purged and clients fetch the fresh copy.
// versione cache incrementata per forzare aggiornamento su deploy
const CACHE_NAME = 'listaspesa-v3';
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

    // navigazioni (richieste HTML) devono sempre tornare dalla rete, ma
    // se riceviamo un 304 lo interpretiamo come "nessun contenuto nuovo" e
    // restituiamo la copia cache.
    const isNavigation = event.request.mode === 'navigate';

    try {
      const networkOptions = isNavigation ? { cache: 'no-store' } : { cache: 'reload' };
      const networkResponse = await fetch(event.request, networkOptions);

      if (networkResponse && networkResponse.status === 200) {
        // aggiorna cache SIA per html sia per altri asset
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      }

      // gestione 304 o altre risposte non-200
      if (networkResponse && networkResponse.status === 304 && cachedResponse) {
        // già avevamo una copia valida, restituiamola
        return cachedResponse;
      }

      // per altre risposte (es. 500) ritorna comunque la networkResponse;
      // se è una fetch di navigazione può contenere un body vuoto ma il
      // browser mostrerà la pagina corretta dalla cache
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
