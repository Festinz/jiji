import { useState } from 'react'
import { motion } from 'framer-motion'

interface QuizCardProps {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  onAnswer: (correct: boolean) => void
}

export default function QuizCard({ question, options, correctIndex, explanation, onAnswer }: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    if (selected !== null) return
    setSelected(index)
    onAnswer(index === correctIndex)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="font-medium text-base mb-4">{question}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          let style = 'border-gray-200 bg-gray-50'
          if (selected !== null) {
            if (i === correctIndex) style = 'border-success bg-green-50 text-success'
            else if (i === selected) style = 'border-error bg-red-50 text-error'
          }
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(i)}
              className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-colors ${style}`}
            >
              {opt}
            </motion.button>
          )
        })}
      </div>
      {selected !== null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-gray-500 leading-relaxed"
        >
          💡 {explanation}
        </motion.p>
      )}
    </div>
  )
}
