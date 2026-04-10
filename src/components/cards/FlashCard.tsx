import { useState } from 'react'
import { motion } from 'framer-motion'

interface FlashCardProps {
  front: string
  back: string
  onRate: (quality: number) => void
}

export default function FlashCard({ front, back, onRate }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="perspective-[1000px]" onClick={() => setFlipped(!flipped)}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full min-h-[200px] [transform-style:preserve-3d]"
      >
        <div className="absolute inset-0 bg-white rounded-2xl shadow-sm p-6 flex items-center justify-center text-center [backface-visibility:hidden]">
          <p className="text-lg font-medium">{front}</p>
        </div>
        <div className="absolute inset-0 bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="text-base text-gray-700 mb-4">{back}</p>
          {flipped && (
            <div className="flex gap-2 mt-2">
              {[1, 3, 5].map((q) => (
                <button
                  key={q}
                  onClick={(e) => { e.stopPropagation(); onRate(q) }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium text-white ${
                    q === 1 ? 'bg-error' : q === 3 ? 'bg-secondary' : 'bg-success'
                  }`}
                >
                  {q === 1 ? '모름' : q === 3 ? '애매' : '알아!'}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
