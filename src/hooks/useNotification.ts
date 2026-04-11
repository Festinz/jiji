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

  // ── Show notification banner for PWA users who haven't decided yet
  const [showNotifBanner, setShowNotifBanner] = useState(false)

  useEffect(() => {
    if (!isPwaMode) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return
    const timer = setTimeout(() => setShowNotifBanner(true), 1500)
    return () => clearTimeout(timer)
  }, [isPwaMode])

  const dismissNotifBanner = useCallback(() => {
    setShowNotifBanner(false)
  }, [])

  const handleNotifBannerAllow = useCallback(async () => {
    const result = await requestPermission()
    setShowNotifBanner(false)
    return result
  }, [requestPermission])

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

  // ── Send completion notification when all 3 done ───────
  const [prevAllDone, setPrevAllDone] = useState(false)
  const allDone = todayCompleted.concept && todayCompleted.flash && todayCompleted.quiz

  useEffect(() => {
    if (permission !== 'granted') return
    if (!('serviceWorker' in navigator)) return
    // Only fire when transitioning from incomplete → complete
    if (allDone && !prevAllDone) {
      // Use registration.showNotification directly (more reliable than postMessage)
      const COMPLETION_MESSAGES = [
        { title: '학습 완료! 🎉', body: '지영아 오늘 학습 다 끝냈어! 지지가 감동받았어~' },
        { title: '오늘도 완벽! ✨', body: '지영아 역시 예비 과탑! 내일도 이 기세로!' },
        { title: '올클리어! 🔥', body: '지영아 3개 다 클리어! 지지가 춤추고 있어~' },
        { title: '미션 완료! 🏆', body: '지영아 오늘의 미션 끝! 쉬면서 맛있는 거 먹어~' },
        { title: '대단해! 💪', body: '지영아 오늘도 해냈다! 작치 과탑 순항 중~' },
        { title: '지지 감동 중! 🥹', body: '지영아 주말에도 공부하다니... 지지 눈물 날 것 같아' },
        { title: '완벽한 하루! 🌟', body: '지영아 오늘 학습 마무리 완료! 푹 쉬어~ 내일도 화이팅!' },
      ]
      const dayIndex = Math.floor(Date.now() / 86400000) % COMPLETION_MESSAGES.length
      const msg = COMPLETION_MESSAGES[dayIndex]

      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(msg.title, {
          body: msg.body,
          icon: '/icons/jiji-notif-192.png',
          badge: '/icons/apple-touch-icon.png',
          tag: 'jiji-daily-complete',
          data: { url: '/' },
        })
      })
    }
    setPrevAllDone(allDone)
  }, [allDone, prevAllDone, permission])

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
    showNotifBanner,
    dismissNotifBanner,
    handleNotifBannerAllow,
    requestPermission,
  }
}
