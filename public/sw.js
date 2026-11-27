// sw.js — keeps the guide working offline.
// Everything the guide needs (pages, routes, counters, staff cards, the latest rates)
// is stored on the phone. Online, the network is tried first so updates show up;
// offline, the stored copy is used. Voice recognition still needs the internet.

const CACHE = 'arrival-guide-v6';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const list = await (await fetch('/assets.json', { cache: 'no-store' })).json();
    await cache.addAll(list);
    try { await cache.add('/api/rates'); } catch { /* no server or offline: the sample file is cached */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                          // voice and Q&A upgrades: network only
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/api/tts' || url.pathname === '/api/understand') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const fresh = await fetch(req);
      if (fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    } catch {
      const hit = await cache.match(req, { ignoreSearch: true }) ||
        (req.mode === 'navigate' ? await cache.match('/index.html') : null);
      if (hit && url.pathname === '/api/rates') {
        // Say honestly that these are the rates saved on the phone, not live ones
        const body = await hit.json();
        return new Response(JSON.stringify({ ...body, source: 'saved' }), { headers: { 'Content-Type': 'application/json' } });
      }
      if (hit) return hit;
      if (url.pathname === '/api/config') {
        return new Response('{"naturalVoice":false,"aiUnderstanding":false}', { headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});

// "Save for my trip": store everything again right now, including the rates just shown.
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'save-trip') return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let ok = true;
    try {
      const list = await (await fetch('/assets.json', { cache: 'no-store' })).json();
      await cache.addAll(list);
    } catch { ok = !!(await cache.match('/index.html')); }   // offline: fine if already stored
    if (event.data.rates) {
      await cache.put('/api/rates', new Response(JSON.stringify(event.data.rates), { headers: { 'Content-Type': 'application/json' } }));
    }
    event.source && event.source.postMessage({ type: 'trip-saved', ok });
  })());
});
