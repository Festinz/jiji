import { useEffect } from 'react'
import { motion } from 'framer-motion'
import JijiMascot from '../mascot/JijiMascot'

interface WrongFeedbackProps {
  onDone: () => void
}

export default function WrongFeedback({ onDone }: WrongFeedbackProps) {
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
      style={{ backgroundColor: 'rgba(239,83,80,0.12)' }}
    >
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [-4, 4, -4, 4, 0] }}
        transition={{ duration: 0.3 }}
      >
        <JijiMascot mood="sad" size="lg" message="다시 도전해보자!" />
      </motion.div>
    </motion.div>
  )
}
