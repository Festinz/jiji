import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion'

export type Mood = 'greeting' | 'happy' | 'sad' | 'studying' | 'sleeping' | 'fire'

interface JijiMascotProps {
  mood: Mood
  size?: 'sm' | 'md' | 'lg'
  message?: string
  animate?: boolean
}

const sizeMap = { sm: 48, md: 96, lg: 160 } as const

const moodAnimations: Record<Mood, TargetAndTransition> = {
  greeting: {
    rotate: [0, -8, 8, -8, 0],
    transition: { duration: 1.5, repeat: Infinity, repeatDelay: 1 },
  },
  happy: {
    y: [0, -12, 0],
    scale: [1, 1.05, 1],
    transition: { duration: 0.6, repeat: Infinity },
  },
  sad: {
    y: [0, 3, 0],
    rotate: [0, -3, 0],
    transition: { duration: 2, repeat: Infinity },
  },
  studying: {
    rotate: [0, -2, 2, 0],
    transition: { duration: 3, repeat: Infinity },
  },
  sleeping: {
    scaleY: [1, 1.03, 1],
    y: [0, 1, 0],
    transition: { duration: 2.5, repeat: Infinity },
  },
  fire: {
    scale: [1, 1.08, 1],
    rotate: [0, -3, 3, 0],
    transition: { duration: 0.4, repeat: Infinity },
  },
}

function ZzzBubbles() {
  return (
    <div className="absolute -top-6 -right-1 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute text-gray-400 font-bold select-none"
          style={{ fontSize: 10 + i * 4, right: i * 6 }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -20 - i * 8 }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
        >
          z
        </motion.span>
      ))}
    </div>
  )
}

function SpeechBubble({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap"
    >
      <div className="bg-white rounded-2xl px-4 py-2 shadow-md text-sm font-medium text-gray-700 relative">
        {message}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
      </div>
    </motion.div>
  )
}

export default function JijiMascot({
  mood,
  size = 'md',
  message,
  animate = true,
}: JijiMascotProps) {
  const px = sizeMap[size]

  return (
    <div className="relative inline-flex flex-col items-center">
      <AnimatePresence>
        {message && <SpeechBubble message={message} />}
      </AnimatePresence>

      <motion.div
        className="relative"
        animate={animate ? moodAnimations[mood] : undefined}
      >
        <img
          src={`/mascot/${mood}.png`}
          alt={`지지 - ${mood}`}
          width={px}
          height={px}
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        {mood === 'sleeping' && animate && <ZzzBubbles />}
      </motion.div>
    </div>
  )
}
