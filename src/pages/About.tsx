import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import JijiMascot from '../components/mascot/JijiMascot'
import { useStudyStore } from '../stores/studyStore'
import { useNotification } from '../hooks/useNotification'

export default function About() {
  const { totalXP, cardProgress, quizResults } = useStudyStore()
  const [showResetModal, setShowResetModal] = useState(false)
  const {
    permission,
    isPwaMode,
    isIOSDevice,
    requestPermission,
  } = useNotification()

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
    localStorage.removeItem('jiji-review')
    window.location.reload()
  }

  const [notifFeedback, setNotifFeedback] = useState<string | null>(null)

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      setNotifFeedback('이 브라우저에서는 알림을 지원하지 않아요. 홈 화면에 추가한 뒤 다시 시도해주세요!')
      return
    }
    try {
      const result = await requestPermission()
      if (result === 'granted') {
        setNotifFeedback('알림이 설정되었어요! 🎉')
      } else if (result === 'denied') {
        setNotifFeedback('알림이 차단되었어요. 기기 설정 → 지지 → 알림에서 허용해주세요.')
      } else {
        setNotifFeedback('알림 권한 요청이 닫혔어요. 다시 시도해주세요.')
      }
    } catch {
      setNotifFeedback('알림 설정 중 오류가 발생했어요. 홈 화면에 추가한 뒤 다시 시도해주세요!')
    }
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
          { label: '총 XP', value: `${totalXP}` },
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

      {/* ── Notification settings ──────────────────────────── */}
      <div className="w-full max-w-[340px] bg-white rounded-2xl shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">알림 설정</p>

        {/* PWA mode check */}
        {!isPwaMode && (
          <div className="bg-amber-50 rounded-xl p-3 mb-3">
            <p className="text-xs text-amber-700 font-medium mb-1">
              알림을 받으려면 홈 화면에 추가해야 해요
            </p>
            {isIOSDevice ? (
              <p className="text-[11px] text-amber-600 leading-relaxed">
                Safari 하단{' '}
                <span className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono">⎙</span>{' '}
                공유 버튼 → "홈 화면에 추가"
              </p>
            ) : (
              <p className="text-[11px] text-amber-600">
                브라우저 메뉴 → "홈 화면에 추가"
              </p>
            )}
          </div>
        )}

        {/* Notification status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">알림</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {permission === 'granted'
                ? '알림 허용됨 ✅'
                : permission === 'denied'
                  ? '알림 차단됨 ❌'
                  : '알림 미설정'}
            </p>
          </div>
          {permission === 'granted' ? (
            <span className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-medium">
              ON
            </span>
          ) : permission === 'denied' ? (
            <div className="text-right">
              <span className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg font-medium">
                OFF
              </span>
              <p className="text-[10px] text-gray-400 mt-1">기기 설정에서 변경</p>
            </div>
          ) : (
            <button
              onClick={handleRequestNotification}
              className="text-xs bg-[#c9956a] text-white px-3 py-1.5 rounded-lg font-medium"
            >
              허용하기
            </button>
          )}
        </div>

        {permission === 'granted' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 leading-relaxed">
              매일 4번 알림: 오전 8시, 오후 1시, 오후 7시, 오후 11시
            </p>
          </div>
        )}

        {/* 알림 안 올 때 안내 */}
        {permission !== 'granted' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-700 font-medium mb-2">
                알림이 안 오나요?
              </p>
              <p className="text-[11px] text-blue-600 leading-relaxed mb-2">
                위의 "허용하기" 버튼을 눌러 알림을 설정해주세요.
                {isIOSDevice && ' 홈 화면에 추가한 상태에서만 알림이 동작해요.'}
              </p>
              <button
                onClick={handleRequestNotification}
                className="w-full text-xs font-semibold text-white bg-[#5a8fc4] px-4 py-2 rounded-lg active:scale-95 transition-transform"
              >
                🔔 알림 설정하기
              </button>
              {notifFeedback && (
                <p className="text-[11px] text-gray-600 mt-2 leading-relaxed bg-white rounded-lg p-2">
                  {notifFeedback}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

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
