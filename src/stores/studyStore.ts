import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateSM2, defaultSM2, type SM2State } from '../utils/sm2'

// ── Types ──────────────────────────────────────────────────
interface QuizRecord {
  correct: boolean
  date: string // "YYYY-MM-DD"
}

interface TodayCompleted {
  concept: boolean
  flash: boolean
  quiz: boolean
}

interface StudyState {
  // SM-2 카드 진행도
  cardProgress: Record<string, SM2State>
  // 퀴즈 결과 이력
  quizResults: Record<string, QuizRecord[]>
  // 완료한 개념카드 세트
  completedSets: string[]
  // XP / 레벨
  xp: number
  level: number
  totalAnswered: number
  // 스트릭
  streak: number
  lastStudyDate: string | null // "YYYY-MM-DD"
  // 오늘 완료 상태
  todayCompleted: TodayCompleted
  // 뱃지
  badges: string[]
  // 하루 목표
  dailyGoal: number
  dailyCompleted: number

  // ── Actions ────────────────────────────────────────────
  updateCardProgress: (cardId: string, quality: number) => void
  recordQuizResult: (quizId: string, correct: boolean) => void
  completeConceptSet: (setId: string) => void
  completeFlash: () => void
  completeQuiz: () => void
  addXP: (amount: number) => void
  checkAndUpdateStreak: () => void
  resetToday: () => void
}

// ── Helpers ────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function checkBadges(state: StudyState): string[] {
  const earned: string[] = [...state.badges]
  const add = (id: string) => { if (!earned.includes(id)) earned.push(id) }

  if (state.streak >= 3) add('streak-3')
  if (state.streak >= 7) add('streak-7')
  if (state.streak >= 30) add('streak-30')
  if (state.totalAnswered >= 50) add('answer-50')
  if (state.totalAnswered >= 100) add('answer-100')
  if (state.totalAnswered >= 500) add('answer-500')
  if (state.completedSets.length >= 1) add('first-concept')
  if (state.completedSets.length >= 10) add('concept-10')
  if (state.level >= 5) add('level-5')
  if (state.level >= 10) add('level-10')

  return earned
}

// ── Store ──────────────────────────────────────────────────
export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      cardProgress: {},
      quizResults: {},
      completedSets: [],
      xp: 0,
      level: 1,
      totalAnswered: 0,
      streak: 0,
      lastStudyDate: null,
      todayCompleted: { concept: false, flash: false, quiz: false },
      badges: [],
      dailyGoal: 10,
      dailyCompleted: 0,

      updateCardProgress: (cardId, quality) =>
        set((s) => {
          const prev = s.cardProgress[cardId] ?? defaultSM2
          const next = calculateSM2(prev, quality)
          return {
            cardProgress: { ...s.cardProgress, [cardId]: next },
          }
        }),

      recordQuizResult: (quizId, correct) =>
        set((s) => {
          const prev = s.quizResults[quizId] ?? []
          const record: QuizRecord = { correct, date: todayStr() }
          return {
            quizResults: { ...s.quizResults, [quizId]: [...prev, record] },
            totalAnswered: s.totalAnswered + 1,
            dailyCompleted: s.dailyCompleted + 1,
          }
        }),

      completeConceptSet: (setId) =>
        set((s) => {
          if (s.completedSets.includes(setId)) return s
          const updated = {
            completedSets: [...s.completedSets, setId],
            todayCompleted: { ...s.todayCompleted, concept: true },
          }
          return updated
        }),

      completeFlash: () =>
        set((s) => ({
          todayCompleted: { ...s.todayCompleted, flash: true },
        })),

      completeQuiz: () =>
        set((s) => ({
          todayCompleted: { ...s.todayCompleted, quiz: true },
        })),

      addXP: (amount) =>
        set((s) => {
          const newXP = s.xp + amount
          const xpForNext = s.level * 100
          const levelUp = newXP >= xpForNext
          const newState = {
            xp: levelUp ? newXP - xpForNext : newXP,
            level: levelUp ? s.level + 1 : s.level,
          }
          const badges = checkBadges({ ...s, ...newState })
          return { ...newState, badges }
        }),

      checkAndUpdateStreak: () => {
        const s = get()
        const today = todayStr()

        // 이미 오늘 체크했으면 스킵
        if (s.lastStudyDate === today) return

        // 어제 학습했으면 스트릭 유지, 아니면 리셋
        const yesterday = yesterdayStr()
        const newStreak = s.lastStudyDate === yesterday ? s.streak + 1 : 1

        // 날짜가 바뀌었으면 todayCompleted 리셋
        set({
          streak: newStreak,
          lastStudyDate: today,
          todayCompleted: { concept: false, flash: false, quiz: false },
          dailyCompleted: 0,
          badges: checkBadges({ ...s, streak: newStreak }),
        })
      },

      resetToday: () =>
        set({
          todayCompleted: { concept: false, flash: false, quiz: false },
          dailyCompleted: 0,
        }),
    }),
    { name: 'jiji-study' },
  ),
)
