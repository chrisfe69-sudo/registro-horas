const CACHE_NAME = 'control-horas-v2';
const ARCHIVOS = [
  './control-horas.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const esHtml = event.request.mode === 'navigate' || event.request.url.endsWith('.html');

  if(esHtml){
    // Red primero: así cualquier actualización futura se aplica al instante.
    // Si no hay conexión, se sirve la última copia guardada.
    event.respondWith(
      fetch(event.request).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Resto de archivos (iconos, manifest): caché primero, más rápido y cambian poco.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((res) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, res.clone());
          return res;
        });
      }).catch(() => cached);
    })
  );
});
