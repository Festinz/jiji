import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JijiMascot from '../components/mascot/JijiMascot'
import { useStudyStore } from '../stores/studyStore'
import type { Quiz } from '../data/types'

export default function Review() {
  const navigate = useNavigate()
  const quizResults = useStudyStore((s) => s.quizResults)
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/generated/quizzes.json')
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllQuizzes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Wrong answers only (most recent attempt was wrong)
  const wrongItems = useMemo(() => {
    return allQuizzes
      .map((quiz) => {
        const records = quizResults[quiz.id]
        if (!records?.length) return null
        const last = records[records.length - 1]
        if (last.correct) return null
        return { quiz, date: last.date }
      })
      .filter(Boolean) as { quiz: Quiz; date: string }[]
  }, [allQuizzes, quizResults])

  const categories = useMemo(
    () => [...new Set(wrongItems.map((w) => w.quiz.category))],
    [wrongItems],
  )

  const filtered = activeCategory
    ? wrongItems.filter((w) => w.quiz.category === activeCategory)
    : wrongItems

  // ── Empty / Loading ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center pt-20 gap-4">
        <JijiMascot mood="greeting" size="lg" />
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (wrongItems.length === 0) {
    return (
      <div className="flex flex-col items-center pt-16 gap-4">
        <JijiMascot mood="happy" size="lg" message="오답이 없어! 완벽해!" />
        <p className="text-sm text-gray-500 mt-2">
          틀린 문제가 생기면 여기에 자동으로 모입니다.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <JijiMascot mood="sad" size="sm" />
          <h2 className="text-lg font-bold text-gray-800">오답노트</h2>
        </div>
        <span className="text-xs text-gray-400">{wrongItems.length}문제</span>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
              !activeCategory ? 'bg-[#c9956a] text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeCategory === cat ? 'bg-[#c9956a] text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Wrong items list */}
      <div className="flex flex-col gap-3">
        {filtered.map(({ quiz, date }) => {
          const isOpen = expandedId === quiz.id
          return (
            <div key={quiz.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : quiz.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 flex-1">
                    {quiz.question}
                  </p>
                  <span className="text-gray-300 text-xs shrink-0 mt-0.5">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{date}</p>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 flex flex-col gap-2.5">
                      {/* Answer display */}
                      {quiz.type === 'multiple_choice' && quiz.options && (
                        <div className="flex flex-col gap-1">
                          {quiz.options.map((opt, i) => {
                            const isCorrect = i === quiz.answer
                            return (
                              <div
                                key={i}
                                className={`text-xs px-3 py-1.5 rounded-lg ${
                                  isCorrect
                                    ? 'bg-green-50 text-green-700 font-medium'
                                    : 'text-gray-400'
                                }`}
                              >
                                {isCorrect && '✅ '}
                                {opt}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {quiz.type === 'true_false' && (
                        <p className="text-xs">
                          <span className="text-green-600 font-medium">
                            정답: {quiz.answer === true ? 'O' : 'X'}
                          </span>
                        </p>
                      )}

                      {/* Explanation */}
                      <div className="bg-[#faf5ef] rounded-xl p-3">
                        <p className="text-xs text-gray-600 leading-relaxed">
                          💡 {quiz.explanation}
                        </p>
                      </div>

                      {/* Related cards */}
                      {quiz.relatedCards.length > 0 && (
                        <button
                          onClick={() => navigate('/flashcards')}
                          className="text-xs text-[#c9956a] font-medium text-left"
                        >
                          📇 관련 카드 보기 →
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
