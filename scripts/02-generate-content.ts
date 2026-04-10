import fs from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'

// ── Paths ──────────────────────────────────────────────────
const PARSED_DIR = path.resolve('data/parsed')
const GENERATED_DIR = path.resolve('data/generated')
const PROMPTS_DIR = path.resolve('scripts/prompts')

// ── Types (mirror src/data/types.ts) ───────────────────────
interface Chunk {
  id: string
  source: string
  chapter: string
  section: string
  content: string
  page: number
  charCount: number
}

interface FlashCard {
  id: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  tags: string[]
  chunkId: string
  sm2: { interval: number; repetitions: number; easeFactor: number; nextReview: string }
}

interface Quiz {
  id: string
  type: 'multiple_choice' | 'true_false'
  question: string
  options?: string[]
  answer: number | boolean
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  relatedCards: string[]
  chunkId: string
}

interface ConceptCard {
  title: string
  content: string
  summary: string
  isExamPoint: boolean
}

interface ConceptSet {
  id: string
  title: string
  estimatedMinutes: number
  cards: ConceptCard[]
  category: string
}

// ── Stats tracking ─────────────────────────────────────────
let totalApiCalls = 0
let totalInputTokens = 0
let totalOutputTokens = 0

// ── Client ─────────────────────────────────────────────────
const client = new Anthropic()
const MODEL = 'claude-sonnet-4-20250514'

// ── Retry with exponential backoff ─────────────────────────
async function callClaude(
  system: string,
  userContent: string,
  maxRetries = 3,
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system,
        messages: [{ role: 'user', content: userContent }],
      })

      totalApiCalls++
      totalInputTokens += response.usage.input_tokens
      totalOutputTokens += response.usage.output_tokens

      const block = response.content[0]
      return block.type === 'text' ? block.text : ''
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500
        console.log(`    ⚠️  API 에러 (재시도 ${attempt + 1}/${maxRetries}, ${Math.round(delay)}ms 후): ${msg}`)
        await new Promise((r) => setTimeout(r, delay))
      } else {
        console.error(`    ❌ API 에러 (재시도 소진): ${msg}`)
        throw err
      }
    }
  }
  return ''
}

// ── JSON parsing helper ────────────────────────────────────
function parseJSON<T>(raw: string): T[] {
  // Strip markdown code fences if present
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '')
  }
  // Find the outermost JSON array
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start === -1 || end === -1) {
    console.warn('    ⚠️  JSON 배열을 찾을 수 없음')
    return []
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch (e) {
    console.warn('    ⚠️  JSON 파싱 실패:', (e as Error).message)
    return []
  }
}

// ── Dedup helper ───────────────────────────────────────────
function extractKeywords(text: string): Set<string> {
  // Extract Korean words of 2+ chars
  const matches = text.match(/[가-힣]{2,}/g) || []
  return new Set(matches)
}

function isTooSimilar(
  newText: string,
  existingKeywordSets: Set<string>[],
  threshold = 0.6,
): boolean {
  const newKw = extractKeywords(newText)
  if (newKw.size === 0) return false

  for (const existing of existingKeywordSets) {
    let overlap = 0
    for (const w of newKw) {
      if (existing.has(w)) overlap++
    }
    const similarity = overlap / Math.min(newKw.size, existing.size || 1)
    if (similarity >= threshold) return true
  }
  return false
}

// ── Batch generator ────────────────────────────────────────
async function generateBatch(
  batchChunks: Chunk[],
  batchIndex: number,
  fcPrompt: string,
  qzPrompt: string,
  csPrompt: string,
  existingFcKeywords: Set<string>[],
  existingQzKeywords: Set<string>[],
): Promise<{ flashcards: FlashCard[]; quizzes: Quiz[]; conceptSets: ConceptSet[] }> {
  const combinedText = batchChunks
    .map((c) => `[${c.chapter} / ${c.section} / p.${c.page}]\n${c.content}`)
    .join('\n\n---\n\n')

  const chunkIds = batchChunks.map((c) => c.id)
  const primaryChunk = chunkIds[0]
  const category = batchChunks[0].chapter

  console.log(`\n  🔄 배치 ${batchIndex + 1}: 청크 ${chunkIds.join(', ')}`)

  // ── Flashcards ───────────────────────────────────────────
  process.stdout.write('    📇 플래시카드 생성 중...')
  const fcRaw = await callClaude(
    fcPrompt,
    `다음 텍스트에서 플래시카드를 10-15장 만들어주세요.\n\n${combinedText}`,
  )
  const rawFCs = parseJSON<Partial<FlashCard>>(fcRaw)

  const flashcards: FlashCard[] = []
  for (const raw of rawFCs) {
    if (!raw.front || !raw.back) continue
    if (isTooSimilar(raw.front + ' ' + raw.back, existingFcKeywords)) continue

    const fc: FlashCard = {
      id: '', // assigned later
      front: raw.front,
      back: raw.back,
      difficulty: raw.difficulty || 'medium',
      category: raw.category || category,
      tags: raw.tags || [],
      chunkId: primaryChunk,
      sm2: { interval: 0, repetitions: 0, easeFactor: 2.5, nextReview: new Date().toISOString() },
    }
    flashcards.push(fc)
    existingFcKeywords.push(extractKeywords(fc.front + ' ' + fc.back))
  }
  console.log(` ${flashcards.length}장`)

  // ── Quizzes ──────────────────────────────────────────────
  process.stdout.write('    ✅ 퀴즈 생성 중...')
  const qzRaw = await callClaude(
    qzPrompt,
    `다음 텍스트에서 문제를 12-18개 만들어주세요. 4지선다 70%, O/X 30% 비율로.\n\n${combinedText}`,
  )
  const rawQZs = parseJSON<Partial<Quiz>>(qzRaw)

  const quizzes: Quiz[] = []
  for (const raw of rawQZs) {
    if (!raw.question) continue
    if (isTooSimilar(raw.question, existingQzKeywords)) continue

    const qz: Quiz = {
      id: '',
      type: raw.type || 'multiple_choice',
      question: raw.question,
      options: raw.type === 'true_false' ? undefined : (raw.options || []),
      answer: raw.answer ?? 0,
      explanation: raw.explanation || '',
      difficulty: raw.difficulty || 'medium',
      category: raw.category || category,
      relatedCards: raw.relatedCards || [],
      chunkId: primaryChunk,
    }
    quizzes.push(qz)
    existingQzKeywords.push(extractKeywords(qz.question))
  }
  console.log(` ${quizzes.length}문제`)

  // ── Concept Sets ─────────────────────────────────────────
  process.stdout.write('    📚 개념카드 생성 중...')
  const csRaw = await callClaude(
    csPrompt,
    `다음 텍스트의 핵심 개념을 카드뉴스 세트로 만들어주세요.\n\n${combinedText}`,
  )

  // Could be a single object or an array
  let conceptSets: ConceptSet[] = []
  const cleaned = csRaw.trim()
  const parsed = cleaned.startsWith('{')
    ? [parseJSON<ConceptSet>(`[${cleaned}]`)[0]].filter(Boolean)
    : parseJSON<Partial<ConceptSet>>(csRaw)

  for (const raw of parsed) {
    if (!raw?.cards?.length) continue
    conceptSets.push({
      id: '',
      title: raw.title || category,
      estimatedMinutes: raw.estimatedMinutes || 5,
      cards: (raw.cards as ConceptCard[]).map((c) => ({
        title: c.title || '',
        content: c.content || '',
        summary: c.summary || '',
        isExamPoint: c.isExamPoint ?? false,
      })),
      category: raw.category || category,
    })
  }
  console.log(` ${conceptSets.length}세트 (${conceptSets.reduce((s, cs) => s + cs.cards.length, 0)}장)`)

  return { flashcards, quizzes, conceptSets }
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY 환경변수를 설정하세요.')
    process.exit(1)
  }

  // Load chunks
  const chunksPath = path.join(PARSED_DIR, 'chunks.json')
  if (!fs.existsSync(chunksPath)) {
    console.error('❌ data/parsed/chunks.json이 없습니다. 먼저 pnpm parse를 실행하세요.')
    process.exit(1)
  }
  const chunks: Chunk[] = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'))
  console.log(`\n📖 청크 ${chunks.length}개 로드됨`)

  // Load prompts
  const fcPrompt = fs.readFileSync(path.join(PROMPTS_DIR, 'flashcard.md'), 'utf-8')
  const qzPrompt = fs.readFileSync(path.join(PROMPTS_DIR, 'quiz.md'), 'utf-8')
  const csPrompt = fs.readFileSync(path.join(PROMPTS_DIR, 'concept-card.md'), 'utf-8')

  fs.mkdirSync(GENERATED_DIR, { recursive: true })

  // Split chunks into batches of up to 5
  const BATCH_SIZE = 5
  const batches: Chunk[][] = []
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    batches.push(chunks.slice(i, i + BATCH_SIZE))
  }
  console.log(`📦 ${batches.length}개 배치로 분할 (배치당 최대 ${BATCH_SIZE}개 청크)`)

  // Accumulators
  const allFlashcards: FlashCard[] = []
  const allQuizzes: Quiz[] = []
  const allConceptSets: ConceptSet[] = []

  // Dedup keyword sets
  const fcKeywords: Set<string>[] = []
  const qzKeywords: Set<string>[] = []

  const startTime = Date.now()

  for (let i = 0; i < batches.length; i++) {
    const progress = Math.round(((i + 1) / batches.length) * 100)
    console.log(`\n${'═'.repeat(50)}`)
    console.log(`  진행률: ${progress}% (${i + 1}/${batches.length} 배치)`)
    console.log(`${'═'.repeat(50)}`)

    const result = await generateBatch(
      batches[i],
      i,
      fcPrompt,
      qzPrompt,
      csPrompt,
      fcKeywords,
      qzKeywords,
    )

    allFlashcards.push(...result.flashcards)
    allQuizzes.push(...result.quizzes)
    allConceptSets.push(...result.conceptSets)

    // Save intermediate results after each batch (crash recovery)
    saveResults(allFlashcards, allQuizzes, allConceptSets)
  }

  // Final save with sequential IDs
  assignIds(allFlashcards, allQuizzes, allConceptSets)
  // Link quiz relatedCards to flashcard IDs by matching category
  linkRelatedCards(allFlashcards, allQuizzes)
  saveResults(allFlashcards, allQuizzes, allConceptSets)

  // Stats
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  printStats(allFlashcards, allQuizzes, allConceptSets, elapsed)
}

// ── Assign sequential IDs ──────────────────────────────────
function assignIds(fcs: FlashCard[], qzs: Quiz[], css: ConceptSet[]) {
  fcs.forEach((fc, i) => {
    fc.id = `fc-${String(i + 1).padStart(3, '0')}`
  })
  qzs.forEach((qz, i) => {
    qz.id = `qz-${String(i + 1).padStart(3, '0')}`
  })
  css.forEach((cs, i) => {
    cs.id = `cs-${String(i + 1).padStart(3, '0')}`
  })
}

// ── Link related cards ─────────────────────────────────────
function linkRelatedCards(fcs: FlashCard[], qzs: Quiz[]) {
  for (const qz of qzs) {
    if (qz.relatedCards.length > 0) continue
    // Find flashcards from same category with keyword overlap
    const qzKw = extractKeywords(qz.question)
    const related: { id: string; score: number }[] = []
    for (const fc of fcs) {
      if (fc.category !== qz.category) continue
      const fcKw = extractKeywords(fc.front + ' ' + fc.back)
      let overlap = 0
      for (const w of qzKw) {
        if (fcKw.has(w)) overlap++
      }
      if (overlap >= 2) related.push({ id: fc.id, score: overlap })
    }
    related.sort((a, b) => b.score - a.score)
    qz.relatedCards = related.slice(0, 3).map((r) => r.id)
  }
}

// ── Save results ───────────────────────────────────────────
function saveResults(fcs: FlashCard[], qzs: Quiz[], css: ConceptSet[]) {
  fs.writeFileSync(
    path.join(GENERATED_DIR, 'flashcards.json'),
    JSON.stringify(fcs, null, 2),
    'utf-8',
  )
  fs.writeFileSync(
    path.join(GENERATED_DIR, 'quizzes.json'),
    JSON.stringify(qzs, null, 2),
    'utf-8',
  )
  fs.writeFileSync(
    path.join(GENERATED_DIR, 'concept-sets.json'),
    JSON.stringify(css, null, 2),
    'utf-8',
  )
}

// ── Print stats ────────────────────────────────────────────
function printStats(
  fcs: FlashCard[],
  qzs: Quiz[],
  css: ConceptSet[],
  elapsed: string,
) {
  const diffCount = (items: { difficulty: string }[], d: string) =>
    items.filter((i) => i.difficulty === d).length

  const mcCount = qzs.filter((q) => q.type === 'multiple_choice').length
  const tfCount = qzs.filter((q) => q.type === 'true_false').length
  const totalCards = css.reduce((s, cs) => s + cs.cards.length, 0)

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`📊 생성 완료 통계`)
  console.log(`${'═'.repeat(50)}`)

  console.log(`\n📇 플래시카드: ${fcs.length}장`)
  console.log(`   easy: ${diffCount(fcs, 'easy')} | medium: ${diffCount(fcs, 'medium')} | hard: ${diffCount(fcs, 'hard')}`)

  console.log(`\n✅ 퀴즈: ${qzs.length}문제`)
  console.log(`   4지선다: ${mcCount} | O/X: ${tfCount}`)
  console.log(`   easy: ${diffCount(qzs, 'easy')} | medium: ${diffCount(qzs, 'medium')} | hard: ${diffCount(qzs, 'hard')}`)

  console.log(`\n📚 개념카드: ${css.length}세트, 총 ${totalCards}장`)

  console.log(`\n🔌 API 사용량`)
  console.log(`   호출 횟수: ${totalApiCalls}`)
  console.log(`   입력 토큰: ${totalInputTokens.toLocaleString()}`)
  console.log(`   출력 토큰: ${totalOutputTokens.toLocaleString()}`)
  console.log(`   총 토큰:   ${(totalInputTokens + totalOutputTokens).toLocaleString()}`)

  console.log(`\n⏱️  소요 시간: ${elapsed}초`)

  console.log(`\n💾 저장 위치:`)
  console.log(`   ${path.join(GENERATED_DIR, 'flashcards.json')}`)
  console.log(`   ${path.join(GENERATED_DIR, 'quizzes.json')}`)
  console.log(`   ${path.join(GENERATED_DIR, 'concept-sets.json')}`)
  console.log(`${'═'.repeat(50)}\n`)
}

main().catch((err) => {
  console.error('❌ 치명적 오류:', err)
  process.exit(1)
})
