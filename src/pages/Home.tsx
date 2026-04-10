import { useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import JijiMascot from '../components/mascot/JijiMascot'
import type { Mood } from '../components/mascot/JijiMascot'
import { useStudyStore } from '../stores/studyStore'
import { useDailyContent } from '../hooks/useDailyContent'
import { quotes } from '../data/quotes'

// ── Time-of-day greeting ───────────────────────────────────
function getGreeting(allDone: boolean, didStudy: boolean): { mood: Mood; message: string } {
  if (allDone) return { mood: 'happy', message: '오늘 학습 완료! 대단해!' }
  if (!didStudy) return { mood: 'sleeping', message: '일어나~ 공부하자!' }

  const hour = new Date().getHours()
  if (hour < 12) return { mood: 'greeting', message: '좋은 아침! 오늘도 화이팅~' }
  if (hour < 18) return { mood: 'greeting', message: '오후에도 힘내자!' }
  return { mood: 'greeting', message: '마무리 학습 어때?' }
}

// ── Weekly heatmap data ────────────────────────────────────
function getWeekDates(): { date: string; label: string; isToday: boolean }[] {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  const labels = ['월', '화', '수', '목', '금', '토', '일']
  const todayStr = today.toISOString().slice(0, 10)

  return labels.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    return { date, label, isToday: date === todayStr }
  })
}

// ── Date-seeded quote ──────────────────────────────────────
function getDailyQuote() {
  const seed = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return quotes[Math.abs(hash) % quotes.length]
}

// ── Component ──────────────────────────────────────────────
export default function Home() {
  const xp = useStudyStore((s) => s.xp)
  const streak = useStudyStore((s) => s.streak)
  const todayCompleted = useStudyStore((s) => s.todayCompleted)
  const lastStudyDate = useStudyStore((s) => s.lastStudyDate)
  const quizResults = useStudyStore((s) => s.quizResults)
  const cardProgress = useStudyStore((s) => s.cardProgress)
  const checkAndUpdateStreak = useStudyStore((s) => s.checkAndUpdateStreak)
  const daily = useDailyContent()

  // Check streak on mount
  useEffect(() => { checkAndUpdateStreak() }, [checkAndUpdateStreak])

  const todayStr = new Date().toISOString().slice(0, 10)
  const didStudyToday = lastStudyDate === todayStr
  const allDone = todayCompleted.concept && todayCompleted.flash && todayCompleted.quiz
  const { mood, message } = getGreeting(allDone, didStudyToday)
  const activeMood: Mood = streak >= 3 && !allDone ? 'fire' : mood

  const reviewCount = daily.flashcards.filter((fc) => cardProgress[fc.id]).length
  const newCount = daily.flashcards.length - reviewCount

  const quote = useMemo(getDailyQuote, [])
  const weekDates = useMemo(getWeekDates, [])

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <Link to="/about" className="text-xl font-bold no-underline" style={{ color: '#8b6142' }}>
          지지
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="bg-orange-50 text-orange-500 font-semibold px-2.5 py-1 rounded-full">
            🔥 {streak}일
          </span>
          <span className="text-gray-500 font-medium">{xp} XP</span>
        </div>
      </div>

      {/* ── 2. Mascot ─────────────────────────────────────── */}
      <div className="flex flex-col items-center py-2">
        <JijiMascot mood={activeMood} size="lg" message={message} />
      </div>

      {/* ── 2.5. Walking Progress ─────────────────────────── */}
      <WalkingProgress
        concept={todayCompleted.concept}
        flash={todayCompleted.flash}
        quiz={todayCompleted.quiz}
      />

      {/* ── 3. Today's Study Cards ────────────────────────── */}
      <div className="flex flex-col gap-3">
        <StudyCard
          to="/study"
          icon="📖"
          title="개념 학습"
          subtitle={
            daily.conceptSet
              ? `오늘의 개념: ${daily.conceptSet.title}`
              : '개념 세트 준비 중...'
          }
          meta={
            daily.conceptSet
              ? `약 ${daily.conceptSet.estimatedMinutes}분 소요 · ${daily.conceptSet.cards.length}장`
              : ''
          }
          done={todayCompleted.concept}
          xpReward={20}
        />

        <StudyCard
          to="/flashcards"
          icon="🃏"
          title="플래시카드"
          subtitle={`복습 ${reviewCount}장 + 새 카드 ${newCount}장`}
          meta="약 3분 소요"
          done={todayCompleted.flash}
          xpReward={15}
        />

        <StudyCard
          to="/quiz"
          icon="📝"
          title="퀴즈"
          subtitle={`오늘의 퀴즈 ${daily.quizzes.length}문제`}
          meta="약 4분 소요"
          done={todayCompleted.quiz}
          xpReward={25}
        />
      </div>

      {/* ── 4. Weekly Heatmap ─────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">이번 주 학습</p>
        <div className="flex justify-between gap-1">
          {weekDates.map(({ date, label, isToday }) => {
            const dayActivity = Object.values(quizResults)
              .flat()
              .filter((r) => r.date === date).length
            const intensity =
              dayActivity === 0
                ? 0
                : dayActivity <= 3
                  ? 1
                  : dayActivity <= 8
                    ? 2
                    : 3

            return (
              <div key={date} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-gray-400">{label}</span>
                <div
                  className={`w-8 h-8 rounded-lg ${
                    isToday ? 'ring-2 ring-primary ring-offset-1' : ''
                  }`}
                  style={{
                    backgroundColor:
                      intensity === 0
                        ? '#e8d5c0'
                        : intensity === 1
                          ? '#a5d6a7'
                          : intensity === 2
                            ? '#66bb6a'
                            : '#4CAF50',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 5. Daily Quote ────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-sm text-gray-600 italic leading-relaxed">
          "{quote.text}"
        </p>
        <p className="text-xs text-gray-400 mt-1.5 text-right">— {quote.author}</p>
      </div>

      {/* ── 6. Bottom spacing ─────────────────────────────── */}
      <div className="h-4" />
    </div>
  )
}

// ── Study Card sub-component ───────────────────────────────
function StudyCard({
  to,
  icon,
  title,
  subtitle,
  meta,
  done,
  xpReward,
}: {
  to: string
  icon: string
  title: string
  subtitle: string
  meta: string
  done: boolean
  xpReward: number
}) {
  return (
    <motion.div whileTap={done ? undefined : { scale: 0.98 }}>
      <Link
        to={done ? '#' : to}
        className={`block bg-white rounded-2xl shadow-sm p-4 no-underline transition-opacity ${
          done ? 'opacity-60' : ''
        }`}
        onClick={(e) => done && e.preventDefault()}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">{title}</p>
              {done && (
                <span className="text-xs text-success font-semibold flex items-center gap-1">
                  ✅ 완료! +{xpReward} XP
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
            {meta && <p className="text-xs text-gray-400 mt-1">{meta}</p>}
          </div>
          {!done && (
            <span className="text-primary font-semibold text-sm mt-0.5 shrink-0">
              시작 →
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

// ── Walking Progress sub-component ────────────────────────
function WalkingProgress({
  concept,
  flash,
  quiz,
}: {
  concept: boolean
  flash: boolean
  quiz: boolean
}) {
  const doneCount = [concept, flash, quiz].filter(Boolean).length
  const pct = Math.round((doneCount / 3) * 100)
  const labels = ['개념', '플래시', '퀴즈']
  const doneFlags = [concept, flash, quiz]

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-700">오늘의 학습 진행</p>
        <span className="text-xs font-bold text-[#c9956a]">{pct}%</span>
      </div>

      {/* Track */}
      <div className="relative h-10 bg-[#f5ebe0] rounded-full overflow-hidden">
        {/* Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#e8d5c0] to-[#c9956a] rounded-full"
          initial={false}
          animate={{ width: `${Math.max(pct, 8)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Walking mascot */}
        <motion.img
          src="/mascot/greeting.png"
          alt="걸어가는 지지"
          className="absolute top-0.5 h-9 w-9 object-contain"
          style={{ imageRendering: 'pixelated' }}
          initial={false}
          animate={{
            left: `calc(${Math.max(pct, 5)}% - 18px)`,
            rotate: [0, -5, 5, -5, 0],
          }}
          transition={{
            left: { duration: 0.8, ease: 'easeOut' },
            rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 0.5 },
          }}
          draggable={false}
        />

        {/* Goal flag */}
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-lg">🏁</span>
      </div>

      {/* Checkmarks */}
      <div className="flex justify-between mt-2 px-1">
        {labels.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] font-medium ${
              doneFlags[i] ? 'text-[#4CAF50]' : 'text-gray-300'
            }`}
          >
            {doneFlags[i] ? '✅' : '⬜'} {label}
          </span>
        ))}
      </div>
    </div>
  )
}
