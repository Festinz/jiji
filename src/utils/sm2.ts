export interface SM2State {
  interval: number
  repetitions: number
  easeFactor: number
  nextReview: string // ISO date string "YYYY-MM-DD"
}

export const defaultSM2: SM2State = {
  interval: 0,
  repetitions: 0,
  easeFactor: 2.5,
  nextReview: new Date().toISOString().slice(0, 10),
}

/**
 * SM-2 간격반복 알고리즘.
 *
 * @param state  현재 카드의 SM-2 상태
 * @param quality 0~5
 *   0-2: 오답/모름 → 리셋, 내일 복습
 *   3: 어려웠음
 *   4: 맞음
 *   5: 쉬웠음
 * @returns 갱신된 SM-2 상태
 */
export function calculateSM2(state: SM2State, quality: number): SM2State {
  const q = Math.max(0, Math.min(5, quality))
  let { easeFactor, interval, repetitions } = state

  if (q < 3) {
    // 오답: 리셋
    interval = 1
    repetitions = 0
  } else {
    // 정답: 간격 확장
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 3
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  // easeFactor 조정
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  // 다음 복습일 계산
  const next = new Date()
  next.setDate(next.getDate() + interval)
  const nextReview = next.toISOString().slice(0, 10)

  return { interval, repetitions, easeFactor, nextReview }
}

/** 오늘 복습 대상인지 확인 */
export function isDueToday(state: SM2State): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return state.nextReview <= today
}
