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

export type AvatarKey = 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5' | 'health' | 'sleeping'

export const LEVEL_THRESHOLDS = [
  { level: 1, minXP: 0, avatar: 'level_1' as AvatarKey },
  { level: 2, minXP: 65, avatar: 'level_2' as AvatarKey },
  { level: 3, minXP: 200, avatar: 'level_3' as AvatarKey },
  { level: 4, minXP: 400, avatar: 'level_4' as AvatarKey },
  { level: 5, minXP: 650, avatar: 'level_5' as AvatarKey },
  { level: 6, minXP: 1000, avatar: 'health' as AvatarKey },
  { level: 7, minXP: 1300, avatar: 'sleeping' as AvatarKey },
]

export const AVATAR_NAMES: Record<AvatarKey, string> = {
  level_1: '기본 지지',
  level_2: '꽃단장 지지',
  level_3: '원피스 지지',
  level_4: '단화 지지',
  level_5: '벚꽃 지지',
  health: '만렙 지지 ✨',
  sleeping: '잠자는 지지 💤',
}

export interface LevelProgress {
  currentLevel: number
  currentXP: number
  nextLevelXP: number
  progressPercent: number
  isMaxLevel: boolean
  isSpecial: boolean
}

interface LevelUpResult {
  leveledUp: boolean
  newLevel: number
}

function calculateLevel(totalXP: number): number {
  let lv = 1
  for (const t of LEVEL_THRESHOLDS) {
    if (totalXP >= t.minXP) lv = t.level
  }
  return lv
}

function getUnlockedAvatars(level: number): AvatarKey[] {
  return LEVEL_THRESHOLDS.filter((t) => t.level <= level).map((t) => t.avatar)
}

function getAvatarForLevel(level: number): AvatarKey {
  const t = LEVEL_THRESHOLDS.find((t) => t.level === level)
  return t ? t.avatar : 'level_1'
}

export function getAvatarImagePath(key: AvatarKey): string {
  return `/mascot/${key}.png`
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
  totalXP: number
  level: number
  totalAnswered: number
  // 아바타 시스템
  selectedAvatar: AvatarKey | null
  unlockedAvatars: AvatarKey[]
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
  addXP: (amount: number) => LevelUpResult
  checkAndUpdateStreak: () => void
  resetToday: () => void
  getLevelProgress: () => LevelProgress
  setSelectedAvatar: (avatarKey: AvatarKey | null) => void
  getCurrentAvatar: () => AvatarKey
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
      totalXP: 0,
      level: 1,
      totalAnswered: 0,
      selectedAvatar: null,
      unlockedAvatars: ['level_1'] as AvatarKey[],
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

      addXP: (amount) => {
        const s = get()
        const newXP = s.xp + amount
        const newTotalXP = s.totalXP + amount
        const oldLevel = s.level
        const newLevel = calculateLevel(newTotalXP)
        const leveledUp = newLevel > oldLevel
        const newUnlocked = getUnlockedAvatars(newLevel)

        const newState = {
          xp: newXP,
          totalXP: newTotalXP,
          level: newLevel,
          unlockedAvatars: newUnlocked,
        }
        const badges = checkBadges({ ...s, ...newState })
        set({ ...newState, badges })

        return { leveledUp, newLevel }
      },

      checkAndUpdateStreak: () => {
        const s = get()
        const today = todayStr()

        if (s.lastStudyDate === today) return

        const yesterday = yesterdayStr()
        const newStreak = s.lastStudyDate === yesterday ? s.streak + 1 : 1

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

      getLevelProgress: () => {
        const s = get()
        const currentLevel = s.level
        const currentXP = s.totalXP
        const isSpecial = currentLevel >= 7
        const isMaxLevel = currentLevel >= 6

        if (isSpecial) {
          return { currentLevel, currentXP, nextLevelXP: 1300, progressPercent: 100, isMaxLevel: true, isSpecial: true }
        }

        const currentThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel)!
        const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel + 1)

        if (!nextThreshold || isMaxLevel) {
          const next = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel + 1)
          const nextXP = next ? next.minXP : currentThreshold.minXP
          const range = nextXP - currentThreshold.minXP
          const progress = range > 0 ? Math.min(100, Math.round(((currentXP - currentThreshold.minXP) / range) * 100)) : 100
          return { currentLevel, currentXP, nextLevelXP: nextXP, progressPercent: progress, isMaxLevel, isSpecial: false }
        }

        const range = nextThreshold.minXP - currentThreshold.minXP
        const progress = Math.min(100, Math.round(((currentXP - currentThreshold.minXP) / range) * 100))
        return { currentLevel, currentXP, nextLevelXP: nextThreshold.minXP, progressPercent: progress, isMaxLevel: false, isSpecial: false }
      },

      setSelectedAvatar: (avatarKey) =>
        set({ selectedAvatar: avatarKey }),

      getCurrentAvatar: () => {
        const s = get()
        if (s.selectedAvatar && s.unlockedAvatars.includes(s.selectedAvatar)) {
          return s.selectedAvatar
        }
        return getAvatarForLevel(s.level)
      },
    }),
    { name: 'jiji-study' },
  ),
)
