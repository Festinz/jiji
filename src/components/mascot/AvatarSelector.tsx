import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useStudyStore,
  AVATAR_NAMES,
  getAvatarImagePath,
  type AvatarKey,
} from '../../stores/studyStore'

const NORMAL_AVATARS: AvatarKey[] = ['level_1', 'level_2', 'level_3', 'level_4', 'level_5', 'health']
const SPECIAL_AVATARS: AvatarKey[] = ['sleeping']

export default function AvatarSelector() {
  const [open, setOpen] = useState(false)
  const level = useStudyStore((s) => s.level)
  const selectedAvatar = useStudyStore((s) => s.selectedAvatar)
  const unlockedAvatars = useStudyStore((s) => s.unlockedAvatars)
  const setSelectedAvatar = useStudyStore((s) => s.setSelectedAvatar)
  const getCurrentAvatar = useStudyStore((s) => s.getCurrentAvatar)
  const todayCompleted = useStudyStore((s) => s.todayCompleted)

  const isMaxLevel = level >= 6
  const isFireMode = todayCompleted.concept && todayCompleted.flash && todayCompleted.quiz

  if (!isMaxLevel) return null

  const currentAvatar = getCurrentAvatar()

  const handleSelect = (key: AvatarKey) => {
    if (!unlockedAvatars.includes(key)) return
    setSelectedAvatar(key === currentAvatar && selectedAvatar !== null ? null : key)
    setOpen(false)
  }

  const [showFireToast, setShowFireToast] = useState(false)

  const handleToggleClick = () => {
    if (isFireMode) {
      setShowFireToast(true)
      setTimeout(() => setShowFireToast(false), 2000)
      return
    }
    setOpen(true)
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={handleToggleClick}
        className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center text-sm active:scale-90 transition-transform z-10"
        aria-label="아바타 변경"
      >
        🔄
      </button>

      {/* Fire mode toast */}
      <AnimatePresence>
        {showFireToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full z-20"
          >
            파이어 모드 중에는 변경 불가! 🔥
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[70vh] overflow-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="text-base font-bold text-gray-800">지지 스타일 변경</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Normal avatars */}
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-400 font-medium mb-2">일반 아바타</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {NORMAL_AVATARS.map((key) => (
                    <AvatarCard
                      key={key}
                      avatarKey={key}
                      selected={currentAvatar === key}
                      locked={false}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>

              {/* Special avatars */}
              <div className="px-4 pb-6">
                <p className="text-xs text-gray-400 font-medium mb-2">스페셜 아바타</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {SPECIAL_AVATARS.map((key) => {
                    const locked = !unlockedAvatars.includes(key)
                    return (
                      <AvatarCard
                        key={key}
                        avatarKey={key}
                        selected={currentAvatar === key}
                        locked={locked}
                        onSelect={handleSelect}
                      />
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function AvatarCard({
  avatarKey,
  selected,
  locked,
  onSelect,
}: {
  avatarKey: AvatarKey
  selected: boolean
  locked: boolean
  onSelect: (key: AvatarKey) => void
}) {
  const isSpecial = avatarKey === 'sleeping'

  return (
    <button
      onClick={() => !locked && onSelect(avatarKey)}
      className={`relative flex flex-col items-center gap-1.5 p-2 rounded-2xl min-w-[80px] transition-all ${
        selected ? 'border-2 border-[#c9956a] bg-orange-50' : 'border-2 border-transparent'
      } ${locked ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
    >
      <div className="relative w-14 h-14">
        <img
          src={getAvatarImagePath(avatarKey)}
          alt={AVATAR_NAMES[avatarKey]}
          className="w-full h-full object-contain"
          style={{
            imageRendering: 'pixelated',
            filter: locked ? 'grayscale(1)' : 'none',
          }}
          draggable={false}
        />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg">🔒</span>
          </div>
        )}
        {selected && !locked && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#c9956a] rounded-full flex items-center justify-center">
            <span className="text-white text-[10px]">✓</span>
          </div>
        )}
      </div>

      <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">
        {AVATAR_NAMES[avatarKey]}
      </span>

      {isSpecial && !locked && (
        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: '#7F77DD' }}>
          SPECIAL
        </span>
      )}
      {isSpecial && locked && (
        <span className="text-[8px] text-gray-400 text-center">LV.7 달성 시 해금</span>
      )}
    </button>
  )
}
