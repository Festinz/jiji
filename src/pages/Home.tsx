import { useMemo, useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JijiMascot from '../components/mascot/JijiMascot'
import type { Mood } from '../components/mascot/JijiMascot'
import AvatarSelector from '../components/mascot/AvatarSelector'
import { useStudyStore, getAvatarImagePath, type AvatarKey } from '../stores/studyStore'
import { useReviewStore } from '../stores/reviewStore'
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

// ── Level avatar mapping ──────────────────────────────────
const LEVEL_AVATAR_MAP: Record<number, AvatarKey> = {
  1: 'level_1', 2: 'level_2', 3: 'level_3', 4: 'level_4',
  5: 'level_5', 6: 'health', 7: 'sleeping',
}

// ── Component ──────────────────────────────────────────────
export default function Home() {
  const totalXP = useStudyStore((s) => s.totalXP)
  const streak = useStudyStore((s) => s.streak)
  const level = useStudyStore((s) => s.level)
  const selectedAvatar = useStudyStore((s) => s.selectedAvatar)
  const todayCompleted = useStudyStore((s) => s.todayCompleted)
  const lastStudyDate = useStudyStore((s) => s.lastStudyDate)
  const quizResults = useStudyStore((s) => s.quizResults)
  const cardProgress = useStudyStore((s) => s.cardProgress)
  const checkAndUpdateStreak = useStudyStore((s) => s.checkAndUpdateStreak)
  const getLevelProgress = useStudyStore((s) => s.getLevelProgress)
  const reviewItemsAll = useReviewStore((s) => s.reviewItems)
  const excludedItems = useReviewStore((s) => s.excludedItems)
  const pendingReviewCount = reviewItemsAll.filter((r) => !excludedItems.includes(r.id)).length
  const daily = useDailyContent()

  const [levelUpModal, setLevelUpModal] = useState<{ level: number } | null>(null)

  // Check streak on mount
  useEffect(() => { checkAndUpdateStreak() }, [checkAndUpdateStreak])

  const todayStr = new Date().toISOString().slice(0, 10)
  const didStudyToday = lastStudyDate === todayStr
  const allDone = todayCompleted.concept && todayCompleted.flash && todayCompleted.quiz
  const isFireMode = allDone
  const { mood, message } = getGreeting(allDone, didStudyToday)

  // Fire mode: only when all daily tasks completed
  const fireMood: Mood = isFireMode ? 'fire' : mood
  const fireMessage = isFireMode ? '오늘의 지지는 불타오르는 중! 🔥' : message

  const levelProgress = getLevelProgress()

  const reviewCount = daily.flashcards.filter((fc) => cardProgress[fc.id]).length
  const newCount = daily.flashcards.length - reviewCount

  const quote = useMemo(getDailyQuote, [])
  const weekDates = useMemo(getWeekDates, [])

  // Expose level-up trigger for child components (via window event)
  const handleLevelUp = useCallback((newLevel: number) => {
    setLevelUpModal({ level: newLevel })
  }, [])

  // Make handleLevelUp accessible
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__jijiLevelUp = handleLevelUp
    return () => { delete (window as unknown as Record<string, unknown>).__jijiLevelUp }
  }, [handleLevelUp])

  return (
    <div className="flex flex-col gap-4">
      {/* Fire mode background gradient */}
      {isFireMode && (
        <div
          className="fixed inset-x-0 top-0 h-40 pointer-events-none z-0"
          style={{
            background: 'linear-gradient(to bottom, #fff5ee, #faf5ef00)',
          }}
        />
      )}

      {/* ── 1. Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1 relative z-10">
        <Link to="/about" className="text-xl font-bold no-underline" style={{ color: '#8b6142' }}>
          지지
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="bg-orange-50 text-orange-500 font-semibold px-2.5 py-1 rounded-full">
            🔥 {streak}일
          </span>
          <span className="text-gray-500 font-medium">{totalXP} XP</span>
        </div>
      </div>

      {/* ── 2. Mascot ─────────────────────────────────────── */}
      <div className="flex flex-col items-center py-2 relative">
        <div className="relative">
          <JijiMascot
            mood={fireMood}
            size="lg"
            message={fireMessage}
            level={level}
            avatarOverride={isFireMode ? null : selectedAvatar}
            showLevelBadge
          />
          <AvatarSelector />
        </div>
      </div>

      {/* ── 2.3. Level Progress ───────────────────────────── */}
      <LevelProgressCard
        levelProgress={levelProgress}
        level={level}
      />

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

      {/* ── 3.5. Review reminder ──────────────────────────── */}
      {pendingReviewCount > 0 && (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Link
            to="/stats?tab=review"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-sm p-4 no-underline"
          >
            <JijiMascot mood="studying" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                📝 복습할 항목 {pendingReviewCount}개
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                복습하면 기억에 오래 남아!
              </p>
            </div>
            <span className="text-primary font-semibold text-sm shrink-0">보기 →</span>
          </Link>
        </motion.div>
      )}

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

      {/* ── Level Up Modal ────────────────────────────────── */}
      <AnimatePresence>
        {levelUpModal && (
          <LevelUpOverlay
            level={levelUpModal.level}
            onClose={() => setLevelUpModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Level Progress Card ───────────────────────────────────
function LevelProgressCard({
  levelProgress,
  level,
}: {
  levelProgress: {
    currentLevel: number
    currentXP: number
    nextLevelXP: number
    progressPercent: number
    isMaxLevel: boolean
    isSpecial: boolean
  }
  level: number
}) {
  const avatarKey = LEVEL_AVATAR_MAP[level] ?? 'level_1'
  const { isMaxLevel, isSpecial, progressPercent, currentXP, nextLevelXP } = levelProgress

  let levelLabel: string
  if (isSpecial) levelLabel = 'SP 지지'
  else if (isMaxLevel) levelLabel = 'MAX LV. 지지 ✨'
  else levelLabel = `LV.${level} 지지`

  const barColor = isMaxLevel || isSpecial ? '#d4a820' : '#c9956a'

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        {/* Avatar icon */}
        <img
          src={getAvatarImagePath(avatarKey)}
          alt="레벨 아이콘"
          className="w-10 h-10 object-contain shrink-0"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />

        {/* Center: label + bar */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 mb-1.5">{levelLabel}</p>
          <div className="relative h-2 bg-[#e8d5c0] rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: barColor }}
              initial={false}
              animate={{ width: `${Math.max(progressPercent, 4)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          {isMaxLevel && !isSpecial && (
            <p className="text-[10px] text-amber-600 font-medium mt-1">만렙 달성!</p>
          )}
        </div>

        {/* Right: XP display */}
        <div className="text-sm text-gray-500 font-medium shrink-0">
          {isMaxLevel && !isSpecial ? 'MAX' : isSpecial ? 'MAX' : `${currentXP}/${nextLevelXP} XP`}
        </div>
      </div>
    </div>
  )
}

// ── Level Up Overlay ──────────────────────────────────────
function LevelUpOverlay({ level, onClose }: { level: number; onClose: () => void }) {
  const isSpecial = level >= 7
  const isMax = level === 6
  const avatarKey = LEVEL_AVATAR_MAP[level] ?? 'level_1'

  let bgStyle: React.CSSProperties
  let title: string
  let subtitle: string

  if (isSpecial) {
    bgStyle = { background: 'radial-gradient(circle, #7F77DD33 0%, transparent 70%)' }
    title = '🌟 스페셜 달성! 잠자는 지지가 해금되었어!'
    subtitle = '숨겨진 아바타를 만나보세요!'
  } else if (isMax) {
    bgStyle = { background: 'radial-gradient(circle, #d4a82033 0%, transparent 70%)' }
    title = '🏆 만렙 달성! 지지가 최종 진화했어!'
    subtitle = '아바타 선택이 해금되었습니다!'
  } else {
    bgStyle = { background: 'radial-gradient(circle, #c9956a22 0%, transparent 70%)' }
    title = `🎉 레벨 업! LV.${level} 달성!`
    subtitle = '새로운 모습의 지지를 만나보세요!'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="bg-white rounded-3xl p-6 mx-6 max-w-sm w-full text-center shadow-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background effect */}
        <div className="absolute inset-0" style={bgStyle} />

        {/* Confetti */}
        <Confetti />

        <div className="relative z-10">
          <img
            src={getAvatarImagePath(avatarKey)}
            alt="새 레벨 지지"
            className="w-40 h-40 mx-auto object-contain mb-4"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />

          <h2 className="text-lg font-bold text-gray-800 mb-1">{title}</h2>
          <p className="text-sm text-gray-500 mb-5">{subtitle}</p>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-semibold text-white text-sm"
            style={{ backgroundColor: isSpecial ? '#7F77DD' : isMax ? '#d4a820' : '#c9956a' }}
          >
            확인
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Confetti animation ────────────────────────────────────
function Confetti() {
  const colors = ['#c9956a', '#5a8fc4', '#4CAF50', '#ef5350', '#d4a820', '#7F77DD', '#f8b4c8']
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[i % colors.length],
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random(),
    size: 4 + Math.random() * 6,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: `${p.x}%`,
            top: -10,
          }}
          animate={{
            y: [0, 400],
            x: [0, (Math.random() - 0.5) * 80],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
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
const WALK_FRAMES = ['/mascot/walk_1.png', '/mascot/walk_2.png', '/mascot/walk_3.png']

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
  const allDone = pct === 100
  const labels = ['개념', '플래시', '퀴즈']
  const doneFlags = [concept, flash, quiz]

  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    if (allDone) return
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % WALK_FRAMES.length)
    }, 300)
    return () => clearInterval(interval)
  }, [allDone])

  const mascotSrc = allDone ? '/mascot/happy.png' : WALK_FRAMES[frameIndex]

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
          src={mascotSrc}
          alt="걸어가는 지지"
          className="absolute top-0.5 h-9 w-9 object-contain"
          style={{ imageRendering: 'pixelated' }}
          initial={false}
          animate={{
            left: `calc(${Math.max(pct, 5)}% - 18px)`,
          }}
          transition={{
            left: { duration: 0.8, ease: 'easeOut' },
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
