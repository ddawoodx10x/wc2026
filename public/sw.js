// WC2026 Service Worker
const CACHE_NAME = 'wc2026-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'WC 2026 🏆';
  const body = data.body || 'Match prediction reminder!';
  const icon = '/icon-192.png';
  const badge = '/icon-192.png';
  const url = data.url || '/predictions';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: data.tag || 'wc2026',
      data: { url },
      vibrate: [200, 100, 200],
      actions: [
        { action: 'predict', title: 'Predict Now ⚽' },
        { action: 'dismiss', title: 'Later' }
      ]
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/predictions';
  
  if (event.action === 'predict') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Background sync for predictions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-predictions') {
    // Handle offline prediction sync
    console.log('Background sync: predictions');
  }
});
