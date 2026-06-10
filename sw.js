/* Calliope service worker — makes the app work fully offline once loaded. */
const CACHE = 'calliope-v4';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/styles.css',
  './js/data.js', './js/store.js', './js/stats.js', './js/custom.js',
  './js/speech.js', './js/ui.js',
  './js/activities-speech.js', './js/activities-ot.js', './js/main.js',
  './icons/icon.svg', './icons/icon-180.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
