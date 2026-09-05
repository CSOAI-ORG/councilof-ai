/* Council OS web-app shell.
 *
 * Evidence and tool responses are deliberately never cached here. A signed
 * card must be checked against the bytes the user supplied, and a live board
 * or MCP response must remain a live read. Only versioned presentation assets
 * are cached after the browser has fetched them successfully.
 */
const CACHE_PREFIX = "council-os-shell-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const CORE = [
  "/offline.html",
  "/manifest.json",
  "/csoai-icon.svg",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isRuntimeEvidence(url) {
  return (
    url.pathname === "/mcp" ||
    url.pathname.startsWith("/mcp/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/.well-known/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isRuntimeEvidence(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html")),
    );
    return;
  }

  if (!["script", "style", "image", "font"].includes(request.destination)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
