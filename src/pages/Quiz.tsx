import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JijiMascot from '../components/mascot/JijiMascot'
import type { Mood } from '../components/mascot/JijiMascot'
import { useStudyStore } from '../stores/studyStore'
import { useDailyContent } from '../hooks/useDailyContent'
import type { Quiz as QuizType } from '../data/types'

// ── Result mood ────────────────────────────────────────────
function getResultMood(pct: number): { mood: Mood; message: string } {
  if (pct === 100) return { mood: 'fire', message: '만점! 과탑 확정!' }
  if (pct >= 80) return { mood: 'happy', message: '과탑 각이다!' }
  if (pct >= 60) return { mood: 'greeting', message: '잘했어! 조금만 더!' }
  if (pct >= 40) return { mood: 'studying', message: '좀 더 복습하자!' }
  return { mood: 'sad', message: '괜찮아, 다시 하면 돼!' }
}

// ── Main Component ─────────────────────────────────────────
export default function Quiz() {
  const navigate = useNavigate()
  const daily = useDailyContent()
  const recordQuizResult = useStudyStore((s) => s.recordQuizResult)
  const addXP = useStudyStore((s) => s.addXP)
  const completeQuiz = useStudyStore((s) => s.completeQuiz)

  const [quizSet, setQuizSet] = useState<QuizType[] | null>(null)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | boolean | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [results, setResults] = useState<{ quiz: QuizType; correct: boolean }[]>([])
  const [finished, setFinished] = useState(false)
  const [showWrongOnly, setShowWrongOnly] = useState(false)
  const startTime = useRef(Date.now())

  // Initialize quiz set on first render
  const quizzes = quizSet ?? daily.quizzes
  const total = quizzes.length
  const current = quizzes[index] as QuizType | undefined

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
        <JijiMascot mood="sleeping" size="lg" message="퀴즈가 아직 없어!" />
        <p className="text-sm text-gray-500 text-center mt-2">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">pnpm generate</code>
          로 콘텐츠를 생성하세요.
        </p>
      </div>
    )
  }

  // ── Finished: Result Screen ──────────────────────────────
  if (finished) {
    const correctCount = results.filter((r) => r.correct).length
    const pct = Math.round((correctCount / results.length) * 100)
    const { mood, message } = getResultMood(pct)
    const elapsed = Math.round((Date.now() - startTime.current) / 1000)
    const min = Math.floor(elapsed / 60)
    const sec = elapsed % 60
    const earnedXP = correctCount * 10 + (correctCount === results.length ? 20 : 0)
    const wrongOnes = results.filter((r) => !r.correct)

    return (
      <div className="flex flex-col gap-5 -mx-4 -mt-3 px-4 pt-4 pb-8">
        {/* Mascot */}
        <div className="flex flex-col items-center pt-4">
          <JijiMascot mood={mood} size="lg" message={message} />
        </div>

        {/* Score */}
        <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
          <p className="text-5xl font-bold text-[#c9956a]">
            {correctCount}
            <span className="text-2xl text-gray-400">/{results.length}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">정답률 {pct}%</p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-500">
            <span>⚡ +{earnedXP} XP</span>
            <span>⏱️ {min}분 {sec}초</span>
          </div>
        </div>

        {/* Wrong answers accordion */}
        {wrongOnes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowWrongOnly((v) => !v)}
              className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-700"
            >
              <span>❌ 오답 {wrongOnes.length}개</span>
              <span className="text-gray-400">{showWrongOnly ? '▲' : '▼'}</span>
            </button>
            <AnimatePresence>
              {showWrongOnly && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    {wrongOnes.map(({ quiz }, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium text-gray-700">{quiz.question}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          💡 {quiz.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {wrongOnes.length > 0 && (
            <button
              onClick={() => {
                setQuizSet(wrongOnes.map((r) => r.quiz))
                setIndex(0)
                setSelected(null)
                setShowExplanation(false)
                setResults([])
                setFinished(false)
                startTime.current = Date.now()
              }}
              className="w-full bg-[#c9956a] text-white py-3.5 rounded-2xl font-semibold text-base"
            >
              오답 복습하기 ({wrongOnes.length}문제)
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

  // ── Active Quiz ──────────────────────────────────────────
  if (!current) return null

  const isCorrect =
    selected !== null &&
    (current.type === 'true_false'
      ? selected === current.answer
      : selected === current.answer)

  const handleSelect = (value: number | boolean) => {
    if (selected !== null) return
    setSelected(value)

    const correct =
      current.type === 'true_false'
        ? value === current.answer
        : value === current.answer

    recordQuizResult(current.id, correct)
    if (correct) addXP(10)
    setResults((prev) => [...prev, { quiz: current, correct }])

    // Show explanation after short delay
    setTimeout(() => setShowExplanation(true), 600)
  }

  const handleNext = () => {
    if (index >= total - 1) {
      // All correct bonus
      const allCorrect = results.every((r) => r.correct)
      if (allCorrect) addXP(20)
      if (!quizSet) completeQuiz() // 오답 복습이 아닌 경우에만 완료 처리
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setShowExplanation(false)
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] -mx-4 -mt-3 px-4 pt-3">
      {/* ── 1. Top bar ────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-semibold text-gray-600 shrink-0">
          문제 {index + 1}/{total}
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

      {/* ── 2. Question ───────────────────────────────────── */}
      <div className="relative mb-5">
        {current.isExamPrediction && (
          <span className="inline-block text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full mb-1.5">
            🎯 예상 시험 문제
          </span>
        )}
        <p className="text-lg font-medium text-gray-800 leading-relaxed pr-16">
          {current.question}
        </p>
        <div className="absolute -top-1 right-0">
          <JijiMascot mood="studying" size="sm" />
        </div>
      </div>

      {/* ── 3/4. Answer options ────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {current.type === 'multiple_choice' && current.options ? (
          // 4지선다
          current.options.map((opt, i) => {
            let style = 'bg-white border-gray-200'
            let badge = ''

            if (selected !== null) {
              if (i === current.answer) {
                style = 'bg-green-50 border-green-500'
                badge = '✅'
              } else if (i === selected && i !== current.answer) {
                style = 'bg-red-50 border-red-500'
                badge = '❌'
              } else {
                style = 'bg-white border-gray-100 opacity-50'
              }
            }

            return (
              <motion.button
                key={i}
                whileTap={selected === null ? { scale: 0.98 } : undefined}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm transition-all ${style}`}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {badge && <span className="text-base">{badge}</span>}
                </div>
              </motion.button>
            )
          })
        ) : (
          // O/X
          <div className="flex gap-4">
            {[
              { value: true, label: 'O', color: 'blue' },
              { value: false, label: 'X', color: 'red' },
            ].map(({ value, label, color }) => {
              let style =
                color === 'blue'
                  ? 'bg-blue-50 border-blue-300 text-blue-600'
                  : 'bg-red-50 border-red-300 text-red-500'

              if (selected !== null) {
                if (value === current.answer) {
                  style = 'bg-green-100 border-green-500 text-green-700'
                } else if (value === selected && value !== current.answer) {
                  style = 'bg-red-100 border-red-500 text-red-700'
                } else {
                  style += ' opacity-40'
                }
              }

              return (
                <motion.button
                  key={label}
                  whileTap={selected === null ? { scale: 0.95 } : undefined}
                  onClick={() => handleSelect(value)}
                  disabled={selected !== null}
                  className={`flex-1 py-6 rounded-2xl border-2 text-3xl font-bold transition-all ${style}`}
                >
                  {label}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 5. Explanation slide-up ────────────────────────── */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mt-3 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-5"
          >
            {/* Feedback badge */}
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <span className="text-sm font-semibold text-green-600">✅ 정답!</span>
              ) : (
                <span className="text-sm font-semibold text-red-500">❌ 오답</span>
              )}
            </div>

            {/* Explanation */}
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              💡 {current.explanation}
            </p>

            {/* Related cards link */}
            {current.relatedCards.length > 0 && (
              <p className="text-xs text-[#c9956a] mb-3">
                📇 관련 카드: {current.relatedCards.join(', ')}
              </p>
            )}

            {/* Next button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              className="w-full bg-[#c9956a] text-white py-3.5 rounded-2xl font-semibold text-base"
            >
              {index < total - 1 ? '다음 문제 →' : '결과 보기'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer when no explanation shown */}
      {!showExplanation && <div className="h-4" />}
    </div>
  )
}
