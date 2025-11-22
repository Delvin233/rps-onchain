const CACHE_NAME = 'rps-v2';
const RUNTIME_CACHE = 'rps-runtime';
const STATIC_ASSETS = [
  '/',
  '/play',
  '/profile',
  '/history',
  '/game/ai',
  '/rpsOnchainFavicons/site.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => 
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      
      return fetch(request).then((response) => {
        if (response.status === 200 && url.origin === location.origin) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => caches.match('/'));
    })
  );
});
