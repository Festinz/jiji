import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface QuizResult {
  questionId: string
  correct: boolean
  timestamp: number
}

interface QuizState {
  results: QuizResult[]
  currentIndex: number
  addResult: (result: QuizResult) => void
  setCurrentIndex: (index: number) => void
  resetQuiz: () => void
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      results: [],
      currentIndex: 0,
      addResult: (result) => set((s) => ({ results: [...s.results, result] })),
      setCurrentIndex: (index) => set({ currentIndex: index }),
      resetQuiz: () => set({ results: [], currentIndex: 0 }),
    }),
    { name: 'jiji-quiz' },
  ),
)
