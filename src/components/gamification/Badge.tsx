interface BadgeProps {
  icon: string
  label: string
  unlocked: boolean
}

export default function Badge({ icon, label, unlocked }: BadgeProps) {
  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-xl ${unlocked ? '' : 'opacity-30 grayscale'}`}>
      <span className="text-3xl">{icon}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  )
}
