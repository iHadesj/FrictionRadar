const CACHE = 'friction-radar-v2'
const SHELL = ['/', '/index.html', '/manifest.webmanifest']

// Second-level assets referenced from the entry CSS/JS: bundled fonts and the
// lazily imported Three.js chunk, so the radar is complete on the first offline open.
const NESTED_ASSET = /(?:\/assets\/|\.\/)([\w.-]+\.(?:js|css|woff2))/g
const SKIP_SUBSETS = /-(?:cyrillic|greek|vietnamese)(?:-ext)?-/

async function precacheNested(cache, entries) {
  const nested = new Set()
  for (const url of entries) {
    if (!/\.(?:js|css)$/.test(url)) continue
    try {
      const text = await (await cache.match(url)).text()
      for (const match of text.matchAll(NESTED_ASSET)) {
        if (!SKIP_SUBSETS.test(match[1])) nested.add(`/assets/${match[1]}`)
      }
    } catch {
      // Missing entry in cache: runtime caching covers it later.
    }
  }
  const pending = [...nested].filter((url) => !entries.includes(url))
  await Promise.all(pending.map((url) => cache.add(url).catch(() => undefined)))
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await cache.addAll(SHELL)

    // Vite hashes production assets. Read the built index and precache the
    // exact CSS/JS files so the first installed version can reopen offline.
    try {
      const response = await fetch('/index.html', { cache: 'no-store' })
      const html = await response.clone().text()
      await cache.put('/index.html', response)
      const assets = [...new Set([...html.matchAll(/(?:src|href)=[\"'](\/assets\/[^\"']+)[\"']/g)].map((match) => match[1]))]
      if (assets.length) {
        await cache.addAll(assets)
        await precacheNested(cache, assets)
      }
    } catch {
      // Runtime caching still provides a graceful fallback if precache fails.
    }
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
    })
  )
})

self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch { payload = { body: event.data?.text() } }

  const title = payload.title || 'FRICTION RADAR'
  const options = {
    body: payload.body || 'Novo sinal detectado.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag || 'friction-radar',
    data: { url: payload.url || '/' }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
