import { useEffect, useState, useCallback } from 'react'
import { useStudyStore } from '../stores/studyStore'

// ── PWA detection ─────────────────────────────────────────
function isPWA(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// ── Hook ──────────────────────────────────────────────────
export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isPwaMode] = useState(isPWA)
  const [isIOSDevice] = useState(isIOS)

  const lastStudyDate = useStudyStore((s) => s.lastStudyDate)
  const streak = useStudyStore((s) => s.streak)
  const todayCompleted = useStudyStore((s) => s.todayCompleted)

  // ── Check if install banner should show ─────────────────
  useEffect(() => {
    if (isPwaMode) return
    const dismissed = localStorage.getItem('jiji-install-banner-dismissed')
    if (!dismissed) {
      setShowInstallBanner(true)
    }
  }, [isPwaMode])

  const dismissInstallBanner = useCallback(() => {
    setShowInstallBanner(false)
    localStorage.setItem('jiji-install-banner-dismissed', 'true')
  }, [])

  // ── Request permission (PWA mode only) ──────────────────
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied' as const
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      sendStudyStateToSW()
    }
    return result
  }, [])

  // ── Auto-request on PWA first load ──────────────────────
  useEffect(() => {
    if (!isPwaMode) return
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      // Small delay so app feels loaded first
      const timer = setTimeout(() => {
        requestPermission()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isPwaMode, requestPermission])

  // ── Send study state to SW for notification customization
  const sendStudyStateToSW = useCallback(() => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return

    const today = new Date().toISOString().slice(0, 10)
    const state = {
      studiedToday: lastStudyDate === today,
      streak,
      allDone: todayCompleted.concept && todayCompleted.flash && todayCompleted.quiz,
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATIONS',
      state,
    })
  }, [lastStudyDate, streak, todayCompleted])

  // ── Re-schedule when study state changes ────────────────
  useEffect(() => {
    if (permission !== 'granted') return
    sendStudyStateToSW()
  }, [permission, sendStudyStateToSW])

  // ── Also schedule when SW becomes ready ─────────────────
  useEffect(() => {
    if (permission !== 'granted') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then(() => {
      // Wait a beat for controller to be available
      setTimeout(sendStudyStateToSW, 500)
    })
  }, [permission, sendStudyStateToSW])

  return {
    permission,
    isPwaMode,
    isIOSDevice,
    showInstallBanner,
    dismissInstallBanner,
    requestPermission,
  }
}
