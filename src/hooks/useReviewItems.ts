import { useState, useEffect, useMemo } from 'react'
import { useStudyStore } from '../stores/studyStore'
import { useReviewStore, type ReviewItem } from '../stores/reviewStore'
import type { FlashCard, Quiz, ConceptSet } from '../data/types'

async function loadJSON<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

/**
 * Syncs review items from study data into reviewStore.
 * Returns the active (non-excluded) review items.
 */
export function useReviewItems() {
  const [allFlashcards, setAllFlashcards] = useState<FlashCard[]>([])
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([])
  const [allConceptSets, setAllConceptSets] = useState<ConceptSet[]>([])
  const [loaded, setLoaded] = useState(false)

  const cardProgress = useStudyStore((s) => s.cardProgress)
  const quizResults = useStudyStore((s) => s.quizResults)

  const addReviewItems = useReviewStore((s) => s.addReviewItems)
  const getReviewItems = useReviewStore((s) => s.getReviewItems)
  const reviewItems = useReviewStore((s) => s.reviewItems)
  const excludedItems = useReviewStore((s) => s.excludedItems)

  useEffect(() => {
    Promise.all([
      loadJSON<FlashCard>('/data/generated/flashcards.json'),
      loadJSON<Quiz>('/data/generated/quizzes.json'),
      loadJSON<ConceptSet>('/data/generated/concept-sets.json'),
    ]).then(([fcs, qzs, css]) => {
      setAllFlashcards(fcs)
      setAllQuizzes(qzs)
      setAllConceptSets(css)
      setLoaded(true)
    })
  }, [])

  // Sync review items whenever study data changes
  useEffect(() => {
    if (!loaded) return

    const items: ReviewItem[] = []
    const today = new Date().toISOString().slice(0, 10)

    // a) Quiz wrong answers
    for (const quiz of allQuizzes) {
      const records = quizResults[quiz.id]
      if (!records?.length) continue
      const hasWrong = records.some((r) => !r.correct)
      if (!hasWrong) continue

      let correctAnswer = ''
      if (quiz.type === 'true_false') {
        correctAnswer = quiz.answer === true ? 'O' : 'X'
      } else if (quiz.options && typeof quiz.answer === 'number') {
        correctAnswer = quiz.options[quiz.answer] ?? ''
      }

      items.push({
        id: `review-quiz-${quiz.id}`,
        type: 'quiz',
        question: quiz.question,
        myAnswer: '', // We don't track the specific wrong answer in studyStore
        correctAnswer,
        explanation: quiz.explanation,
        category: quiz.category,
        addedDate: records.find((r) => !r.correct)?.date ?? today,
        reviewCount: 0,
      })
    }

    // b) Flashcards with low SM-2 scores
    for (const fc of allFlashcards) {
      const progress = cardProgress[fc.id]
      if (!progress) continue
      if (progress.easeFactor < 2.0 || progress.repetitions < 3) {
        items.push({
          id: `review-fc-${fc.id}`,
          type: 'flashcard',
          front: fc.front,
          back: fc.back,
          category: fc.category,
          addedDate: today,
          reviewCount: 0,
        })
      }
    }

    // c) Concept cards with isExamPoint
    for (const cs of allConceptSets) {
      for (const card of cs.cards) {
        if (!card.isExamPoint) continue
        const id = `review-concept-${cs.id}-${card.title}`
        items.push({
          id,
          type: 'concept',
          title: card.title,
          content: card.content,
          summary: card.summary,
          category: cs.category,
          addedDate: today,
          reviewCount: 0,
        })
      }
    }

    if (items.length > 0) {
      addReviewItems(items)
    }
  }, [loaded, allQuizzes, allFlashcards, allConceptSets, quizResults, cardProgress, addReviewItems])

  const activeItems = useMemo(() => getReviewItems(), [reviewItems, excludedItems, getReviewItems])

  return { reviewItems: activeItems, loading: !loaded }
}
