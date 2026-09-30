/*
 * Service Worker: speichert das Spiel für den Offline-Betrieb.
 * Bei Änderungen an Dateien VERSION erhöhen, damit Spieler die neue Fassung bekommen.
 */
const VERSION = 'sternenpfoetchen-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'fonts/nunito-latin.woff2',
  'js/engine.js', 'js/levels.js', 'js/sprites.js', 'js/render.js', 'js/audio.js', 'js/main.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png', 'icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst Netz (damit Updates ankommen), bei Offline aus dem Cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
