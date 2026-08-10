/* Service Worker — Reto Control & Notificaciones iOS/Web */
const CACHE_NAME = 'reto-control-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Push Event for Notifications (iOS Safari 16.4+ & Web)
self.addEventListener('push', (event) => {
  let data = { title: 'Reto Control', body: 'Mantén tu firmeza hoy. Cada minuto sin fumar cuenta.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="%23060a12"/><circle cx="256" cy="256" r="180" fill="none" stroke="%2322d3ee" stroke-width="32"/><path d="M256 140v116l80 48" fill="none" stroke="%2334d399" stroke-width="32" stroke-linecap="round"/></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="%23060a12"/><circle cx="256" cy="256" r="180" fill="none" stroke="%2322d3ee" stroke-width="32"/></svg>',
    vibrate: [200, 100, 200, 100, 200],
    sound: 'default',
    silent: false,
    data: { url: self.registration.scope },
    tag: data.tag || 'reto-control-alert',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let targetHash = '#today';
  if (event.action === 'craving') {
    targetHash = '#craving';
  } else if (event.action === 'confirm') {
    targetHash = '#today';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate('./index.html' + targetHash);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html' + targetHash);
      }
    })
  );
});
