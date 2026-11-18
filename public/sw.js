// AyuSwar AI Progressive Web App Service Worker (v7)
// Offline shell for public application assets only. Clinical APIs, private routes, and media streams are never cached.
const CACHE_NAME = 'ayuswar-ai-v7-cache';

const STATIC_SHELL = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.svg',
  '/assets/ayuswar_master_emblem.png'
];
const STATIC_PREFIXES = ['/assets/', '/fonts/'];
const PRIVATE_PREFIXES = ['/api/', '/audio/', '/auth/', '/doctor-portal', '/patient-portal', '/clinical-console', '/prescription/'];
const PRIVATE_MEDIA_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm'];

function isStaticAsset(url) {
  return STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) || STATIC_SHELL.includes(url.pathname);
}

function isPrivateOrMedia(url, request) {
  return PRIVATE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
    PRIVATE_MEDIA_EXTENSIONS.some((extension) => url.pathname.toLowerCase().endsWith(extension)) ||
    request.destination === 'audio' ||
    request.destination === 'video';
}

async function cacheApplicationShell() {
  const cache = await caches.open(CACHE_NAME);
  const urls = new Set(STATIC_SHELL);
  try {
    const manifestResponse = await fetch('/sw-assets.json', { cache: 'no-cache' });
    if (manifestResponse && manifestResponse.ok) {
      for (const value of await manifestResponse.json()) {
        const url = new URL(value, self.location.origin);
        if (isStaticAsset(url) && !isPrivateOrMedia(url, { destination: '' })) urls.add(url.pathname);
      }
    }
  } catch {}
  try {
    const indexResponse = await fetch('/index.html', { cache: 'no-cache' });
    if (indexResponse && indexResponse.ok) {
      await cache.put('/index.html', indexResponse.clone());
      const html = await indexResponse.text();
      for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
        const value = match[1];
        if (value.startsWith('/assets/') || value.startsWith('/fonts/')) urls.add(value);
      }
    }
  } catch {}
  await Promise.allSettled([...urls].map((url) => cache.add(url)));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(cacheApplicationShell().catch(() => {}));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never intercept third-party services.
  if (url.origin !== self.origin) return;

  // Navigation: use the network when available; offline fallback is always the public app shell,
  // never a cached private-route document.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response && response.status === 200 && (url.pathname === '/' || url.pathname === '/index.html')) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/index.html', response.clone());
          }
          return response;
        })
        .catch(() => caches.match('/index.html').then((res) => res || caches.match('/')))
    );
    return;
  }

  // Never intercept same-origin clinical/private/media responses.
  if (isPrivateOrMedia(url, event.request)) return;

  // Static build assets only: stale-while-revalidate inside explicit prefixes.
  if (!isStaticAsset(url)) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
