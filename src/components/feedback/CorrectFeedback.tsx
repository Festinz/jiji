import { useEffect } from 'react'
import { motion } from 'framer-motion'
import JijiMascot from '../mascot/JijiMascot'

interface CorrectFeedbackProps {
  onDone: () => void
}

export default function CorrectFeedback({ onDone }: CorrectFeedbackProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
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
        <JijiMascot mood="happy" size="lg" message="정답! +10 XP" />
      </motion.div>
    </motion.div>
  )
}
