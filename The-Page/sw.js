const CACHE_NAME = 'emake-v15';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — ignore OneSignal and Supabase requests
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Let these pass through without touching them
  if (
    url.includes('onesignal.com') ||
    url.includes('supabase.co') ||
    url.includes('firebasejs') ||
    url.includes('gstatic.com') ||
    url.includes('cdn.onesignal.com') ||
url.includes('firebase-messaging-sw.js')
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});