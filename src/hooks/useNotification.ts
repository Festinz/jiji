import { useEffect, useCallback, useRef } from 'react'
import { useStudyStore } from '../stores/studyStore'
import { quotes } from '../data/quotes'

// ── Schedule times (hours in 24h format) ────────────────────
const MORNING_HOUR = 8
const EVENING_HOUR = 18
const NIGHT_HOUR = 21

function getRandomQuote() {
  const q = quotes[Math.floor(Math.random() * quotes.length)]
  return `${q.text} - ${q.author}`
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useNotification() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lastStudyDate = useStudyStore((s) => s.lastStudyDate)
  const streak = useStudyStore((s) => s.streak)

  // ── Request permission on first load ────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ── Send a notification ─────────────────────────────────
  const notify = useCallback((title: string, body: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    // Use SW notification if available for better mobile support
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/mascot/greeting.png',
          badge: '/icons/icon-192.png',
          tag: 'jiji-reminder',
        } as NotificationOptions)
      })
    } else {
      new Notification(title, {
        body,
        icon: '/mascot/greeting.png',
      })
    }
  }, [])

  // ── Schedule daily notifications ────────────────────────
  useEffect(() => {
    // Clear previous timers
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const now = new Date()
    const today = todayStr()
    const studiedToday = lastStudyDate === today

    function msUntilHour(hour: number): number {
      const target = new Date()
      target.setHours(hour, 0, 0, 0)
      const diff = target.getTime() - now.getTime()
      return diff > 0 ? diff : -1 // -1 = already passed today
    }

    // Morning 8:00
    const msMorning = msUntilHour(MORNING_HOUR)
    if (msMorning > 0) {
      timers.current.push(
        setTimeout(() => {
          notify('좋은 아침!', '오늘의 지지 학습이 준비됐어 📚')
        }, msMorning),
      )
    }

    // Evening 18:00 (if not studied)
    const msEvening = msUntilHour(EVENING_HOUR)
    if (msEvening > 0) {
      timers.current.push(
        setTimeout(() => {
          const current = useStudyStore.getState()
          if (current.lastStudyDate !== todayStr()) {
            notify('오늘의 명언', `${getRandomQuote()}\n아직 오늘 학습을 안 했어요!`)
          }
        }, msEvening),
      )
    }

    // Night 21:00 (if not studied)
    const msNight = msUntilHour(NIGHT_HOUR)
    if (msNight > 0) {
      timers.current.push(
        setTimeout(() => {
          const current = useStudyStore.getState()
          if (current.lastStudyDate !== todayStr()) {
            notify('지지가 졸고 있어요 💤', '5분만 투자해볼까?')
          }
        }, msNight),
      )
    }

    // Streak celebration (check immediately)
    if (studiedToday) {
      if (streak === 3) {
        notify('🔥 3일 연속 학습!', '과탑이 코앞이야!')
      } else if (streak === 7) {
        notify('🏆 일주일 연속!', '지지가 감동받았어!')
      }
    }

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [lastStudyDate, streak, notify])

  return { notify }
}
