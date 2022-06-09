// Service worker for Shimmy to work offline

self.addEventListener("install", e => {
  console.log("[Service Worker] Install");
  e.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      console.log("[Service Worker] Caching all: app shell and content");
      await cache.addAll(appShellFiles);
    })()
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (r) {
        return r;
      }
      const response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })()
  );
});

const cacheName = "shimmy-v1";
const appShellFiles = [
  ".",
  "./js/animation.js",
  "./js/dom.js",
  "./js/file.js",
  "./js/frames.js",
  "./js/moat.js",
  "./js/palettes.js",
  "./js/script.js",
  "./js/state.js",
  "./js/stepper.js",
  "./js/svgcanvas.js",
  "./js/timeline.js",
  "./js/tool.js",
  "./js/ui.js",
  "./js/undo.js",
  "./favicon/android-chrome-192x192.png",
  "./favicon/android-chrome-512x512.png",
  "./favicon/apple-touch-icon.png",
  "./favicon/favicon-16x16.png",
  "./favicon/favicon-32x32.png",
  "./img/arrows.svg",
  "./img/compress-arrows-alt.svg",
  "./img/eraser.svg",
  "./img/expand-arrows-alt.svg",
  "./img/pen.svg",
  "./img/rpl-logo.png",
  "./img/sync-alt.svg",
  "./css/fontawesome.css",
  "./css/regular.css",
  "./css/select-css.css",
  "./css/solid.css",
  "./css/style.css",
  "./font/fa-regular-400.eot",
  "./font/fa-regular-400.svg",
  "./font/fa-regular-400.ttf",
  "./font/fa-regular-400.woff",
  "./font/fa-regular-400.woff2",
  "./font/fa-solid-900.eot",
  "./font/fa-solid-900.svg",
  "./font/fa-solid-900.ttf",
  "./font/fa-solid-900.woff",
  "./font/fa-solid-900.woff2",
  "./icons/icon0_48.png",
  "./icons/icon0_57.png",
  "./icons/icon0_60.png",
  "./icons/icon0_72.png",
  "./icons/icon0_76.png",
  "./icons/icon0_96.png",
  "./icons/icon0_114.png",
  "./icons/icon0_144.png",
  "./icons/icon0_152.png",
  "./icons/icon0_180.png",
  "./icons/icon0_192.png",
  "./icons/icon0_256.png",
  "./icons/icon0_384.png",
  "./icons/icon0_512.png",
  "./favicon.ico",
];
