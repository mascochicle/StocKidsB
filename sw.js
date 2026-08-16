const V = 'stockidsb-20260816-1555';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest',
                  './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Primero la red (para que una versión nueva llegue sola) y, si no hay internet, lo
// guardado. El `cache:'no-store'` es CLAVE y ya costó caro en MasMoney: GitHub Pages manda
// `Cache-Control: max-age=600`, así que sin él el navegador sigue dando su copia vieja
// durante 10 minutos y la versión publicada no llega al teléfono aunque ya esté arriba.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(url.href, { cache: 'no-store' })
      .then(r => {
        const copia = r.clone();
        caches.open(V).then(c => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
