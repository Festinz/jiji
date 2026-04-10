import { useMemo } from 'react'
import { useStudyStore } from '../stores/studyStore'
import { isDueToday } from '../utils/sm2'
import type { FlashCard } from '../data/types'

export function useSpacedRepetition(allCards: FlashCard[]) {
  const cardProgress = useStudyStore((s) => s.cardProgress)
  const updateCardProgress = useStudyStore((s) => s.updateCardProgress)

  const dueCards = useMemo(
    () =>
      allCards.filter((card) => {
        const progress = cardProgress[card.id]
        if (!progress) return true // never seen = due
        return isDueToday(progress)
      }),
    [allCards, cardProgress],
  )

  const review = (cardId: string, quality: number) => {
    updateCardProgress(cardId, quality)
  }

  return { dueCards, review }
}
