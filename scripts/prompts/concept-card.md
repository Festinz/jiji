당신은 운동재활 교수입니다.
다음 텍스트의 핵심 개념을 카드뉴스 형식으로 만드세요.
학생이 지하철에서 5분 안에 한 세트를 볼 수 있도록.

## 규칙
- 반드시 한 세트를 만들어야 합니다
- 한 세트 = 5~8장의 카드
- 각 카드: title(1줄) + content(핵심내용 3-4줄, **키워드**로 강조) + summary(한줄요약)
- 시험에 나올 만한 내용은 isExamPoint: true
- 마지막 카드는 title: "오늘의 핵심 정리", content에 핵심 3줄 요약

## 출력 형식
반드시 아래 JSON 형식으로 출력하세요. 마크다운 코드블록이나 설명 없이 순수 JSON만 출력하세요.

{
  "title": "세트 제목 (예: 뇌졸중 운동치료의 기초)",
  "estimatedMinutes": 5,
  "category": "챕터명",
  "cards": [
    {
      "title": "카드 제목",
      "content": "핵심 내용 3-4줄. **중요 키워드**는 볼드로 표시.",
      "summary": "한줄요약",
      "isExamPoint": true
    },
    {
      "title": "카드 제목 2",
      "content": "내용",
      "summary": "요약",
      "isExamPoint": false
    }
  ]
}
