// ── Flashcard ────────────────────────────────────────────
export interface FlashCard {
  id: string // "fc-001"
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  tags: string[]
  chunkId: string
  sm2: {
    interval: number
    repetitions: number
    easeFactor: number
    nextReview: string
  }
}

// ── Quiz ─────────────────────────────────────────────────
export interface Quiz {
  id: string // "qz-001"
  type: 'multiple_choice' | 'true_false'
  question: string
  options?: string[] // 4지선다만
  answer: number | boolean
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  relatedCards: string[]
  chunkId: string
  isExamPrediction?: boolean // 예상 시험 문제 표기
}

// ── Concept Card ─────────────────────────────────────────
export interface ConceptCard {
  title: string
  content: string
  summary: string
  isExamPoint: boolean
}

export interface ConceptSet {
  id: string // "cs-001"
  title: string
  estimatedMinutes: number
  cards: ConceptCard[]
  category: string
}

// ── Legacy compat (used by existing components) ──────────
export type FlashCardData = FlashCard
export type QuizQuestion = Quiz

export interface StudySession {
  date: string
  cardsStudied: number
  correctAnswers: number
  xpEarned: number
  timeSpentMs: number
}
