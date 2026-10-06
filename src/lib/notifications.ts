export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) throw new Error('Notificacoes nao sao suportadas neste navegador.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permissao de notificacao nao concedida.')
  return permission
}

export async function sendTestNotification() {
  await requestNotificationPermission()
  const registration = await navigator.serviceWorker.ready
  await registration.showNotification('RADAR ARMADO', {
    body: 'O Friction Radar pode avisar quando houver um sinal importante.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'friction-radar-test',
    data: { url: '/' }
  })
}

export async function updateAppBadge(count: number) {
  const nav = navigator as Navigator & {
    setAppBadge?: (count?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }
  try {
    if (count > 0 && nav.setAppBadge) await nav.setAppBadge(count)
    else if (nav.clearAppBadge) await nav.clearAppBadge()
  } catch {
    // Badge support differs by browser. Failure should never block the app.
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Web Push nao e suportado neste ambiente.')
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  const subscribeUrl = import.meta.env.VITE_PUSH_SUBSCRIBE_URL as string | undefined
  if (!vapidPublicKey || !subscribeUrl) {
    throw new Error('Backend Web Push ainda nao configurado.')
  }

  await requestNotificationPermission()
  const registration = await navigator.serviceWorker.ready
  const current = await registration.pushManager.getSubscription()
  const subscription = current ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  })

  const response = await fetch(subscribeUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(subscription)
  })
  if (!response.ok) throw new Error('Falha ao registrar o dispositivo para push.')
  return subscription
}
