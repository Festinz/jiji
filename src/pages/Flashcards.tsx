import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JijiMascot from '../components/mascot/JijiMascot'
import type { Mood } from '../components/mascot/JijiMascot'
import { useStudyStore } from '../stores/studyStore'
import { useDailyContent } from '../hooks/useDailyContent'
import type { FlashCard } from '../data/types'

// ── Rating config ──────────────────────────────────────────
const RATINGS = [
  { key: 'wrong', quality: 1, emoji: '❌', label: '모르겠어요', color: 'bg-red-500', exitX: -300 },
  { key: 'unsure', quality: 3, emoji: '😐', label: '애매해요', color: 'bg-amber-400', exitY: -300 },
  { key: 'correct', quality: 5, emoji: '⭕', label: '알겠어요', color: 'bg-green-500', exitX: 300 },
] as const

type RatingKey = 'wrong' | 'unsure' | 'correct'

const DIFF_COLORS = { easy: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', hard: 'bg-red-100 text-red-700' }

// ── Result mood ────────────────────────────────────────────
function getResultMood(correctPct: number): { mood: Mood; message: string } {
  if (correctPct === 100) return { mood: 'fire', message: '만점! 천재야!' }
  if (correctPct >= 80) return { mood: 'happy', message: '완벽해!' }
  if (correctPct >= 50) return { mood: 'greeting', message: '좀 더 복습하자!' }
  return { mood: 'sad', message: '괜찮아, 다시 보면 돼!' }
}

// ── Main Component ─────────────────────────────────────────
export default function Flashcards() {
  const navigate = useNavigate()
  const daily = useDailyContent()
  const updateCardProgress = useStudyStore((s) => s.updateCardProgress)
  const addXP = useStudyStore((s) => s.addXP)
  const completeFlash = useStudyStore((s) => s.completeFlash)

  const [deck, setDeck] = useState<FlashCard[] | null>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [exitAnim, setExitAnim] = useState<{ x?: number; y?: number } | null>(null)
  const [stats, setStats] = useState<Record<RatingKey, FlashCard[]>>({
    wrong: [],
    unsure: [],
    correct: [],
  })
  const [finished, setFinished] = useState(false)
  const animating = useRef(false)

  // Snapshot on first load so card progress updates don't reshuffle mid-session
  const snapshotRef = useRef<FlashCard[] | null>(null)
  if (!snapshotRef.current && !daily.loading && daily.flashcards.length > 0 && !deck) {
    snapshotRef.current = [...daily.flashcards]
  }

  const cards = deck ?? snapshotRef.current ?? daily.flashcards
  const total = cards.length
  const current = cards[index] as FlashCard | undefined
  const next = cards[index + 1] as FlashCard | undefined

  // ── Empty state ──────────────────────────────────────────
  if (daily.loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-20">
        <JijiMascot mood="studying" size="lg" />
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-20">
        <JijiMascot mood="sleeping" size="lg" message="카드가 아직 없어!" />
        <p className="text-sm text-gray-500 text-center mt-2">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">pnpm generate</code>
          로 콘텐츠를 생성하세요.
        </p>
      </div>
    )
  }

  // ── Finished: Result Screen ──────────────────────────────
  if (finished) {
    const totalReviewed = stats.correct.length + stats.unsure.length + stats.wrong.length
    const correctPct = totalReviewed > 0 ? Math.round((stats.correct.length / totalReviewed) * 100) : 0
    const { mood, message } = getResultMood(correctPct)
    const earnedXP = stats.correct.length * 5

    return (
      <div className="flex flex-col gap-5 -mx-4 -mt-3 px-4 pt-4 pb-8">
        <div className="flex flex-col items-center pt-4">
          <JijiMascot mood={mood} size="lg" message={message} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">{stats.correct.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">⭕ 알겠어요</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{stats.unsure.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">😐 애매해요</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{stats.wrong.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">❌ 모르겠어요</p>
            </div>
          </div>
          {earnedXP > 0 && (
            <p className="text-center text-sm text-[#c9956a] font-semibold mt-4">
              ⚡ +{earnedXP} XP 획득!
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {stats.wrong.length > 0 && (
            <button
              onClick={() => {
                setDeck(stats.wrong)
                setIndex(0)
                setFlipped(false)
                setExitAnim(null)
                setStats({ wrong: [], unsure: [], correct: [] })
                setFinished(false)
              }}
              className="w-full bg-[#c9956a] text-white py-3.5 rounded-2xl font-semibold text-base"
            >
              모르겠어요 카드 다시 보기 ({stats.wrong.length}장)
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-semibold text-base"
          >
            홈으로
          </button>
        </div>
      </div>
    )
  }

  if (!current) return null

  // ── Rate handler ─────────────────────────────────────────
  const handleRate = (rating: typeof RATINGS[number]) => {
    if (animating.current) return
    animating.current = true

    updateCardProgress(current.id, rating.quality)
    if (rating.quality === 5) addXP(5)

    setStats((prev) => ({
      ...prev,
      [rating.key]: [...prev[rating.key as RatingKey], current],
    }))

    // Exit animation direction
    setExitAnim({
      x: 'exitX' in rating ? rating.exitX : 0,
      y: 'exitY' in rating ? rating.exitY : 0,
    })

    setTimeout(() => {
      if (index >= total - 1) {
        if (!deck) completeFlash() // 오답 복습이 아닌 경우에만 완료 처리
        setFinished(true)
      } else {
        setIndex((i) => i + 1)
        setFlipped(false)
        setExitAnim(null)
      }
      animating.current = false
    }, 300)
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] -mx-4 -mt-3 px-4 pt-3">
      {/* ── 1. Top bar ────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-semibold text-gray-600 shrink-0">
          플래시카드 {index + 1}/{total}
        </span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#c9956a] rounded-full"
            initial={false}
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm shrink-0"
        >
          ✕
        </button>
      </div>

      {/* ── 2. Card stack ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Background card (next) */}
        {next && (
          <div
            className="absolute inset-x-0 mx-auto bg-white rounded-3xl shadow-sm h-[300px] max-w-full"
            style={{ transform: 'scale(0.95) translateY(8px)' }}
          />
        )}

        {/* Current card */}
        <AnimatePresence mode="popLayout">
          {!exitAnim ? (
            <motion.div
              key={index}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="w-full h-[300px] cursor-pointer"
              style={{ perspective: 1000 }}
              onClick={() => !animating.current && setFlipped((f) => !f)}
            >
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 bg-white rounded-3xl shadow-md p-5 flex flex-col"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {/* Category + difficulty */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {current.category}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DIFF_COLORS[current.difficulty]}`}
                    >
                      {current.difficulty}
                    </span>
                  </div>

                  {/* Front text */}
                  <div className="flex-1 flex items-center justify-center px-2">
                    <p className="text-xl font-semibold text-gray-800 text-center leading-relaxed">
                      {current.front}
                    </p>
                  </div>

                  {/* Hint */}
                  <p className="text-xs text-gray-300 text-center mt-2">
                    탭해서 정답 보기
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 bg-white rounded-3xl shadow-md p-5 flex flex-col"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="flex-1 flex items-center justify-center px-2">
                    <p className="text-base text-gray-700 text-center leading-relaxed">
                      {current.back}
                    </p>
                  </div>

                  {/* Tags */}
                  {current.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                      {current.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-[#faf5ef] text-[#c9956a] px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key={`exit-${index}`}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: exitAnim.x ?? 0, y: exitAnim.y ?? 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-[300px] bg-white rounded-3xl shadow-md"
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── 3. Rating buttons (visible after flip) ────────── */}
      <div className="py-4">
        <AnimatePresence>
          {flipped && !exitAnim && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex justify-center gap-6"
            >
              {RATINGS.map((rating) => (
                <button
                  key={rating.key}
                  onClick={() => handleRate(rating)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`w-14 h-14 rounded-full ${rating.color} flex items-center justify-center text-xl text-white shadow-md active:scale-95 transition-transform`}
                  >
                    {rating.emoji}
                  </span>
                  <span className="text-[10px] text-gray-500">{rating.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placeholder space when buttons hidden */}
        {(!flipped || exitAnim) && <div className="h-[82px]" />}
      </div>
    </div>
  )
}
