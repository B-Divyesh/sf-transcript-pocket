const VERSION = 'tp-shell-__BUILD_VERSION__';
const SHELL = [
  '/', '/index.html', '/privacy/', '/terms/', '/offline.html',
  '/manifest.json', '/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png',
  '/icons/icon-maskable-512.png', '/assets/transcript-pocket-hero.webp',
  '/assets/transcript-pocket-hero-mobile.webp', '/assets/city-notes-sample.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    const response = await fetch('/index.html');
    const html = await response.text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
    await cache.addAll([...new Set(builtAssets)]);
    const stylesheets = builtAssets.filter((path) => path.endsWith('.css'));
    for (const stylesheet of stylesheets) {
      const css = await (await fetch(stylesheet)).text();
      const fontAssets = [...css.matchAll(/url\(["']?(\/assets\/[^)"']+\.(?:woff2?|ttf))["']?\)/g)].map((match) => match[1]);
      if (fontAssets.length) await cache.addAll([...new Set(fontAssets)]);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.postMessage({ type: 'APP_UPDATED' }));
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(VERSION);
        cache.put(request, response.clone());
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match(url.pathname)) || (await caches.match('/offline.html'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(VERSION);
      cache.put(request, response.clone());
    }
    return response;
  })());
});
