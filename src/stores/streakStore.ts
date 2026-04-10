// Streak is now managed by studyStore. This re-exports for backward compat.
import { useStudyStore } from './studyStore'

export const useStreakStore = <T>(selector: (s: { currentStreak: number }) => T): T =>
  useStudyStore((s) => selector({ currentStreak: s.streak }))
