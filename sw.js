// Service worker sederhana: cache cangkang aplikasi, jaringan-dulu untuk halaman, tidak pernah menyentuh API.
const V = 'gma-v1-1';
const CANGKANG = ['./', 'css/tokens.css', 'css/base.css', 'css/components.css', 'css/layout.css', 'js/app.js', 'js/config.js', 'assets/ikon.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CANGKANG)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') { e.respondWith(fetch(r).catch(() => caches.match('./'))); return; }
  e.respondWith(fetch(r).then((res) => { if (res.ok && /\.(css|js|svg|png|webp|woff2?)$/.test(u.pathname)) { const c = res.clone(); caches.open(V).then((ch) => ch.put(r, c)); } return res; }).catch(() => caches.match(r)));
});
