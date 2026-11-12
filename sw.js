/* Triagem Clínica — Hemocentro da Paraíba
 * Service worker: rede-primeiro para o documento (online sempre recebe a
 * versão nova; cache só como fallback offline) e cache-primeiro-com-
 * revalidação para os demais GET same-origin.
 * Suba a constante C a cada release para limpar os caches antigos.
 */
const C = 'tv17';
const CORE = ['./', './index.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // cross-origin (JSONBin, etc.) passa direto

  const isDoc = req.mode === 'navigate' || req.destination === 'document';

  if (isDoc) {
    // rede primeiro: online sempre pega a versão nova; cache é só fallback offline
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(C);
        c.put('./', fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match(req)) || (await caches.match('./'));
      }
    })());
    return;
  }

  // demais GET same-origin: cache primeiro, revalida em segundo plano
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const net = fetch(req).then(r => {
      if (r && r.status === 200) caches.open(C).then(c => c.put(req, r.clone()));
      return r;
    }).catch(() => null);
    return cached || (await net) || Response.error();
  })());
});
