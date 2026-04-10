import { motion } from 'framer-motion'
import { useStreakStore } from '../../stores/streakStore'

export default function StreakBanner() {
  const streak = useStreakStore((s) => s.currentStreak)

  if (streak < 2) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-2xl px-4 py-3 text-center text-sm font-semibold"
    >
      🔥 {streak}일 연속 학습 중!
    </motion.div>
  )
}
