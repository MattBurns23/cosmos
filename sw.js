// Caches only the app shell (this file, index.html, manifest, icons) so the dashboard still
// opens instantly and installs as a PWA. Live data (ISS position, launches, weather, etc.) is
// all fetched cross-origin and deliberately left uncached here — this is a shell cache, not an
// offline data cache.
const CACHE = 'cosmos-shell-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isShellAsset = new URL(e.request.url).origin === location.origin;
  if (!isShellAsset) return; // let cross-origin API calls hit the network untouched

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
