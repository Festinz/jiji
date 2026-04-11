import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav'
import InstallBanner from './components/InstallBanner'
import NotifPermissionBanner from './components/NotifPermissionBanner'
import { useNotification } from './hooks/useNotification'
import Home from './pages/Home'
import Study from './pages/Study'
import Quiz from './pages/Quiz'
import Flashcards from './pages/Flashcards'
import Review from './pages/Review'
import Stats from './pages/Stats'
import About from './pages/About'

export default function App() {
  const {
    showInstallBanner,
    dismissInstallBanner,
    isIOSDevice,
    showNotifBanner,
    dismissNotifBanner,
    handleNotifBannerAllow,
  } = useNotification()

  return (
    <div className="min-h-dvh bg-cream flex flex-col max-w-[430px] mx-auto">
      {showNotifBanner && (
        <NotifPermissionBanner onAllow={handleNotifBannerAllow} onDismiss={dismissNotifBanner} />
      )}
      {showInstallBanner && !showNotifBanner && (
        <InstallBanner isIOS={isIOSDevice} onDismiss={dismissInstallBanner} />
      )}
      <main className="flex-1 px-4 pb-20 pt-3">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/review" element={<Review />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
