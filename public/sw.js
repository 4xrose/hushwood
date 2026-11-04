/* HUSHWOOD service worker.
 * The shell is network-first so a new build is picked up immediately when
 * online. Models, textures, audio and fonts are cached on first use, which
 * keeps the install small while still making the clinic playable offline.
 */
const VERSION = 'hushwood-v1.0.2';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './fonts/cormorant-latin.woff2',
  './fonts/cormorant-italic-latin.woff2',
  './fonts/special-elite-latin.woff2',
];

// index.html references hashed JavaScript and CSS. Read the built HTML during
// install so the app shell is usable offline after the very first visit, even
// though this worker is a plain static file and cannot know the hashes.
async function discoverBuildAssets() {
  try {
    const response = await fetch('./index.html', { cache: 'no-store' });
    if (!response.ok) return [];
    const html = await response.text();
    const urls = new Set();
    const pattern = /(?:src|href)="(\.\/[^"]+\.(?:js|css))"/g;
    let match;
    while ((match = pattern.exec(html))) urls.add(match[1]);
    return [...urls];
  } catch {
    return [];
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(SHELL_URLS).catch(() => {});
    const buildAssets = await discoverBuildAssets();
    await cache.addAll(buildAssets).catch(() => {});
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== SHELL && key !== RUNTIME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Media elements use Range requests; the Cache API cannot store partial
  // responses, so let the network handle those directly.
  if (request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      });
    }),
  );
});
