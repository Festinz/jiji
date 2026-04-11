import { motion } from 'framer-motion'

interface NotifPermissionBannerProps {
  onAllow: () => void
  onDismiss: () => void
}

export default function NotifPermissionBanner({ onAllow, onDismiss }: NotifPermissionBannerProps) {
  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-100 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <img
          src="/icons/jiji-notif-192.png"
          alt="지지"
          className="w-10 h-10 object-contain shrink-0 rounded-lg"
          draggable={false}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">
            이제 지지의 알림을 받을 수 있어요! 🔔
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            하루 4번, 지지가 응원 메시지를 보내줘요
          </p>
          <button
            onClick={onAllow}
            className="mt-2 text-xs font-semibold text-white bg-[#c9956a] px-4 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            알림 설정하기
          </button>
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
