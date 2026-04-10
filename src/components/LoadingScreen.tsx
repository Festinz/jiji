import { motion } from 'framer-motion'

interface LoadingScreenProps {
  progress: number
  message?: string
}

function getMessage(progress: number, custom?: string): string {
  if (custom) return custom
  if (progress < 30) return '문제 만드는 중~'
  if (progress < 70) return '카드 생성 중~'
  return '거의 다 됐어!'
}

export default function LoadingScreen({ progress, message }: LoadingScreenProps) {
  const displayMsg = getMessage(progress, message)
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className="fixed inset-0 z-[100] bg-[#faf5ef] flex flex-col items-center justify-center">
      <p className="text-lg font-semibold text-gray-700 mb-8">{displayMsg}</p>

      {/* Walking mascot */}
      <div className="relative w-full h-32 overflow-hidden">
        <motion.div
          className="absolute top-0"
          animate={{ x: ['-10%', '90%'] }}
          transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
        >
          <motion.img
            src="/mascot/greeting.png"
            alt="걷는 지지"
            width={64}
            height={64}
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
            animate={{
              rotate: [0, -5, 5, -5, 0],
              y: [0, -4, 0, -4, 0],
            }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* Progress section */}
      <div className="w-64 mt-4">
        <p className="text-sm text-gray-500 text-center mb-2">
          지지가 뚜벅뚜벅~ ({clampedProgress}%)
        </p>
        <div className="h-4 rounded-full bg-[#e8d5c0] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#c9956a]"
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  )
}
