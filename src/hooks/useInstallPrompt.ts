import { useSyncExternalStore } from 'react'
import { getInstallState, promptInstall, subscribeInstall } from '../lib/installPrompt'

/** Apakah aplikasi sedang dibuka sebagai aplikasi ter-install (bukan di tab browser) */
function isStandalone() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone
}

export function useInstallPrompt() {
  const { deferred, installed } = useSyncExternalStore(subscribeInstall, getInstallState)
  const standalone = isStandalone()
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  return {
    /** Sudah ter-install / sedang dibuka sebagai aplikasi */
    isInstalled: installed || standalone,
    /** Browser mendukung tombol install satu klik */
    canInstall: deferred !== null && !standalone,
    /** iPhone/iPad di Safari: harus lewat menu Bagikan */
    needsIOSGuide: isIOS && !standalone,
    install: promptInstall,
  }
}
