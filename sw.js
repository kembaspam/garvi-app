const CACHE = 'garvi-v5';
const STATIC = ['./', './index.html', './manifest.json', './css/styles.css',
  './js/datos.js', './js/nube.js', './js/inicio.js', './js/contenedores.js',
  './js/facturacion.js', './js/cobros.js', './js/importar-deudores.js', './js/copia-auto.js', './js/seguimiento.js', './js/gestion.js', './js/eventos.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname === 'api.anthropic.com') {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({error:'offline'}), {headers:{'Content-Type':'application/json'}})));
    return;
  }
  if (['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'].includes(url.hostname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const clone = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return resp;
    })));
    return;
  }
  // HTML siempre de red, saltándose también la caché HTTP del navegador (no solo la del SW),
  // para que un cambio recién publicado llegue de verdad sin esperar a que expire ninguna caché.
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(e.request.url, {cache:'no-store'}).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
    return;
  }
  // Código de la app (CSS y JS propios): también de red primero, para que un cambio publicado
  // llegue siempre; la copia en caché solo se usa si no hay conexión.
  if (url.origin === self.location.origin && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
    e.respondWith(fetch(e.request.url, {cache:'no-store'}).then(resp => {
      if (resp.ok) { const cl = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); }
      return resp;
    }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if (resp.ok) { const cl = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
