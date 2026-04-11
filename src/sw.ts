/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

// ── Precache (injected by VitePWA) ────────────────────────
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── Runtime caching ───────────────────────────────────────
registerRoute(
  /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
  new CacheFirst({
    cacheName: 'cdn-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

registerRoute(
  /\/data\/generated\/.+\.json$/i,
  new StaleWhileRevalidate({
    cacheName: 'study-data',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

// ── Notification system ───────────────────────────────────
const NOTIFICATIONS = [
  { hour: 8, min: 0, title: '좋은 아침!', body: '지영아 좋은 아침이야~ ☀️ 오늘도 화이팅!', tag: 'jiji-morning' },
  { hour: 13, min: 0, title: '점심시간!', body: '지영아 점심 맛있게 먹었어? 🍚 남은 수업 파이팅!', tag: 'jiji-lunch' },
  { hour: 19, min: 0, title: '저녁이야!', body: '지영아 오늘 마무리 잘하자! 💪 지지가 기다리고 있어~', tag: 'jiji-evening' },
  { hour: 23, min: 0, title: '잘 자!', body: '지영아 오늘도 고생했어~ 🌙 잘자!!', tag: 'jiji-night' },
]

let notificationTimers: ReturnType<typeof setTimeout>[] = []

function getKSTNow(): Date {
  // Get current UTC time and add 9 hours for KST
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 9 * 3600000)
}

function msUntilKST(hour: number, min: number): number {
  const kstNow = getKSTNow()
  const target = new Date(kstNow)
  target.setHours(hour, min, 0, 0)
  const diff = target.getTime() - kstNow.getTime()
  return diff > 0 ? diff : -1
}

// ── Daily completion messages (rotated by day) ───────────
const COMPLETION_MESSAGES = [
  { title: '학습 완료! 🎉', body: '지영아 오늘 학습 다 끝냈어! 지지가 감동받았어~' },
  { title: '오늘도 완벽! ✨', body: '지영아 역시 예비 과탑! 내일도 이 기세로!' },
  { title: '올클리어! 🔥', body: '지영아 3개 다 클리어! 지지가 춤추고 있어~' },
  { title: '미션 완료! 🏆', body: '지영아 오늘의 미션 끝! 쉬면서 맛있는 거 먹어~' },
  { title: '대단해! 💪', body: '지영아 오늘도 해냈다! 작치 과탑 순항 중~' },
  { title: '지지 감동 중! 🥹', body: '지영아 주말에도 공부하다니... 지지 눈물 날 것 같아' },
  { title: '완벽한 하루! 🌟', body: '지영아 오늘 학습 마무리 완료! 푹 쉬어~ 내일도 화이팅!' },
]

function getDailyCompletionMessage() {
  const kst = getKSTNow()
  const dayIndex = Math.floor(kst.getTime() / 86400000) % COMPLETION_MESSAGES.length
  return COMPLETION_MESSAGES[dayIndex]
}

// State cached from client messages
let cachedStudyState = { studiedToday: false, streak: 0, allDone: false }

function scheduleNotifications() {
  // Clear existing timers
  notificationTimers.forEach(clearTimeout)
  notificationTimers = []

  const state = cachedStudyState

  for (const n of NOTIFICATIONS) {
    const ms = msUntilKST(n.hour, n.min)
    if (ms <= 0) continue

    const timer = setTimeout(() => {
      let { title, body } = n

      // Customize messages based on study state
      if (n.hour === 8) {
        if (state.streak >= 7) {
          body = `지영아 좋은 아침! 🏆 ${state.streak}일 연속! 지지가 감동받았어!`
        } else if (state.streak >= 3) {
          body = `지영아 좋은 아침! 🔥 ${state.streak}일 연속 학습 중! 과탑 각이다!`
        }
      }

      if (n.hour === 19) {
        if (state.allDone) {
          body = '지영아 오늘 학습 다 끝냈네! 🔥 내일도 이 기세로!'
        }
      }

      if (n.hour === 23) {
        if (!state.studiedToday) {
          body = '지영아 5분만 투자해볼까? 📚 지지가 졸고 있어...'
        }
      }

      self.registration.showNotification(title, {
        body,
        icon: '/icons/jiji-notif-192.png',
        badge: '/icons/apple-touch-icon.png',
        tag: n.tag,
        data: { url: '/' },
      })
    }, ms)

    notificationTimers.push(timer)
  }
}

// ── Message handler (receive state from client) ───────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    cachedStudyState = event.data.state ?? cachedStudyState
    scheduleNotifications()
  }

  if (event.data?.type === 'UPDATE_STUDY_STATE') {
    cachedStudyState = event.data.state ?? cachedStudyState
  }

  if (event.data?.type === 'DAILY_COMPLETE') {
    const msg = getDailyCompletionMessage()
    self.registration.showNotification(msg.title, {
      body: msg.body,
      icon: '/icons/jiji-notif-192.png',
      badge: '/icons/apple-touch-icon.png',
      tag: 'jiji-daily-complete',
      data: { url: '/' },
    })
  }

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// ── Notification click handler ────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If app is already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url)
    }),
  )
})

// ── Activate: claim clients immediately ───────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ── Schedule notifications on SW start ────────────────────
scheduleNotifications()
