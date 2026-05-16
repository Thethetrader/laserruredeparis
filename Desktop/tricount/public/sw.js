const CACHE_NAME = 'monbudget-v1'
const OFFLINE_URL = '/offline'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([
      '/',
      '/offline',
      '/manifest.json',
    ]))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL) ?? new Response('Hors ligne')
      )
    )
    return
  }

  if (event.request.url.includes('supabase')) return

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      return cached ?? fetchPromise
    })
  )
})
