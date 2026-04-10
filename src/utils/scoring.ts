export function calculateXP(correct: boolean, streak: number): number {
  const base = correct ? 10 : 2
  const streakBonus = Math.min(streak, 5) * 2
  return correct ? base + streakBonus : base
}

export function calculateLevel(totalXP: number): number {
  // Each level requires level * 100 XP
  let level = 1
  let xpNeeded = 100
  let remaining = totalXP
  while (remaining >= xpNeeded) {
    remaining -= xpNeeded
    level++
    xpNeeded = level * 100
  }
  return level
}
