// Service worker for Shimmy to work offline

self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    console.log("[Service Worker] Caching all: app shell and content");
    await cache.addAll(appShellFiles);
  })());
});

self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (r) { return r; }
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
    cache.put(e.request, response.clone());
    return response;
  })());
});

const cacheName = "shimmy-v1";
const appShellFiles = [
  "../index.html",
  "./animation.js",
  "./dom.js",
  "./file.js",
  "./frames.js",
  "./moat.js",
  "./palettes.js",
  "./script.js",
  "./state.js",
  "./stepper.js",
  "./svgcanvas.js",
  "./timeline.js",
  "./tool.js",
  "./ui.js",
  "./undo.js",
  "../favicon/android-chrome-192x192.png",
  "../favicon/android-chrome-512x512.png",
  "../favicon/apple-touch-icon.png",
  "../favicon/favicon-16x16.png",
  "../favicon/favicon-32x32.png",
  "../img/arrows.svg",
  "../img/compress-arrows-alt.svg",
  "../img/eraser.svg",
  "../img/expand-arrows-alt.svg",
  "../img/pen.svg",
  "../img/rpl-logo.png",
  "../img/sync-alt.svg",
  "../css/fontawesome.css",
  "../css/regular.css",
  "../css/select-css.css",
  "../css/solid.css",
  "../css/style.css",
  "../font/fa-regular-400.eot",
  "../font/fa-regular-400.svg",
  "../font/fa-regular-400.ttf",
  "../font/fa-regular-400.woff",
  "../font/fa-regular-400.woff2",
  "../font/fa-solid-900.eot",
  "../font/fa-solid-900.svg",
  "../font/fa-solid-900.ttf",
  "../font/fa-solid-900.woff",
  "../font/fa-solid-900.woff2",
  "../logo/logo0_48.png",
  "../logo/logo0_57.png",
  "../logo/logo0_60.png",
  "../logo/logo0_72.png",
  "../logo/logo0_76.png",
  "../logo/logo0_96.png",
  "../logo/logo0_114.png",
  "../logo/logo0_144.png",
  "../logo/logo0_152.png",
  "../logo/logo0_180.png",
  "../logo/logo0_192.png",
  "../logo/logo0_256.png",
  "../logo/logo0_384.png",
  "../logo/logo0_512.png",
  "../logo/logo0_60.png",
  "../favicon.ico"
];
