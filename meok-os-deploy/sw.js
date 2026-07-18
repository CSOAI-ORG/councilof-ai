/* MEOK OS service worker — offline app-shell, network-first for live data.
   Sovereign: caches only your own app shell; never caches /api responses with
   personal data; bumping CACHE invalidates the old shell. */
const CACHE = 'meok-os-v1';
const SHELL = [
  '/', '/index.html',
  '/sovspace.html', '/badges.html', '/verify.html', '/pricing.html', '/character.html',
  '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never serve API or cross-origin from cache — always live, fall back gracefully.
  if (url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/agent/')) {
    return; // let the network handle it (the app already has offline fallbacks)
  }
  // App shell: cache-first with background refresh (stale-while-revalidate).
  e.respondWith(
    caches.match(req).then((cached) => {
      const live = fetch(req).then((res) => {
        if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || live;
    })
  );
});
