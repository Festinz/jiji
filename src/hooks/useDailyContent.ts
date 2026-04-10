import { useState, useEffect, useMemo } from 'react'
import { useStudyStore } from '../stores/studyStore'
import { isDueToday } from '../utils/sm2'
import type { FlashCard, Quiz, ConceptSet } from '../data/types'

// ── Types ──────────────────────────────────────────────────
interface DailyContent {
  date: string
  conceptSet: ConceptSet | null
  flashcards: FlashCard[]
  quizzes: Quiz[]
  estimatedMinutes: number
  completed: { concept: boolean; flash: boolean; quiz: boolean }
  loading: boolean
}

// ── JSON loaders ───────────────────────────────────────────
async function loadJSON<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

// ── Date-seeded PRNG (same day = same shuffle) ─────────────
function seededRandom(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return () => {
    hash = (hash * 16807 + 0) % 2147483647
    return (hash & 0x7fffffff) / 0x7fffffff
  }
}

// ── Shuffle without 3+ same-category in a row ──────────────
function shuffleWithCategorySpread<T extends { category: string }>(items: T[], rand?: () => number): T[] {
  const rng = rand ?? Math.random
  // Fisher-Yates shuffle first
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  // Fix consecutive same-category runs of 3+
  for (let i = 2; i < arr.length; i++) {
    if (arr[i].category === arr[i - 1].category && arr[i].category === arr[i - 2].category) {
      // Find a different-category item further down and swap
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j].category !== arr[i].category) {
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
          break
        }
      }
    }
  }

  return arr
}

// ── Sort by difficulty progression ─────────────────────────
const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 } as const

function sortByDifficulty<T extends { difficulty: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (DIFF_ORDER[a.difficulty as keyof typeof DIFF_ORDER] ?? 1) -
      (DIFF_ORDER[b.difficulty as keyof typeof DIFF_ORDER] ?? 1),
  )
}

// ── Interleave review items naturally ──────────────────────
function interleaveReview<T>(newItems: T[], reviewItems: T[]): T[] {
  if (reviewItems.length === 0) return newItems
  const result: T[] = []
  const gap = Math.max(2, Math.floor(newItems.length / (reviewItems.length + 1)))
  let ri = 0

  for (let i = 0; i < newItems.length; i++) {
    result.push(newItems[i])
    if ((i + 1) % gap === 0 && ri < reviewItems.length) {
      result.push(reviewItems[ri++])
    }
  }
  // Append remaining reviews
  while (ri < reviewItems.length) {
    result.push(reviewItems[ri++])
  }

  return result
}

// ── Hook ───────────────────────────────────────────────────
export function useDailyContent(): DailyContent {
  const [allFlashcards, setAllFlashcards] = useState<FlashCard[]>([])
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([])
  const [allConceptSets, setAllConceptSets] = useState<ConceptSet[]>([])
  const [loading, setLoading] = useState(true)

  const cardProgress = useStudyStore((s) => s.cardProgress)
  const quizResults = useStudyStore((s) => s.quizResults)
  const completedSets = useStudyStore((s) => s.completedSets)
  const todayCompleted = useStudyStore((s) => s.todayCompleted)

  // Load data once
  useEffect(() => {
    Promise.all([
      loadJSON<FlashCard>('/data/generated/flashcards.json'),
      loadJSON<Quiz>('/data/generated/quizzes.json'),
      loadJSON<ConceptSet>('/data/generated/concept-sets.json'),
    ]).then(([fcs, qzs, css]) => {
      setAllFlashcards(fcs)
      setAllQuizzes(qzs)
      setAllConceptSets(css)
      setLoading(false)
    })
  }, [])

  const daily = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const rand = seededRandom(today) // 같은 날 = 같은 셔플 결과
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const threeDaysAgoStr = threeDaysAgo.toISOString().slice(0, 10)

    // ── 1. Concept set: 다음 미완료 세트 ─────────────────
    const conceptSet =
      allConceptSets.find((cs) => !completedSets.includes(cs.id)) ?? null

    // ── 2. Flashcard 복습 대상 (SM-2 nextReview <= 오늘) ──
    const dueReviewCards = allFlashcards.filter((fc) => {
      const progress = cardProgress[fc.id]
      if (!progress) return false
      return isDueToday(progress)
    })
    const reviewCards = shuffleWithCategorySpread(dueReviewCards, rand).slice(0, 10)

    // ── 3. 새 플래시카드 (아직 안 본) ────────────────────
    const unseenCards = allFlashcards.filter(
      (fc) => !cardProgress[fc.id],
    )
    const newCardCount = Math.max(0, 15 - reviewCards.length)
    const newCards = sortByDifficulty(
      shuffleWithCategorySpread(unseenCards, rand).slice(0, newCardCount),
    )

    // 복습 카드를 새 카드 사이에 자연스럽게 삽입
    const flashcards = interleaveReview(newCards, reviewCards).slice(0, 15)

    // ── 4. 퀴즈: 최근 오답 복습 + 새 문제 ────────────────
    const recentWrongIds = Object.entries(quizResults)
      .filter(([, records]) =>
        records.some((r) => !r.correct && r.date >= threeDaysAgoStr),
      )
      .map(([id]) => id)

    const reviewQuizzes = allQuizzes
      .filter((q) => recentWrongIds.includes(q.id))
      .slice(0, 5)

    const answeredIds = new Set(Object.keys(quizResults))
    const unseenQuizzes = allQuizzes.filter((q) => !answeredIds.has(q.id))
    const newQuizCount = Math.max(0, 10 - reviewQuizzes.length)
    const newQuizzes = sortByDifficulty(
      shuffleWithCategorySpread(unseenQuizzes, rand).slice(0, newQuizCount),
    )

    const quizzes = interleaveReview(newQuizzes, reviewQuizzes).slice(0, 10)

    // ── 5. 예상 소요 시간 ────────────────────────────────
    const conceptMin = conceptSet ? conceptSet.estimatedMinutes : 0
    const flashMin = Math.ceil(flashcards.length * 0.3) // ~20초/장
    const quizMin = Math.ceil(quizzes.length * 0.4) // ~24초/문제
    const estimatedMinutes = conceptMin + flashMin + quizMin

    return {
      date: today,
      conceptSet,
      flashcards,
      quizzes,
      estimatedMinutes,
      completed: todayCompleted,
      loading,
    }
  }, [
    allFlashcards,
    allQuizzes,
    allConceptSets,
    cardProgress,
    quizResults,
    completedSets,
    todayCompleted,
    loading,
  ])

  return daily
}
