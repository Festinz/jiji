import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import JijiMascot from '../components/mascot/JijiMascot'
import { useStudyStore } from '../stores/studyStore'

export default function About() {
  const { xp, cardProgress, quizResults } = useStudyStore()
  const [showResetModal, setShowResetModal] = useState(false)

  const studyDays = useMemo(() => {
    const dates = new Set<string>()
    Object.values(quizResults)
      .flat()
      .forEach((r) => dates.add(r.date))
    return dates.size
  }, [quizResults])

  const masteredCount = useMemo(
    () => Object.values(cardProgress).filter((p) => p.interval > 21).length,
    [cardProgress],
  )

  const handleReset = () => {
    localStorage.removeItem('jiji-study')
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center gap-5 pt-6 pb-8">
      {/* Mascot */}
      <JijiMascot mood="greeting" size="lg" />

      {/* App name */}
      <div className="text-center">
        <h1 className="text-3xl font-bold" style={{ color: '#8b6142' }}>
          지지
        </h1>
        <p className="text-sm text-gray-500 mt-1">지영 지니어스 (JiYoung Genius)</p>
        <p className="text-xs text-[#c9956a] font-medium mt-2">작치의 예비 과탑이 될 여자 👑</p>
        <p className="text-xs text-gray-400 mt-1">졍이만의 공부 창고</p>
      </div>

      {/* Divider */}
      <div className="w-16 h-px bg-gray-200" />

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-[300px]">
        {[
          { label: '총 학습일', value: `${studyDays}일` },
          { label: '총 XP', value: `${xp}` },
          { label: '마스터 카드', value: `${masteredCount}장` },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-lg font-bold text-[#c9956a]">{stat.value}</p>
            <p className="text-[10px] text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-16 h-px bg-gray-200" />

      {/* Reset button */}
      <button
        onClick={() => setShowResetModal(true)}
        className="text-sm text-red-400 font-medium px-4 py-2 rounded-xl bg-red-50"
      >
        데이터 초기화
      </button>

      {/* Version */}
      <p className="text-[10px] text-gray-300">v1.0.0</p>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-4">Made with ☕ and 지지</p>

      {/* ── Reset confirmation modal ──────────────────────── */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-6"
            onClick={() => setShowResetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-[300px] text-center"
            >
              <p className="text-lg font-bold text-gray-800 mb-2">정말 초기화할까요?</p>
              <p className="text-sm text-gray-500 mb-5">
                모든 학습 기록, XP, 스트릭이<br />영구적으로 삭제됩니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm"
                >
                  초기화
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
