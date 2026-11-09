/**
 * Menangkap event "beforeinstallprompt" dari browser (Chrome/Edge/Android) sedini mungkin,
 * supaya tombol "Install aplikasi" bisa memunculkan dialog install kapan saja.
 * File ini dimuat saat aplikasi start, sebelum React jalan.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallState {
  /** Event install yang bisa dipakai (null = browser tidak menawarkan install) */
  deferred: BeforeInstallPromptEvent | null
  /** Baru saja di-install */
  installed: boolean
}

let state: InstallState = { deferred: null, installed: false }
const listeners = new Set<() => void>()

function update(next: Partial<InstallState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // jangan tampilkan banner bawaan browser; kita pakai tombol sendiri
    update({ deferred: e as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => update({ deferred: null, installed: true }))
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getInstallState() {
  return state
}

/** Tampilkan dialog install bawaan browser. Mengembalikan true kalau user setuju. */
export async function promptInstall() {
  const event = state.deferred
  if (!event) return false
  await event.prompt()
  const { outcome } = await event.userChoice
  update({ deferred: null })
  return outcome === 'accepted'
}
