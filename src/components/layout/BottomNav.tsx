import { NavLink } from 'react-router-dom'
import { useReviewStore } from '../../stores/reviewStore'

const navItems = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/study', label: '학습', icon: '📖' },
  { to: '/quiz', label: '퀴즈', icon: '📝' },
  { to: '/stats', label: '통계', icon: '📊', showBadge: true },
]

export default function BottomNav() {
  const reviewItems = useReviewStore((s) => s.reviewItems)
  const excludedItems = useReviewStore((s) => s.excludedItems)
  const activeCount = reviewItems.filter((r) => !excludedItems.includes(r.id)).length

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50 h-16">
      <div className="max-w-[430px] mx-auto flex justify-around items-center h-full">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 text-xs px-3 py-1 transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl relative">
              {item.icon}
              {item.showBadge && activeCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1">
                  {activeCount > 99 ? '99+' : activeCount}
                </span>
              )}
            </span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
