const CACHE_NAME = 'lingo-cache-v1';

// L'elenco dei file da scaricare subito in memoria
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.jpg'
];

// 1. FASE DI INSTALLAZIONE
self.addEventListener('install', event => {
  console.log('[Service Worker] Installazione...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Scaricamento file principali in cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. FASE DI INTERCETTAZIONE DELLA RETE (Il cuore dell'Offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se il file è già nella cache (es. style.css), restituiscilo immediatamente (offline)
        if (response) {
          return response;
        }
        // Altrimenti, se non c'è, scaricalo da internet
        return fetch(event.request);
      })
  );
});

// 3. FASE DI AGGIORNAMENTO CACHE (Se cambi versione dell'app)
self.addEventListener('activate', event => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Cancello vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});