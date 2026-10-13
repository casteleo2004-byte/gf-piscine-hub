/* Service worker generato da scripts/build-sw.mjs — non modificare out/sw.js a mano. */
const CACHE = "wrc-trip-__VERSION__";
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("wrc-trip-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const url = new URL(request.url);
  let res = await cache.match(url.pathname, { ignoreSearch: true });
  if (!res && request.mode === "navigate") {
    const withSlash = url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
    res = (await cache.match(withSlash)) || (await cache.match("/"));
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first: tutto è statico e versionato; la rete serve solo per ciò che manca.
  event.respondWith(
    fromCache(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((res) => {
            if (res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(url.pathname, copy));
            }
            return res;
          })
          .catch(() => fromCache(new Request("/", { mode: "same-origin" })).then((r) => r || Response.error())),
    ),
  );
});
