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
  "/shimmy",
  "/shimmy/js/animation.js",
  "/shimmy/js/dom.js",
  "/shimmy/js/file.js",
  "/shimmy/js/frames.js",
  "/shimmy/js/moat.js",
  "/shimmy/js/palettes.js",
  "/shimmy/js/script.js",
  "/shimmy/js/state.js",
  "/shimmy/js/stepper.js",
  "/shimmy/js/svgcanvas.js",
  "/shimmy/js/timeline.js",
  "/shimmy/js/tool.js",
  "/shimmy/js/ui.js",
  "/shimmy/js/undo.js",
  "/shimmy/favicon/android-chrome-192x192.png",
  "/shimmy/favicon/android-chrome-512x512.png",
  "/shimmy/favicon/apple-touch-icon.png",
  "/shimmy/favicon/favicon-16x16.png",
  "/shimmy/favicon/favicon-32x32.png",
  "/shimmy/img/arrows.svg",
  "/shimmy/img/compress-arrows-alt.svg",
  "/shimmy/img/eraser.svg",
  "/shimmy/img/expand-arrows-alt.svg",
  "/shimmy/img/pen.svg",
  "/shimmy/img/rpl-logo.png",
  "/shimmy/img/sync-alt.svg",
  "/shimmy/css/fontawesome.css",
  "/shimmy/css/regular.css",
  "/shimmy/css/select-css.css",
  "/shimmy/css/solid.css",
  "/shimmy/css/style.css",
  "/shimmy/font/fa-regular-400.eot",
  "/shimmy/font/fa-regular-400.svg",
  "/shimmy/font/fa-regular-400.ttf",
  "/shimmy/font/fa-regular-400.woff",
  "/shimmy/font/fa-regular-400.woff2",
  "/shimmy/font/fa-solid-900.eot",
  "/shimmy/font/fa-solid-900.svg",
  "/shimmy/font/fa-solid-900.ttf",
  "/shimmy/font/fa-solid-900.woff",
  "/shimmy/font/fa-solid-900.woff2",
  "/shimmy/icons/icon0_48.png",
  "/shimmy/icons/icon0_57.png",
  "/shimmy/icons/icon0_60.png",
  "/shimmy/icons/icon0_72.png",
  "/shimmy/icons/icon0_76.png",
  "/shimmy/icons/icon0_96.png",
  "/shimmy/icons/icon0_114.png",
  "/shimmy/icons/icon0_144.png",
  "/shimmy/icons/icon0_152.png",
  "/shimmy/icons/icon0_180.png",
  "/shimmy/icons/icon0_192.png",
  "/shimmy/icons/icon0_256.png",
  "/shimmy/icons/icon0_384.png",
  "/shimmy/icons/icon0_512.png",
  "/shimmy/favicon.ico",
];
