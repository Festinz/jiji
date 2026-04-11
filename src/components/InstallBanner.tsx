import { motion } from 'framer-motion'

interface InstallBannerProps {
  isIOS: boolean
  onDismiss: () => void
}

export default function InstallBanner({ isIOS, onDismiss }: InstallBannerProps) {
  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-100 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <img
          src="/mascot/greeting.png"
          alt="지지"
          className="w-10 h-10 object-contain shrink-0"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">
            홈 화면에 추가하면 알림을 받을 수 있어요!
          </p>
          {isIOS ? (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Safari 하단{' '}
              <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
                ⎙
              </span>{' '}
              공유 버튼 → "홈 화면에 추가"를 눌러주세요
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              브라우저 메뉴에서 "홈 화면에 추가"를 눌러주세요
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-300 text-lg shrink-0 mt-0.5"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}
