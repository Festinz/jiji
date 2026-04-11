import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────
export interface ReviewItem {
  id: string
  type: 'quiz' | 'flashcard' | 'concept'
  // quiz
  question?: string
  myAnswer?: string
  correctAnswer?: string
  explanation?: string
  // flashcard
  front?: string
  back?: string
  // concept
  title?: string
  content?: string
  summary?: string
  // common
  category: string
  addedDate: string
  reviewCount: number
}

interface ReviewState {
  reviewItems: ReviewItem[]
  excludedItems: string[]

  addReviewItem: (item: ReviewItem) => void
  addReviewItems: (items: ReviewItem[]) => void
  getReviewItems: () => ReviewItem[]
  markAsKnown: (itemId: string) => void
  undoMarkAsKnown: (itemId: string) => void
  incrementReviewCount: (itemId: string) => void
}

// ── Store ──────────────────────────────────────────────────
export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviewItems: [],
      excludedItems: [],

      addReviewItem: (item) =>
        set((s) => {
          // Avoid duplicates by id
          if (s.reviewItems.some((r) => r.id === item.id)) {
            // Update existing item
            return {
              reviewItems: s.reviewItems.map((r) =>
                r.id === item.id ? { ...r, ...item, reviewCount: r.reviewCount } : r,
              ),
            }
          }
          return { reviewItems: [...s.reviewItems, item] }
        }),

      addReviewItems: (items) =>
        set((s) => {
          const existing = new Set(s.reviewItems.map((r) => r.id))
          const newItems = items.filter((item) => !existing.has(item.id))
          // Update existing items
          const updated = s.reviewItems.map((r) => {
            const match = items.find((i) => i.id === r.id)
            return match ? { ...r, ...match, reviewCount: r.reviewCount } : r
          })
          return { reviewItems: [...updated, ...newItems] }
        }),

      getReviewItems: () => {
        const s = get()
        return s.reviewItems.filter((r) => !s.excludedItems.includes(r.id))
      },

      markAsKnown: (itemId) =>
        set((s) => ({
          excludedItems: s.excludedItems.includes(itemId)
            ? s.excludedItems
            : [...s.excludedItems, itemId],
        })),

      undoMarkAsKnown: (itemId) =>
        set((s) => ({
          excludedItems: s.excludedItems.filter((id) => id !== itemId),
        })),

      incrementReviewCount: (itemId) =>
        set((s) => ({
          reviewItems: s.reviewItems.map((r) =>
            r.id === itemId ? { ...r, reviewCount: r.reviewCount + 1 } : r,
          ),
        })),
    }),
    { name: 'jiji-review' },
  ),
)
