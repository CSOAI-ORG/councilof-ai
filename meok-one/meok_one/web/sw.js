// MEOK ONE — service worker. Makes the OS installable + offline-capable (PWA).
// Strategy: cache the app shell (static UI) for instant/offline load; ALWAYS go to network
// for /api/* (live AI replies must never be cached/stale). Honest + safe caching.
const CACHE = "meok-one-v3";
const SHELL = ["/os", "/avatar?embed=1", "/hatch", "/dome", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // NEVER cache the API or cross-origin (live AI, tools, SOV3) — always network.
  if (url.pathname.startsWith("/api/") || url.origin !== location.origin) return;
  // app shell: stale-while-revalidate (instant load, refresh in background)
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy)); }
        return res;
      }).catch(()=>cached);
      return cached || net;
    })
  );
});
