/**
 * Notifikasi push untuk pengingat tagihan.
 * Langganan perangkat disimpan di tabel push_subscriptions; pengirimnya ada di api/push.ts (Vercel).
 */
import { supabase } from './supabase'

const PUBLIC_KEY: string | undefined = import.meta.env.VITE_VAPID_PUBLIC_KEY

export type PushState =
  | 'unsupported' // browser tidak mendukung
  | 'needs-install' // iPhone/iPad: harus di-install ke layar utama dulu
  | 'not-configured' // kunci notifikasi belum diisi
  | 'denied' // izin notifikasi ditolak di pengaturan browser
  | 'off'
  | 'on'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

function keyToBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function registration() {
  return navigator.serviceWorker.ready
}

export async function getPushState(): Promise<PushState> {
  if (!PUBLIC_KEY || !supabase) return 'not-configured'
  if (isIOS() && !isStandalone()) return 'needs-install'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  // Service worker hanya aktif di versi build (bukan saat npm run dev)
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return 'unsupported'
  const sub = await reg.pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

/** Minta izin, daftarkan perangkat ini, dan simpan ke akun */
export async function enablePush() {
  if (!PUBLIC_KEY || !supabase) throw new Error('Notifikasi belum diatur')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Izin notifikasi tidak diberikan')

  const reg = await registration()
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(PUBLIC_KEY) }))

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
    user_agent: navigator.userAgent.slice(0, 200),
  })
  if (error) {
    await sub.unsubscribe()
    throw new Error('Gagal menyimpan langganan notifikasi. Coba lagi.')
  }
}

/** Berhenti menerima notifikasi di perangkat ini */
export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await supabase?.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

/** Minta server mengirim notifikasi uji ke perangkat-perangkat akun ini */
export async function sendTestPush() {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
  const token = data.session?.access_token
  if (!token) throw new Error('Belum masuk')
  const res = await fetch('/api/push', { method: 'POST', headers: { authorization: `Bearer ${token}` } })
  const body = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(body.error ?? 'Gagal mengirim notifikasi uji')
}
