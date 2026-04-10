import fs from 'fs'
import path from 'path'

const GEN_DIR = path.resolve('data/generated')
const PUB_DIR = path.resolve('public/data/generated')

const existingQZ = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'quizzes.json'), 'utf-8'))
const existingFC = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'flashcards.json'), 'utf-8'))
const existingCS = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'concept-sets.json'), 'utf-8'))

let qzId = existingQZ.length
let fcId = existingFC.length
let csId = existingCS.length
const now = new Date().toISOString()

function mc(question: string, options: string[], answer: number, explanation: string, diff: string, cat: string) {
  qzId++
  return { id: `qz-${String(qzId).padStart(3, '0')}`, type: 'multiple_choice', question, options, answer, explanation, difficulty: diff, category: cat, relatedCards: [], chunkId: 'exam' }
}

function tf(question: string, answer: boolean, explanation: string, diff: string, cat: string) {
  qzId++
  return { id: `qz-${String(qzId).padStart(3, '0')}`, type: 'true_false', question, answer, explanation, difficulty: diff, category: cat, relatedCards: [], chunkId: 'exam' }
}

function fc(front: string, back: string, diff: string, cat: string, tags: string[]) {
  fcId++
  return { id: `fc-${String(fcId).padStart(3, '0')}`, front, back, difficulty: diff, category: cat, tags, chunkId: 'exam', sm2: { interval: 0, repetitions: 0, easeFactor: 2.5, nextReview: now } }
}

function cs(title: string, cat: string, cards: { title: string; content: string; summary: string; isExamPoint: boolean }[]) {
  csId++
  return { id: `cs-${String(csId).padStart(3, '0')}`, title, estimatedMinutes: 5, cards, category: cat }
}

// ════════════════════════════════════════════════════════════
// 족보 기반 퀴즈 (실제 시험 문제 복원)
// ════════════════════════════════════════════════════════════
const examQZ = [
  mc('운동치료의 개요에 대한 내용으로 올바른 것은?', [
    '작업치료사는 신체기능을 중점으로 한다',
    '작업치료사는 작업수행을 중점으로 한다',
    '운동치료는 약물치료를 포함한다',
    '운동치료는 수술적 접근이다'
  ], 1, '작업치료사는 신체기능보다 작업수행에 중점을 둔다. 시험에서 "신체기능 중점"이 틀린 보기로 출제되었다.', 'medium', '족보 - 운동치료중재의 개요'),

  mc('중재과정과 주요요소로 적합한 것은?', [
    '선택적, 체계적 평가',
    '체계적이고 포괄적인 평가',
    '간단한 관찰만으로 충분',
    '환자의 주관적 의견만 반영'
  ], 1, '"선택적, 체계적"이 아니라 "체계적이고 포괄적인" 평가가 올바른 표현이다. 시험 출제 포인트!', 'medium', '족보 - 운동치료중재의 개요'),

  mc('운동치료 중재 과정에서 "정보의 분석/통합, 해석, 문제목록 작성" 단계의 명칭은?', [
    '정보수집',
    '치료중재',
    '분석 및 사정',
    '재평가'
  ], 2, '운동치료 중재 과정에서 정보 분석/통합 → 해석 → 문제목록 작성 단계를 "분석 및 사정"이라 한다.', 'hard', '족보 - 운동치료중재의 개요'),

  mc('임상적 추론의 필요항목에 대한 설명으로 올바른 것은?', [
    '치료사가 가진 가치와 목표에 관한 이해',
    '클라이언트가 가진 가치와 목표에 관한 이해',
    '치료사의 개인적 경험만으로 충분',
    '문헌 검토는 불필요'
  ], 1, '"치료사"가 아니라 "클라이언트"가 가진 가치와 목표에 관한 이해가 올바르다. 주어를 주의하라!', 'hard', '족보 - 운동치료중재의 개요'),

  mc('임상적 추론의 항목에 포함되지 않는 것은?', [
    '절차적 추론',
    '상호작용적 추론',
    '인과적 추론',
    '조건적 추론'
  ], 2, '임상적 추론: 절차적, 상호작용적, 조건적, 실용적, 서술적 추론이 포함된다. "인과적 추론"은 포함되지 않는다.', 'hard', '족보 - 운동치료중재의 개요'),

  mc('서술적 추론의 올바른 설명은?', [
    '중재 계획을 위해 고려할 점이 무엇인지를 중심으로 추론',
    '클라이언트의 이야기를 이해하고 해석하는 추론',
    '절차적 방법을 결정하는 추론',
    '팀원 간 상호작용을 위한 추론'
  ], 1, '서술적 추론은 클라이언트의 이야기를 이해하고 해석하는 것이다. "중재 계획을 위해 고려할 점 중심"은 실용적 추론에 해당.', 'hard', '족보 - 운동치료중재의 개요'),

  mc('재활 이론의 틀에서 빈칸에 들어갈 말로 올바른 조합은?\n"최대한 클라이언트의 신체적, 정신적, (   ), 직업적, 경제적 기능 회복에 초점. (   )를 사용하거나 환경수정"', [
    '인지적, 보조기구',
    '사회적, 보조공학 장치',
    '감정적, 운동기구',
    '영적, 치료기기'
  ], 1, '재활 FOR: 사회적 기능 회복 포함, 보조공학 장치 사용이 핵심. 시험 빈칸 문제!', 'hard', '족보 - 운동치료중재의 개요'),

  mc('운동치료의 효과에서 빈칸에 들어갈 말은?\n"신경근 조절능력, 균형능력, (   ), 신체협응능력"', [
    '근력',
    '유연성',
    '자세 안정성',
    '심폐지구력'
  ], 2, '운동치료의 효과: 신경근 조절능력, 균형능력, 자세 안정성, 신체협응능력. 시험 빈칸 출제!', 'medium', '족보 - 운동치료중재의 개요'),

  mc('등척성 운동에 대한 설명으로 올바른 것은?', [
    '근육 길이가 변하면서 운동',
    '관절과 관절 사이의 변화가 크다',
    '관절 변화 없이 근육의 힘만 증가',
    '일정 속도로 전 범위 운동'
  ], 2, '등척성(Isometric) 운동은 관절 사이 변화 없이 근육의 힘만 증가한다. 시험 출제!', 'medium', '족보 - 운동치료중재의 개요'),

  mc('다음 중 뇌졸중의 전조증상이 아닌 것은?', [
    '갑작스러운 두통',
    '한쪽 팔다리 저림',
    '얼굴 부종',
    '시야 장애'
  ], 2, '얼굴 부종은 뇌졸중의 전조증상이 아니다. 시험 출제!', 'easy', '족보 - 뇌졸중'),

  mc('허혈성 뇌졸중과 출혈성 뇌졸중의 차이로 올바른 것은?', [
    'A=출혈성, B=허혈성',
    'A=허혈성, B=출혈성',
    '둘 다 혈관이 막힘',
    '둘 다 혈관이 터짐'
  ], 1, '허혈성(Ischemic)=혈관 막힘(경색), 출혈성(Hemorrhagic)=혈관 터짐(출혈). 그림 구별 시험 출제!', 'easy', '족보 - 뇌졸중'),

  mc('뇌졸중 요인 중 "허파 혈전"은 어떤 요인에 해당하는가?', [
    '혈전에 의한 요인',
    '출혈에 의한 요인',
    '색전에 의한 요인',
    '선천성 요인'
  ], 2, '허파 혈전은 색전에 의한 요인이다. 혈전이나 출혈 요인이 아니다! 16, 17번 모두 같은 답으로 출제.', 'hard', '족보 - 뇌졸중'),

  mc('편측의 상하지 또는 얼굴 부분의 근력저하가 나타나고 같은쪽 상지/하지의 마비가 오는 임상증상은?', [
    '실조',
    '경직',
    '편마비',
    '실어증'
  ], 2, '편마비(Hemiplegia)는 편측의 상하지와 얼굴의 근력저하 및 마비가 나타나는 증상이다.', 'easy', '족보 - 뇌졸중'),

  mc('뇌의 오른쪽 반구의 아래쪽 마루엽 병변으로 발생하는 임상증상은?', [
    '실어증',
    '편측무시',
    '경직',
    '실조'
  ], 1, '편측무시(Neglect)는 우뇌 아래쪽 마루엽 병변에서 발생. 좌측 편마비에서 75% 출현.', 'medium', '족보 - 뇌졸중'),

  mc('Broca 영역 손상 시 나타나지 않는 것은?', [
    '"안녕하세요"에 "아어다 다다아"라고 대답',
    '"밥 먹었어요?"에 "나 좀 졸린데?"라고 대답',
    '"잠 잘잤어요?"에 대답하지 않음',
    '물컵 옮기라는 지시에 물컵을 옮김'
  ], 1, 'Broca 손상=운동성 실어증: 말을 못하거나 더듬지만 이해는 가능. "졸린데?"처럼 엉뚱한 대답은 Wernicke 증상이다.', 'hard', '족보 - 뇌졸중'),

  mc('뇌의 언어기능 관련 부위에서 (a)와 (b)에 해당하는 것은?', [
    'a=베르니케, b=브로카',
    'a=브로카, b=베르니케',
    'a=전두엽, b=측두엽',
    'a=두정엽, b=후두엽'
  ], 1, '(a) 브로카(44영역, 말 하기)와 (b) 베르니케(22영역, 말 이해)를 구별해야 한다.', 'medium', '족보 - 뇌졸중'),

  mc('균형검사 등급 Good에 해당하는 것은?', [
    '정적: 손 없이 자세 유지',
    '동적: 머리, 몸 돌리는 동안 자세 유지',
    '정적: 손으로 지지하여 균형 유지',
    '동적: 바닥에 있는 물건을 집어 올리는 동안 자세 유지'
  ], 3, '균형검사 Good 등급: 동적 상태에서 바닥의 물건을 집어 올리는 동안 자세 유지 가능.', 'hard', '족보 - 뇌졸중'),

  mc('위팔세갈래근(Triceps brachii)의 선택적 활성화에 대한 설명으로 올바른 것은?', [
    '팔꿈치 굴곡 운동',
    '팔꿈치 신전 운동',
    '어깨 외전 운동',
    '손목 굴곡 운동'
  ], 1, 'Triceps brachii = 위팔세갈래근 = 팔꿈치 신전(extension) 담당. 시험에 영어로 출제!', 'medium', '족보 - 뇌졸중'),

  // 족보에서 파생된 추가 문제
  tf('뇌졸중에서 "얼굴 부종"은 전조증상에 해당한다.', false, '얼굴 부종은 뇌졸중의 전조증상이 아니다. 갑작스러운 두통, 시야장애, 어지러움 등이 전조증상이다.', 'easy', '족보 - 뇌졸중'),
  tf('허파 혈전은 뇌졸중의 혈전 요인에 해당한다.', false, '허파 혈전은 색전에 의한 요인이다. 혈전이나 출혈 요인이 아님. 시험 2문제 출제!', 'medium', '족보 - 뇌졸중'),
  tf('"인과적 추론"은 임상적 추론의 항목에 포함된다.', false, '임상적 추론에는 절차적, 상호작용적, 조건적, 실용적, 서술적 추론이 포함되며 인과적 추론은 없다.', 'medium', '족보 - 운동치료중재의 개요'),
  tf('유동지지면에서의 앉기 균형조절은 후기 회복기에 해당한다.', true, '유동지지면(불안정한 면)에서의 균형 훈련은 후기 회복기의 높은 수준 활동이다.', 'medium', '족보 - 뇌졸중'),
]

// 족보 기반 플래시카드
const examFC = [
  fc('시험 출제: 운동치료 중재과정에서 "분석 및 사정" 단계에 포함되는 것은?', '정보의 분석/통합, 해석, 문제목록 작성. 시험에서 빈칸으로 출제됨.', 'hard', '족보 포인트', ['족보', '분석및사정']),
  fc('시험 출제: 임상적 추론에서 "클라이언트"와 "치료사"를 헷갈리지 마라!', '"클라이언트가 가진 가치와 목표에 관한 이해"가 올바르다. "치료사"로 바꾸면 틀린 보기!', 'hard', '족보 포인트', ['족보', '주어함정']),
  fc('시험 출제: 임상적 추론 5가지를 나열하시오', '① 절차적 추론 ② 상호작용적 추론 ③ 조건적 추론 ④ 실용적 추론 ⑤ 서술적 추론. "인과적 추론"은 없다!', 'hard', '족보 포인트', ['족보', '임상적추론']),
  fc('시험 출제: 재활 FOR 빈칸 - "사회적, 보조공학 장치"', '재활 FOR = 신체적, 정신적, 사회적, 직업적, 경제적 기능 회복 + 보조공학 장치/환경수정', 'hard', '족보 포인트', ['족보', '재활FOR']),
  fc('시험 출제: 운동치료 효과 빈칸 - "자세 안정성"', '운동치료 효과: 신경근 조절능력, 균형능력, 자세 안정성, 신체협응능력', 'medium', '족보 포인트', ['족보', '치료효과']),
  fc('시험 출제: 허파 혈전은 "색전" 요인이다!', '시험에서 혈전 요인과 출혈 요인 모두에서 "허파 혈전"이 답으로 나옴. 허파 혈전 = 색전 요인!', 'hard', '족보 포인트', ['족보', '허파혈전']),
  fc('시험 출제: Broca 손상에서 나타나지 않는 반응은?', '"밥 먹었어요?"에 "나 좀 졸린데?"처럼 이해 못하는 반응은 Wernicke 증상. Broca는 이해하지만 말을 못함.', 'hard', '족보 포인트', ['족보', 'Broca']),
  fc('시험 출제: 균형검사 Good 등급 = ?', '동적 상태에서 바닥에 있는 물건을 집어 올리는 동안 자세 유지', 'hard', '족보 포인트', ['족보', '균형검사']),
  fc('시험 출제: Triceps brachii의 한글명과 기능', '위팔세갈래근. 팔꿈치 신전(extension) 담당. 시험에 영어로 출제됨!', 'medium', '족보 포인트', ['족보', 'Triceps']),
]

// 족보 개념카드 세트
const examCS = [
  cs('2025 중간고사 족보 핵심 정리', '족보 포인트', [
    { title: '운동치료 개요 출제 포인트', content: '① 작업치료사는 **작업수행** 중점 (신체기능 X). ② "체계적이고 **포괄적인**" 평가 (선택적 X). ③ **분석 및 사정** = 정보분석/통합 + 해석 + 문제목록. ④ **클라이언트**의 가치와 목표 (치료사 X).', summary: '주어 함정(치료사 vs 클라이언트)과 빈칸 문제 주의', isExamPoint: true },
    { title: '임상적 추론 5가지', content: '① **절차적** 추론 ② **상호작용적** 추론 ③ **조건적** 추론 ④ **실용적** 추론 ⑤ **서술적** 추론. "**인과적**" 추론은 없다! 서술적 추론 = 이야기 이해/해석.', summary: '인과적 추론은 없다! 서술적=이야기 해석', isExamPoint: true },
    { title: 'FOR와 운동 원리', content: '**생체역학 FOR** = 반복활동/근력/지구력. **감각운동 FOR** = NDT/PNF/Rood/Brunnstrom. **재활 FOR** = **사회적** + **보조공학 장치**. 운동 효과 빈칸: **자세 안정성**.', summary: '재활FOR 빈칸=사회적, 보조공학 / 효과 빈칸=자세안정성', isExamPoint: true },
    { title: '뇌졸중 출제 포인트', content: '전조증상에 **얼굴 부종 없음**! 허혈성=막힘, 출혈성=터짐 그림 구별. **허파 혈전=색전** 요인 (혈전/출혈 아님). **편측무시** = 우뇌 아래 마루엽. **Broca** 44=말 못함, **Wernicke** 22=이해 못함.', summary: '얼굴부종 X, 허파혈전=색전, Broca/Wernicke 구별', isExamPoint: true },
    { title: '균형검사와 근육', content: '균형 **Good** 등급 = 동적에서 바닥 물건 집기. **Triceps brachii** = 위팔세갈래근 = 팔꿈치 **신전**. 시험에 **영어 근육명**으로 출제됨!', summary: 'Good=물건집기, Triceps=신전, 영어명 암기 필수', isExamPoint: true },
    { title: '오늘의 핵심 정리', content: '족보 25문제 핵심: **주어 함정**(클라이언트 vs 치료사), **빈칸**(분석및사정, 자세안정성, 사회적/보조공학), **없는 것 찾기**(인과적추론, 얼굴부종), **허파혈전=색전**, **Broca 44 vs Wernicke 22**.', summary: '함정·빈칸·없는것·혼동 4가지 유형을 기억하자', isExamPoint: true },
  ]),
]

// MERGE
const mergedQZ = [...existingQZ, ...examQZ]
const mergedFC = [...existingFC, ...examFC]
const mergedCS = [...existingCS, ...examCS]

fs.writeFileSync(path.join(GEN_DIR, 'quizzes.json'), JSON.stringify(mergedQZ, null, 2), 'utf-8')
fs.writeFileSync(path.join(GEN_DIR, 'flashcards.json'), JSON.stringify(mergedFC, null, 2), 'utf-8')
fs.writeFileSync(path.join(GEN_DIR, 'concept-sets.json'), JSON.stringify(mergedCS, null, 2), 'utf-8')

fs.mkdirSync(PUB_DIR, { recursive: true })
fs.copyFileSync(path.join(GEN_DIR, 'flashcards.json'), path.join(PUB_DIR, 'flashcards.json'))
fs.copyFileSync(path.join(GEN_DIR, 'quizzes.json'), path.join(PUB_DIR, 'quizzes.json'))
fs.copyFileSync(path.join(GEN_DIR, 'concept-sets.json'), path.join(PUB_DIR, 'concept-sets.json'))

console.log(`\n✅ 족보 콘텐츠 추가 완료!`)
console.log(`   퀴즈: ${existingQZ.length} → ${mergedQZ.length}문제 (+${examQZ.length})`)
console.log(`   플래시카드: ${existingFC.length} → ${mergedFC.length}장 (+${examFC.length})`)
console.log(`   개념카드: ${existingCS.length} → ${mergedCS.length}세트 (+${examCS.length})`)
