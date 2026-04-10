export interface Quote {
  text: string
  author: string
}

export const quotes: Quote[] = [
  { text: '배움에는 왕도가 없다.', author: '유클리드' },
  { text: '천재는 1%의 영감과 99%의 노력이다.', author: '에디슨' },
  { text: '아는 것이 힘이다.', author: '프랜시스 베이컨' },
  { text: '오늘 할 수 있는 일을 내일로 미루지 마라.', author: '벤저민 프랭클린' },
  { text: '시작이 반이다.', author: '아리스토텔레스' },
  { text: '실패는 성공의 어머니다.', author: '토마스 에디슨' },
  { text: '끊임없이 노력하는 자만이 성공한다.', author: '나폴레옹' },
  { text: '교육은 미래를 위한 가장 강력한 무기다.', author: '넬슨 만델라' },
  { text: '배움의 끝은 없다.', author: '세네카' },
  { text: '오늘 걷지 않으면 내일은 뛰어야 한다.', author: '한국 속담' },
  { text: '한 번 실패와 영원한 실패를 혼동하지 마라.', author: 'F. 스콧 피츠제럴드' },
  { text: '작은 기회로부터 종종 위대한 업적이 시작된다.', author: '데모스테네스' },
  { text: '할 수 있다고 믿든 없다고 믿든, 당신 말이 맞다.', author: '헨리 포드' },
  { text: '위대한 일은 작은 일들이 모여서 이루어진다.', author: '빈센트 반 고흐' },
  { text: '꾸준함이 천재를 이긴다.', author: '이소룡' },
  { text: '모든 전문가는 한때 초보자였다.', author: '헬렌 헤이스' },
  { text: '배움은 보물이며, 어디든 주인을 따라간다.', author: '중국 속담' },
  { text: '완벽보다는 완성이 낫다.', author: '셰릴 샌드버그' },
  { text: '매일 1%씩 성장하면 1년 뒤 37배가 된다.', author: '제임스 클리어' },
  { text: '결과를 얻으려면 과정을 사랑해야 한다.', author: '빌 월시' },
  { text: '지식에 투자하면 최고의 이자를 받는다.', author: '벤저민 프랭클린' },
  { text: '노력 없이 얻어지는 것은 없다.', author: '소포클레스' },
  { text: '습관이 운명을 만든다.', author: '간디' },
  { text: '내가 멀리 볼 수 있었던 것은 거인의 어깨 위에 올라섰기 때문이다.', author: '아이작 뉴턴' },
  { text: '성공은 준비와 기회가 만나는 곳에 있다.', author: '바비 언서' },
  { text: '반복은 배움의 어머니다.', author: '라틴 속담' },
  { text: '어제보다 나은 오늘이면 충분하다.', author: '한국 속담' },
  { text: '포기하지 않는 한, 실패는 없다.', author: '엘버트 허버드' },
  { text: '미래를 예측하는 가장 좋은 방법은 그것을 만드는 것이다.', author: '앨런 케이' },
  { text: '오래 걸리는 것이 아니라, 포기하는 것이 문제다.', author: '공자' },
  { text: '나는 나의 운명의 주인이요, 나의 영혼의 선장이다.', author: '윌리엄 어니스트 헨리' },
  { text: '행동이 모든 두려움의 치료제다.', author: '톰 홉킨스' },
  { text: '어려운 길이 아름다운 곳으로 이어진다.', author: '한국 속담' },
  { text: '느리더라도 올바른 방향으로 가는 것이 중요하다.', author: '소크라테스' },
  { text: '오늘의 공부가 내일의 자유를 만든다.', author: '프레드릭 더글러스' },
]

export function getRandomQuote(): Quote {
  return quotes[Math.floor(Math.random() * quotes.length)]
}
