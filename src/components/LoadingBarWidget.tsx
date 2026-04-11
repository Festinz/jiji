import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

type LoadingStatus = 'generating-quiz' | 'generating-cards' | 'loading' | 'almost-done'

interface LoadingBarWidgetProps {
  progress: number
  status: LoadingStatus
  onComplete?: () => void
}

const STATUS_TEXT: Record<LoadingStatus, string> = {
  'generating-quiz': '문제 만드는 중~',
  'generating-cards': '카드 생성 중~',
  'loading': '불러오는 중~',
  'almost-done': '거의 다 됐어!',
}

const WALK_FRAMES = ['/mascot/walk_1.png', '/mascot/walk_2.png', '/mascot/walk_3.png']

export default function LoadingBarWidget({ progress, status, onComplete }: LoadingBarWidgetProps) {
  const clamped = Math.min(100, Math.max(0, progress))
  const isDone = clamped === 100
  const [frameIndex, setFrameIndex] = useState(0)
  const completeCalled = useRef(false)

  // Walk sprite animation
  useEffect(() => {
    if (isDone) return
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % WALK_FRAMES.length)
    }, 300)
    return () => clearInterval(interval)
  }, [isDone])

  // Complete callback
  useEffect(() => {
    if (isDone && onComplete && !completeCalled.current) {
      completeCalled.current = true
      const timer = setTimeout(onComplete, 800)
      return () => clearTimeout(timer)
    }
  }, [isDone, onComplete])

  const mascotSrc = isDone ? '/mascot/happy.png' : WALK_FRAMES[frameIndex]
  const displayText = isDone ? '완료! 🎉' : STATUS_TEXT[status]

  return (
    <div className="fixed inset-0 z-[100] bg-[#faf5ef] flex flex-col items-center justify-center px-8">
      {/* Status text */}
      <p className="text-lg font-medium text-[#8b6142] mb-8">{displayText}</p>

      {/* Progress bar container */}
      <div className="w-full max-w-[320px] relative">
        {/* Walking mascot positioned on the bar */}
        <div className="relative h-14 mb-1">
          <motion.div
            className="absolute bottom-0 flex items-end gap-1"
            initial={false}
            animate={{ left: `calc(${Math.max(clamped, 5)}% - 24px)` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <img
              src={mascotSrc}
              alt="걷는 지지"
              width={48}
              height={48}
              style={{ imageRendering: 'pixelated' }}
              draggable={false}
            />
            {/* Speech bubble */}
            <div className="bg-white rounded-lg px-2 py-1 shadow-sm text-xs text-gray-600 whitespace-nowrap mb-6 relative">
              {isDone ? '도착!' : '지지가 뚜벅뚜벅~'}
              <div className="absolute -bottom-1 left-2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-white" />
            </div>
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-[#e8d5c0] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#c9956a] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Percentage */}
        <p className="text-sm text-[#8b6142] text-right mt-2">{clamped}%</p>
      </div>
    </div>
  )
}
