self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('a-sharapov-v5.0.1-cache').then((cache) => {
      return cache.addAll([
        '/models/coffee.glb',
        '/models/desk_lamp.glb',
        '/models/paper_plane.glb',
        '/models/pen_holder.glb',
        '/models/pencil.glb',
        '/models/glasses.glb'
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  )
})
