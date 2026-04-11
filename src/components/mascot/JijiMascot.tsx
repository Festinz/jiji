import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion'
import type { AvatarKey } from '../../stores/studyStore'
import { getAvatarImagePath } from '../../stores/studyStore'

export type Mood = 'greeting' | 'happy' | 'sad' | 'studying' | 'sleeping' | 'fire'

interface JijiMascotProps {
  mood: Mood
  size?: 'sm' | 'md' | 'lg'
  message?: string
  animate?: boolean
  level?: number
  avatarOverride?: AvatarKey | null
  showLevelBadge?: boolean
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

// Level-specific animations
function getLevelAnimation(level: number): TargetAndTransition {
  if (level <= 2) {
    return moodAnimations.greeting
  }
  if (level <= 4) {
    return {
      rotate: [0, -8, 8, -8, 0],
      y: [0, 0, 0, 0, 0, -8, 0],
      transition: { duration: 3, repeat: Infinity, repeatDelay: 0.5 },
    }
  }
  if (level === 5) {
    return {
      rotate: [0, -8, 8, -8, 0],
      transition: { duration: 1.5, repeat: Infinity, repeatDelay: 1 },
    }
  }
  if (level === 6) {
    return {
      rotate: [0, -8, 8, -8, 0],
      transition: { duration: 1.5, repeat: Infinity, repeatDelay: 1 },
    }
  }
  // level 7 (special / sleeping)
  return moodAnimations.sleeping
}

const LEVEL_TO_AVATAR: Record<number, AvatarKey> = {
  1: 'level_1',
  2: 'level_2',
  3: 'level_3',
  4: 'level_4',
  5: 'level_5',
  6: 'health',
  7: 'sleeping',
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

function CherryBlossomParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 6 + i * 2,
            height: 6 + i * 2,
            backgroundColor: '#f8b4c8',
            left: `${15 + i * 18}%`,
            top: -10,
          }}
          animate={{
            y: [0, 120 + i * 20],
            x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 5)],
            opacity: [0, 1, 1, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2.5 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  )
}

function GoldSparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute text-amber-400 select-none"
          style={{
            fontSize: 12 + i * 2,
            left: `${20 + i * 25}%`,
            top: `${10 + i * 20}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          ✦
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

function LevelBadge({ level }: { level: number }) {
  let text: string
  let bgColor: string

  if (level >= 7) {
    text = 'SP'
    bgColor = '#7F77DD'
  } else if (level >= 6) {
    text = 'MAX'
    bgColor = '#d4a820'
  } else {
    text = `LV.${level}`
    bgColor = '#c9956a'
  }

  return (
    <div
      className="mt-1 px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold"
      style={{ backgroundColor: bgColor }}
    >
      {text}
    </div>
  )
}

export default function JijiMascot({
  mood,
  size = 'md',
  message,
  animate = true,
  level,
  avatarOverride,
  showLevelBadge = false,
}: JijiMascotProps) {
  const px = sizeMap[size]

  // Determine image source (priority: mood feedback > avatarOverride > level > mood)
  const isFeedbackMood = mood === 'happy' || mood === 'sad'
  const isFireMood = mood === 'fire'

  let imgSrc: string
  let activeAnimation: TargetAndTransition

  if (isFireMood) {
    // Daily rotation among 4 fire variants
    const FIRE_VARIANTS = ['/mascot/blue.png', '/mascot/red.png', '/mascot/green.png', '/mascot/fire2.png']
    const dayIndex = Math.floor(Date.now() / 86400000) % FIRE_VARIANTS.length
    imgSrc = FIRE_VARIANTS[dayIndex]
    activeAnimation = moodAnimations.fire
  } else if (isFeedbackMood) {
    imgSrc = `/mascot/${mood}.png`
    activeAnimation = moodAnimations[mood]
  } else if (avatarOverride) {
    imgSrc = getAvatarImagePath(avatarOverride)
    const avatarLevel = Object.entries(LEVEL_TO_AVATAR).find(([, v]) => v === avatarOverride)
    activeAnimation = getLevelAnimation(avatarLevel ? Number(avatarLevel[0]) : 1)
  } else if (level) {
    const avatarKey = LEVEL_TO_AVATAR[level] ?? 'level_1'
    imgSrc = getAvatarImagePath(avatarKey)
    activeAnimation = getLevelAnimation(level)
  } else {
    imgSrc = `/mascot/${mood}.png`
    activeAnimation = moodAnimations[mood]
  }

  const showSleepingEffects = (avatarOverride === 'sleeping' || (level === 7 && !avatarOverride)) && !isFeedbackMood && !isFireMood
  const showCherryBlossoms = !isFeedbackMood && !isFireMood && (
    avatarOverride === 'level_5' || (!avatarOverride && level === 5)
  )
  const showGoldSparkles = !isFeedbackMood && !isFireMood && (
    avatarOverride === 'health' || (!avatarOverride && level === 6)
  )

  const displayLevel = level ?? 1

  return (
    <div className="relative inline-flex flex-col items-center">
      <AnimatePresence>
        {message && <SpeechBubble message={message} />}
      </AnimatePresence>

      <motion.div
        className="relative"
        animate={animate ? activeAnimation : undefined}
      >
        {showCherryBlossoms && <CherryBlossomParticles />}
        {showGoldSparkles && <GoldSparkles />}

        <img
          src={imgSrc}
          alt={`지지 - ${mood}`}
          width={px}
          height={px}
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        {showSleepingEffects && animate && <ZzzBubbles />}
      </motion.div>

      {showLevelBadge && <LevelBadge level={displayLevel} />}
    </div>
  )
}
