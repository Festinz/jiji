interface DailyGoalProps {
  completed: number
  goal: number
}

export default function DailyGoal({ completed, goal }: DailyGoalProps) {
  const done = completed >= goal

  return (
    <div className={`rounded-2xl shadow-sm p-4 text-center ${done ? 'bg-green-50' : 'bg-white'}`}>
      <p className="text-2xl mb-1">{done ? '🎉' : '🎯'}</p>
      <p className="text-sm font-medium">
        오늘 {completed}/{goal} 완료
      </p>
      {done && <p className="text-xs text-success mt-1">일일 목표 달성!</p>}
    </div>
  )
}
