// Service Worker mínimo do Reserve Já — só pra receber Web Push.
// Não fazemos cache offline aqui (PWA-lite). Se um dia quiser offline, adicionar
// install/fetch handlers.

self.addEventListener("install", () => {
  // Ativa imediatamente sem esperar abas antigas fecharem.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // Assume controle das abas já abertas.
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let payload = { title: "Reserve Já", body: "Você tem um lembrete", url: "/" }
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() }
    } catch {
      payload.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: payload.url },
      tag: payload.tag || "reserveja-notification",
      // Renotify: se vier outra notif com mesmo tag, vibra/avisa de novo
      renotify: true,
      requireInteraction: false,
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? "/"

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      // Se já tem aba aberta na mesma URL, foca nela
      for (const client of all) {
        if (client.url.endsWith(url) && "focus" in client) {
          return client.focus()
        }
      }
      // Senão, abre nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })(),
  )
})
