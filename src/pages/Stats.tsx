import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JijiMascot from '../components/mascot/JijiMascot'
import { useStudyStore, LEVEL_THRESHOLDS, getAvatarImagePath } from '../stores/studyStore'
import { useReviewStore, type ReviewItem } from '../stores/reviewStore'
import { useReviewItems } from '../hooks/useReviewItems'

type TabId = 'stats' | 'review'
type ReviewFilter = 'all' | 'quiz' | 'flashcard' | 'concept'

export default function Stats() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'review' ? 'review' : 'stats'
  const [tab, setTab] = useState<TabId>(initialTab)

  const handleTabChange = (t: TabId) => {
    setTab(t)
    setSearchParams(t === 'review' ? { tab: 'review' } : {})
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {[
          { id: 'stats' as TabId, label: '📊 학습 통계' },
          { id: 'review' as TabId, label: '📝 복습 노트' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' ? <StatsTab /> : <ReviewTab />}

      <div className="h-4" />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StatsTab() {
  const {
    totalXP,
    level,
    streak,
    totalAnswered,
    cardProgress,
    quizResults,
    badges,
  } = useStudyStore()

  const getLevelProgress = useStudyStore((s) => s.getLevelProgress)
  const levelProgress = getLevelProgress()

  const [allQuizzes, setAllQuizzes] = useState<
    { id: string; category: string; difficulty: string }[]
  >([])
  const [allFlashcards, setAllFlashcards] = useState<
    { id: string; front: string; back: string }[]
  >([])
  const [showMastered, setShowMastered] = useState(false)

  useEffect(() => {
    fetch('/data/generated/quizzes.json')
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllQuizzes)
      .catch(() => {})
    fetch('/data/generated/flashcards.json')
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllFlashcards)
      .catch(() => {})
  }, [])

  // Mastered cards: SM-2 interval > 21 days
  const masteredCards = useMemo(
    () => {
      const masteredIds = Object.entries(cardProgress)
        .filter(([, p]) => p.interval > 21)
        .map(([id]) => id)
      return allFlashcards.filter((fc) => masteredIds.includes(fc.id))
    },
    [cardProgress, allFlashcards],
  )

  // Total study days
  const studyDays = useMemo(() => {
    const dates = new Set<string>()
    Object.values(quizResults)
      .flat()
      .forEach((r) => dates.add(r.date))
    return dates
  }, [quizResults])

  // Category accuracy
  const categoryStats = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {}
    for (const quiz of allQuizzes) {
      const records = quizResults[quiz.id]
      if (!records?.length) continue
      if (!map[quiz.category]) map[quiz.category] = { correct: 0, total: 0 }
      for (const r of records) {
        map[quiz.category].total++
        if (r.correct) map[quiz.category].correct++
      }
    }
    return Object.entries(map)
      .map(([name, { correct, total }]) => ({
        name,
        pct: Math.round((correct / total) * 100),
        total,
      }))
      .sort((a, b) => b.pct - a.pct)
  }, [allQuizzes, quizResults])

  // Difficulty accuracy
  const diffStats = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    }
    for (const quiz of allQuizzes) {
      const records = quizResults[quiz.id]
      if (!records?.length) continue
      const diff = quiz.difficulty || 'medium'
      for (const r of records) {
        map[diff].total++
        if (r.correct) map[diff].correct++
      }
    }
    return Object.entries(map)
      .filter(([, v]) => v.total > 0)
      .map(([name, { correct, total }]) => ({
        name,
        pct: Math.round((correct / total) * 100),
        total,
      }))
  }, [allQuizzes, quizResults])

  // Monthly calendar heatmap
  const monthCalendar = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDow = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: { day: number | null; date: string; active: boolean; isToday: boolean }[] = []
    for (let i = 0; i < startDow; i++) cells.push({ day: null, date: '', active: false, isToday: false })

    const todayStr = now.toISOString().slice(0, 10)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        day: d,
        date: dateStr,
        active: studyDays.has(dateStr),
        isToday: dateStr === todayStr,
      })
    }
    return { label: `${year}년 ${month + 1}월`, cells }
  }, [studyDays])

  // Level progress
  const currentThreshold = LEVEL_THRESHOLDS.find((t) => t.level === level)
  const avatarKey = currentThreshold?.avatar ?? 'level_1'

  return (
    <>
      <div className="flex items-center gap-2">
        <JijiMascot mood="fire" size="sm" />
        <h2 className="text-lg font-bold text-gray-800">학습 통계</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '총 학습일', value: `${studyDays.size}일` },
          { label: '현재 연속', value: `${streak}일 🔥` },
          { label: '총 XP', value: `${totalXP}` },
          { label: '마스터 카드', value: `${masteredCards.length}장`, clickable: true },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.clickable ? () => setShowMastered((v) => !v) : undefined}
            className={`bg-white rounded-2xl shadow-sm p-3.5 text-center ${
              stat.clickable ? 'active:scale-95 transition-transform' : ''
            }`}
          >
            <p className="text-lg font-bold text-[#c9956a]">{stat.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Level progress */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-3">
          <img
            src={getAvatarImagePath(avatarKey)}
            alt="레벨"
            className="w-10 h-10 object-contain"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 mb-1">
              {levelProgress.isSpecial ? 'SP 지지' : levelProgress.isMaxLevel ? 'MAX LV. 지지 ✨' : `LV.${level} 지지`}
            </p>
            <div className="h-2 bg-[#e8d5c0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${levelProgress.progressPercent}%`,
                  backgroundColor: levelProgress.isMaxLevel ? '#d4a820' : '#c9956a',
                }}
              />
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {levelProgress.isMaxLevel ? 'MAX' : `${levelProgress.currentXP}/${levelProgress.nextLevelXP}`}
          </span>
        </div>
      </div>

      {/* Mastered cards list */}
      <AnimatePresence>
        {showMastered && masteredCards.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">마스터한 카드 ({masteredCards.length}장)</p>
              <p className="text-xs text-gray-400 mb-3">충분히 반복해서 장기기억으로 넘어간 카드</p>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {masteredCards.map((fc) => (
                  <div key={fc.id} className="text-sm border-l-2 border-green-400 pl-3 py-1">
                    <p className="font-medium text-gray-700">{fc.front}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{fc.back}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category accuracy */}
      {categoryStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">카테고리별 정답률</p>
          <div className="flex flex-col gap-3">
            {categoryStats.map(({ name, pct, total }) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 truncate">{name}</span>
                  <span className="text-gray-400 shrink-0">{pct}% ({total}문제)</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c9956a] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty accuracy */}
      {diffStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">난이도별 정답률</p>
          <div className="flex gap-3">
            {diffStats.map(({ name, pct }) => (
              <div key={name} className="flex-1 text-center">
                <div className="relative w-14 h-14 mx-auto">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={`${(pct / 100) * 150.8} 150.8`}
                      strokeLinecap="round"
                      className={
                        name === 'easy'
                          ? 'text-green-400'
                          : name === 'medium'
                            ? 'text-amber-400'
                            : 'text-red-400'
                      }
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                    {pct}%
                  </span>
                </div>
                <span
                  className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full text-white ${
                    name === 'easy'
                      ? 'bg-green-400'
                      : name === 'medium'
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                  }`}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly calendar heatmap */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">{monthCalendar.label}</p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
            <span key={d} className="text-[10px] text-gray-400 mb-1">
              {d}
            </span>
          ))}
          {monthCalendar.cells.map((cell, i) => (
            <div
              key={i}
              className={`aspect-square rounded-md flex items-center justify-center text-[10px] ${
                !cell.day
                  ? ''
                  : cell.isToday
                    ? 'ring-1.5 ring-[#c9956a] ring-offset-1'
                    : ''
              }`}
              style={{
                backgroundColor: !cell.day
                  ? 'transparent'
                  : cell.active
                    ? '#4CAF50'
                    : '#f0ebe4',
                color: cell.active ? 'white' : '#999',
              }}
            >
              {cell.day}
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">획득한 뱃지</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b}
                className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full"
              >
                🏅 {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalAnswered === 0 && (
        <div className="flex flex-col items-center pt-4">
          <JijiMascot mood="sad" size="md" message="아직 학습 기록이 없어!" />
        </div>
      )}
    </>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REVIEW TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ReviewTab() {
  const { reviewItems, loading } = useReviewItems()
  const excludedItems = useReviewStore((s) => s.excludedItems)
  const allItems = useReviewStore((s) => s.reviewItems)
  const markAsKnown = useReviewStore((s) => s.markAsKnown)
  const undoMarkAsKnown = useReviewStore((s) => s.undoMarkAsKnown)

  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [showExcluded, setShowExcluded] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(reviewItems.map((r) => r.category))
    return Array.from(cats).sort()
  }, [reviewItems])

  // Filtered items
  const filtered = useMemo(() => {
    let items = reviewItems
    if (filter !== 'all') items = items.filter((r) => r.type === filter)
    if (categoryFilter !== 'all') items = items.filter((r) => r.category === categoryFilter)
    return items
  }, [reviewItems, filter, categoryFilter])

  // Excluded items with full data
  const excludedFull = useMemo(
    () => allItems.filter((r) => excludedItems.includes(r.id)),
    [allItems, excludedItems],
  )

  const handleMarkAsKnown = (id: string) => {
    setRemovingId(id)
    setTimeout(() => {
      markAsKnown(id)
      setRemovingId(null)
      setConfirmId(null)
    }, 300)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center pt-10">
        <JijiMascot mood="studying" size="md" />
        <p className="text-sm text-gray-400 mt-2">복습 노트 불러오는 중...</p>
      </div>
    )
  }

  if (reviewItems.length === 0 && excludedFull.length === 0) {
    return (
      <div className="flex flex-col items-center pt-10">
        <JijiMascot mood="happy" size="lg" message="복습할 게 없어! 완벽해! 🎉" />
      </div>
    )
  }

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {[
          { id: 'all' as ReviewFilter, label: '전체' },
          { id: 'quiz' as ReviewFilter, label: '퀴즈 오답' },
          { id: 'flashcard' as ReviewFilter, label: '플래시카드' },
          { id: 'concept' as ReviewFilter, label: '시험 포인트' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-[#c9956a] text-white'
                : 'bg-white text-gray-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category dropdown */}
      {categories.length > 1 && (
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full bg-white rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600"
        >
          <option value="all">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {/* Count */}
      <p className="text-xs text-gray-400">{filtered.length}개 항목</p>

      {/* Review cards */}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 1, x: 0 }}
              animate={removingId === item.id ? { opacity: 0, x: 300 } : { opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
            >
              <ReviewCard
                item={item}
                onMarkKnown={() => setConfirmId(item.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && reviewItems.length > 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          해당 필터에 맞는 항목이 없어요.
        </p>
      )}

      {/* Excluded items */}
      {excludedFull.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowExcluded((v) => !v)}
            className="text-xs text-gray-400 underline"
          >
            제거된 항목 보기 ({excludedFull.length}개) {showExcluded ? '▲' : '▼'}
          </button>
          <AnimatePresence>
            {showExcluded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="flex flex-col gap-2">
                  {excludedFull.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400 truncate">
                          {item.type === 'quiz' ? item.question : item.type === 'flashcard' ? item.front : item.title}
                        </p>
                      </div>
                      <button
                        onClick={() => undoMarkAsKnown(item.id)}
                        className="text-xs text-[#c9956a] font-medium shrink-0 ml-2"
                      >
                        다시 복습하기
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-5 mx-6 max-w-sm w-full text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-base font-medium text-gray-800 mb-2">
                정말로 복습 노트에서 제거할까요?
              </p>
              <p className="text-sm text-gray-500 mb-5">
                나중에 다시 추가할 수 있어요.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => handleMarkAsKnown(confirmId)}
                  className="flex-1 py-2.5 rounded-xl bg-[#c9956a] text-white text-sm font-medium"
                >
                  완전히 알아!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Review Card ───────────────────────────────────────────
function ReviewCard({
  item,
  onMarkKnown,
}: {
  item: ReviewItem
  onMarkKnown: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  if (item.type === 'quiz') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex gap-3">
          <span className="text-lg shrink-0">❌</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Q: {item.question}</p>
            {item.myAnswer && (
              <p className="text-xs text-red-500 mt-1">내 답: {item.myAnswer}</p>
            )}
            <p className="text-xs text-green-600 mt-0.5">정답: {item.correctAnswer}</p>

            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-gray-400 mt-2"
            >
              {expanded ? '해설 접기 ▲' : '해설 보기 ▼'}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="text-xs text-gray-500 mt-1 leading-relaxed overflow-hidden"
                >
                  💡 {item.explanation}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex gap-2 mt-3">
              <button
                onClick={onMarkKnown}
                className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-medium"
              >
                완전히 알아! ✅
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (item.type === 'flashcard') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex gap-3">
          <span className="text-lg shrink-0">🃏</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">{item.front}</p>

            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-gray-400 mt-2"
            >
              {expanded ? '답 접기 ▲' : '답 보기 ▼'}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="text-xs text-gray-600 mt-1 leading-relaxed overflow-hidden"
                >
                  {item.back}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex gap-2 mt-3">
              <button
                onClick={onMarkKnown}
                className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-medium"
              >
                완전히 알아! ✅
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // concept
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex gap-3">
        <span className="text-lg shrink-0">⭐</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{item.title}</p>
          {item.summary && (
            <p className="text-xs text-gray-500 mt-1">{item.summary}</p>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-gray-400 mt-2"
          >
            {expanded ? '내용 접기 ▲' : '자세히 보기 ▼'}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="text-xs text-gray-600 mt-1 leading-relaxed overflow-hidden"
              >
                {item.content}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex gap-2 mt-3">
            <button
              onClick={onMarkKnown}
              className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-medium"
            >
              완전히 알아! ✅
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
