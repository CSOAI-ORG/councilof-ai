// MEOK WORLD Service Worker — PWA install + offline shell + live data caching
const VERSION = 'meok-v2.0.0';
const SHELL = 'meok-shell-v1';
const RUNTIME = 'meok-runtime-v1';
const SHELL_URLS = [
  '/',
  '/csoai-os/v2-temple-os.html',
  '/csoai-os/v2-signup-wizard.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // API: network-first, fall back to cached
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(RUNTIME).then((c) => c.put(request, copy));
        return response;
      }).catch(() => caches.match(request).then((r) => r || new Response(
        JSON.stringify({ offline: true, ts: Date.now() }),
        { headers: { 'Content-Type': 'application/json' } }
      )))
    );
    return;
  }
  // Shell: cache-first
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(RUNTIME).then((c) => c.put(request, copy));
        }
        return response;
      }).catch(() => caches.match('/').then((r) => r || new Response('Offline', { status: 503 }))))
    );
  }
});
