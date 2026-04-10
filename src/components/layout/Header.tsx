import { useStreakStore } from '../../stores/streakStore'

export default function Header() {
  const streak = useStreakStore((s) => s.currentStreak)

  return (
    <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold text-primary-dark">지지</h1>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-orange-500">🔥 {streak}</span>
      </div>
    </header>
  )
}
