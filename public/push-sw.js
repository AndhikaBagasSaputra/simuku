/* Simuku: menampilkan notifikasi push dan membuka aplikasi saat notifikasi diketuk.
 * Dimuat oleh service worker utama (lihat workbox.importScripts di vite.config.ts). */

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Simuku'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      tag: payload.tag || 'simuku',
      renotify: true,
      data: { url: payload.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // Kalau Simuku sudah terbuka, pakai jendela itu; kalau belum, buka baru
      for (const win of windows) {
        if (new URL(win.url).origin === self.location.origin) {
          win.focus()
          if ('navigate' in win) return win.navigate(url)
          return undefined
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
