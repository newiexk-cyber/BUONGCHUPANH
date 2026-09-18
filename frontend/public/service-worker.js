/**
 * SERVICE WORKER FOR PHOTOBOOTH STUDIO KIOSK
 * Caches core assets for lightning-fast launch and offline resiliency.
 */

const CACHE_NAME = 'photobooth-kiosk-v2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/selfbooth.html',
  '/download.html',
  '/css/selfbooth.css',
  '/css/main.css',
  '/css/print.css',
  '/js/utils/sanitizer.js',
  '/js/utils/qrcode.js',
  '/js/state/session-store.js',
  '/js/engine/filter-engine.js',
  '/js/engine/frame-renderer.js',
  '/js/modules/sticker-studio.js',
  '/js/modules/frame-vault.js',
  '/js/core/camera-manager.js',
  '/js/core/audio-effects.js',
  '/js/core/gif-encoder.js',
  '/js/modules/selfbooth-app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll skipped non-critical assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through API requests directly to server
  if (event.request.url.includes('/api/v1/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
