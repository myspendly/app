// Spendly Service Worker
// Every time you update the app, change this version number to force a cache refresh
const VERSION = 'spendly-v1.0.4';

const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ── Install: cache app shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(CACHE_ASSETS))
  );
  // Immediately take over — don't wait for old SW to finish
  self.skipWaiting();
});

// ── Activate: delete old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network first, fall back to cache ──
// This means the app always tries to load the latest version from GitHub,
// but still works offline if there's no connection.
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests (fonts, CDN scripts etc)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the fresh response
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request).then(cached => cached || caches.match('/index.html'));
      })
  );
});
