import { useState, useEffect, useMemo } from 'react'
import JijiMascot from '../components/mascot/JijiMascot'
import { useStudyStore } from '../stores/studyStore'

export default function Stats() {
  const {
    xp,
    level,
    streak,
    totalAnswered,
    cardProgress,
    quizResults,
    badges,
  } = useStudyStore()

  const [allQuizzes, setAllQuizzes] = useState<
    { id: string; category: string; difficulty: string }[]
  >([])

  useEffect(() => {
    fetch('/data/generated/quizzes.json')
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllQuizzes)
      .catch(() => {})
  }, [])

  // Mastered cards: SM-2 interval > 21 days
  const masteredCount = useMemo(
    () => Object.values(cardProgress).filter((p) => p.interval > 21).length,
    [cardProgress],
  )

  // Total study days (unique dates from quiz results)
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
    const startDow = (firstDay.getDay() + 6) % 7 // 0=Mon
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: { day: number | null; date: string; active: boolean; isToday: boolean }[] = []
    // Empty cells before first day
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
    return {
      label: `${year}년 ${month + 1}월`,
      cells,
    }
  }, [studyDays])

  const DIFF_COLORS: Record<string, string> = {
    easy: 'bg-green-400',
    medium: 'bg-amber-400',
    hard: 'bg-red-400',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <JijiMascot mood="fire" size="sm" />
        <h2 className="text-lg font-bold text-gray-800">학습 통계</h2>
      </div>

      {/* ── Summary cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '총 학습일', value: `${studyDays.size}일` },
          { label: '현재 연속', value: `${streak}일 🔥` },
          { label: '총 XP', value: `${xp} (Lv.${level})` },
          { label: '마스터 카드', value: `${masteredCount}장` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-3.5 text-center">
            <p className="text-lg font-bold text-[#c9956a]">{stat.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Category accuracy ─────────────────────────────── */}
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

      {/* ── Difficulty accuracy ────────────────────────────── */}
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
                  className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    DIFF_COLORS[name] ?? 'bg-gray-200'
                  } text-white`}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Monthly calendar heatmap ──────────────────────── */}
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

      {/* ── Badges ────────────────────────────────────────── */}
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

      {/* Empty state mascot */}
      {totalAnswered === 0 && (
        <div className="flex flex-col items-center pt-4">
          <JijiMascot mood="sad" size="md" message="아직 학습 기록이 없어!" />
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}
