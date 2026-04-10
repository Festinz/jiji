import type { FlashCardData, QuizQuestion } from '../data/types'

/**
 * Select daily content set based on date and SM-2 due cards.
 */
export function selectDailySet<T extends { id: string }>(
  items: T[],
  count: number,
  seed?: string,
): T[] {
  const dateSeed = seed ?? new Date().toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < dateSeed.length; i++) {
    hash = (hash * 31 + dateSeed.charCodeAt(i)) | 0
  }

  const shuffled = [...items].sort((a, b) => {
    const ha = (hash * 31 + a.id.charCodeAt(0)) | 0
    const hb = (hash * 31 + b.id.charCodeAt(0)) | 0
    return ha - hb
  })

  return shuffled.slice(0, count)
}

export function selectDailyFlashcards(cards: FlashCardData[], count = 10) {
  return selectDailySet(cards, count)
}

export function selectDailyQuizzes(quizzes: QuizQuestion[], count = 5) {
  return selectDailySet(quizzes, count)
}
