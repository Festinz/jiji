import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/study', label: '학습', icon: '📖' },
  { to: '/quiz', label: '퀴즈', icon: '📝' },
  { to: '/stats', label: '통계', icon: '📊' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50 h-16">
      <div className="max-w-[430px] mx-auto flex justify-around items-center h-full">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs px-3 py-1 transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
