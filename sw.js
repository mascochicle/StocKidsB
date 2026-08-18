const V = 'stockidsb-20260818-0750';
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

/*
 * ⚠️ PRIMERO LO GUARDADO, y refresca por detrás. Antes era al revés —primero la red— y eso
 * hacía que CADA apertura esperara a bajar el archivo completo (390 KB de StocKids, 700 KB de
 * StocKidsB, ya comprimidos) antes de enseñar nada. La copia guardada solo servía sin
 * internet, que es el caso raro. Marco lo reportó el 17-ago-2026: "está tardando en cargar".
 *
 * Ahora abre al instante con lo que hay y pide la versión nueva en segundo plano; la próxima
 * vez que abra, ya está. Un día de retraso en una app cuyo mundo avanza con el calendario no
 * le quita nada, y quien tenga prisa tiene el botón de Ajustes.
 *
 * El `cache:'no-store'` SIGUE SIENDO CLAVE en ese refresco de fondo: GitHub Pages manda
 * `Cache-Control: max-age=600` y sin él el navegador daría su copia vieja 10 minutos y la
 * versión publicada nunca llegaría. Lo que cambió es CUÁNDO se espera a la red, no si se
 * revalida.
 */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.open(V).then(c =>
    c.match(e.request).then(guardado => {
      const red = fetch(url.href, { cache: 'no-store' })
        .then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; })
        .catch(() => null);
      // Si hay copia se muestra YA y la red corre sola. Si no hay, toca esperarla.
      return guardado || red.then(r => r || caches.match('./index.html'));
    })));
});
