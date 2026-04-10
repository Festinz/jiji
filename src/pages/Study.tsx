import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JijiMascot from '../components/mascot/JijiMascot'
import { useStudyStore } from '../stores/studyStore'
import { useDailyContent } from '../hooks/useDailyContent'
import type { ConceptCard } from '../data/types'

// ── Swipe direction tracking ───────────────────────────────
const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
}

const SWIPE_THRESHOLD = 50

// ── Highlight keywords ─────────────────────────────────────
function highlightKeywords(text: string): React.ReactNode[] {
  // Bold markdown-style **keyword** or just return plain text
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-[#c9956a]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ── Main Component ─────────────────────────────────────────
export default function Study() {
  const navigate = useNavigate()
  const daily = useDailyContent()
  const completeConceptSet = useStudyStore((s) => s.completeConceptSet)
  const addXP = useStudyStore((s) => s.addXP)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)

  const cards: ConceptCard[] = daily.conceptSet?.cards ?? []
  const total = cards.length

  const goTo = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= total) return
      setDirection(newIndex > currentIndex ? 1 : -1)
      setCurrentIndex(newIndex)
    },
    [currentIndex, total],
  )

  const handleComplete = useCallback(() => {
    if (!daily.conceptSet) return
    completeConceptSet(daily.conceptSet.id)
    addXP(20)
    setShowFeedback(true)
    setTimeout(() => navigate('/'), 1500)
  }, [daily.conceptSet, completeConceptSet, addXP, navigate])

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
        <JijiMascot mood="sleeping" size="lg" message="콘텐츠가 아직 없어!" />
        <p className="text-sm text-gray-500 text-center mt-2">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">pnpm generate</code>
          로 콘텐츠를 생성하세요.
        </p>
      </div>
    )
  }

  const card = cards[currentIndex]
  const isLast = currentIndex === total - 1

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] -mx-4 -mt-3 px-4 pt-3 relative">
      {/* ── Feedback overlay ──────────────────────────────── */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(76,175,80,0.15)' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <JijiMascot mood="happy" size="lg" message="학습 완료! +20 XP" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Top bar ────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3">
        {/* Segmented progress bar */}
        <div className="flex-1 flex gap-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: i <= currentIndex ? '#c9956a' : '#e8d5c0',
              }}
            />
          ))}
        </div>

        {/* Counter */}
        <span className="text-xs text-gray-400 font-medium shrink-0">
          {currentIndex + 1}/{total}
        </span>

        {/* Close */}
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm shrink-0"
        >
          ✕
        </button>
      </div>

      {/* ── 2. Card area (swipeable) ──────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -SWIPE_THRESHOLD && currentIndex < total - 1) {
                goTo(currentIndex + 1)
              } else if (info.offset.x > SWIPE_THRESHOLD && currentIndex > 0) {
                goTo(currentIndex - 1)
              }
            }}
            className="absolute inset-0"
          >
            <div className="bg-white rounded-3xl shadow-md h-full flex flex-col p-5 overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex-1 pr-2">
                  {card.title}
                </h2>
                {card.isExamPoint && (
                  <span className="shrink-0 bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    ⭐ 시험 포인트
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 text-base text-gray-700 leading-relaxed whitespace-pre-line">
                {highlightKeywords(card.content)}
              </div>

              {/* Summary */}
              {card.summary && (
                <div className="mt-4 bg-[#faf5ef] rounded-xl p-3">
                  <p className="text-sm text-gray-600 font-medium">
                    💡 {card.summary}
                  </p>
                </div>
              )}

              {/* Complete button on last card */}
              {isLast && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleComplete}
                  className="mt-5 w-full bg-[#c9956a] text-white py-3.5 rounded-2xl font-semibold text-base"
                >
                  학습 완료! 🎉
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 3. Bottom arrows ──────────────────────────────── */}
      <div className="flex items-center justify-between py-3">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl text-gray-400 disabled:opacity-30"
        >
          ←
        </button>

        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentIndex ? 'bg-[#c9956a]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === total - 1}
          className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl text-gray-400 disabled:opacity-30"
        >
          →
        </button>
      </div>

      {/* ── 5. Mini mascot ────────────────────────────────── */}
      <div className="absolute bottom-20 right-2 pointer-events-none">
        <JijiMascot mood="studying" size="sm" />
      </div>
    </div>
  )
}
