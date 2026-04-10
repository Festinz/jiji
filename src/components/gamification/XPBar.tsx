import { motion } from 'framer-motion'

interface XPBarProps {
  current: number
  target: number
  level: number
}

export default function XPBar({ current, target, level }: XPBarProps) {
  const percent = Math.min((current / target) * 100, 100)

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-primary-dark">Lv.{level}</span>
        <span className="text-xs text-gray-400">{current}/{target} XP</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
        />
      </div>
    </div>
  )
}
