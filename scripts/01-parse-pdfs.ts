import fs from 'fs'
import path from 'path'
// @ts-expect-error pdf-parse v2 types don't match well
import { PDFParse } from 'pdf-parse'

const RAW_DIR = path.resolve('data/raw')
const PARSED_DIR = path.resolve('data/parsed')

const MIN_CHUNK = 500
const MAX_CHUNK = 800

// ── Types ──────────────────────────────────────────────────
interface PageData {
  text: string
  num: number
}

interface Chunk {
  id: string
  source: string
  chapter: string
  section: string
  content: string
  page: number
  charCount: number
}

// ── Clean page text ────────────────────────────────────────
function cleanPageText(text: string): string {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((line) => {
      if (!line) return false
      // Page number only
      if (/^\d{1,3}$/.test(line)) return false
      // Learning objective markers ":: 001."
      if (/^::\s*\d{3}\./.test(line)) return false
      // Lone "OT", "CONTENTS", "THANK YOU" etc.
      if (/^(OT|CONTENTS|THANK\s*YOU|contents)$/i.test(line)) return false
      // Very short garbage (1-2 chars of punctuation/symbols)
      if (line.length <= 2 && /^[^가-힣a-zA-Z0-9]+$/.test(line)) return false
      return true
    })
    .join(' ')
    .replace(/\t+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()
}

// ── Detect chapter-level headings from filename ────────────
function inferChapterFromFilename(filename: string): string {
  // "1. 운동치료중재의 개요.pdf" → "1장 운동치료중재의 개요"
  const m = filename.match(/^(\d+)\.\s*(.+)\.pdf$/i)
  if (m) return `${m[1]}장 ${m[2]}`
  return filename.replace(/\.pdf$/i, '')
}

// ── Detect slide/section titles ────────────────────────────
// A section title is a standalone short Korean phrase that appears as a slide heading.
// We only use strong signals to avoid over-splitting.
const STRONG_SECTION_RE =
  /^(?:제?\s*\d+\s*[장절]|Chapter\s+\d+|\d+\.\d+\s+[가-힣])/i

function isSectionTitle(text: string): boolean {
  if (STRONG_SECTION_RE.test(text)) return true
  return false
}

// ── Sentence-aware chunking ────────────────────────────────
function splitSentences(text: string): string[] {
  // Split on Korean sentence endings or period+space
  const parts = text.split(
    /(?<=[다함음됨임있없됩니까요죠라며]\.)\s+|(?<=[.!?])\s+(?=[가-힣A-Z(①②③④⑤\-•])/,
  )
  return parts.map((s) => s.trim()).filter(Boolean)
}

function buildChunks(
  paragraphs: { text: string; page: number }[],
  source: string,
  chapter: string,
): Chunk[] {
  // First, merge all paragraphs into one text stream with page tracking
  const sentences: { text: string; page: number }[] = []
  for (const para of paragraphs) {
    for (const s of splitSentences(para.text)) {
      sentences.push({ text: s, page: para.page })
    }
  }

  const chunks: Chunk[] = []
  let current = ''
  let currentPage = sentences[0]?.page ?? 1
  let currentSection = chapter
  let chunkIdx = 0

  function flush() {
    const content = current.trim()
    if (!content || content.length < 10) {
      current = ''
      return
    }
    chunkIdx++
    chunks.push({
      id: '', // will be assigned later
      source,
      chapter,
      section: currentSection,
      content,
      page: currentPage,
      charCount: content.length,
    })
    current = ''
  }

  for (const sent of sentences) {
    // Check if this sentence is a section title
    if (isSectionTitle(sent.text) && current.length >= MIN_CHUNK) {
      flush()
      currentSection = sent.text
      currentPage = sent.page
      continue
    }

    const candidate = current ? current + ' ' + sent.text : sent.text

    if (candidate.length > MAX_CHUNK) {
      if (current.length >= MIN_CHUNK) {
        flush()
        current = sent.text
        currentPage = sent.page
      } else {
        // Current is too short but adding sentence overshoots — accept the overshoot
        current = candidate
        // If way too long, flush anyway
        if (current.length > MAX_CHUNK + 200) {
          flush()
        }
      }
    } else {
      if (!current) currentPage = sent.page
      current = candidate
    }
  }

  // Flush remainder
  if (current.trim()) {
    if (current.trim().length < MIN_CHUNK / 3 && chunks.length > 0) {
      // Merge tiny remainder into last chunk
      chunks[chunks.length - 1].content += ' ' + current.trim()
      chunks[chunks.length - 1].charCount =
        chunks[chunks.length - 1].content.length
    } else {
      flush()
    }
  }

  return chunks
}

// ── Parse one PDF ──────────────────────────────────────────
async function parsePDF(filePath: string): Promise<Chunk[]> {
  const filename = path.basename(filePath)
  const buf = fs.readFileSync(filePath)
  const uint8 = new Uint8Array(buf)
  const parser = new PDFParse(uint8)
  await parser.load()

  const result = await parser.getText()
  const pages: PageData[] = result.pages

  const chapter = inferChapterFromFilename(filename)
  console.log(`  📄 ${filename}: ${pages.length}페이지 → 챕터: "${chapter}"`)

  // Collect cleaned text per page
  const paragraphs: { text: string; page: number }[] = []
  for (const pg of pages) {
    const cleaned = cleanPageText(pg.text)
    if (cleaned && cleaned.length > 5) {
      paragraphs.push({ text: cleaned, page: pg.num })
    }
  }

  return buildChunks(paragraphs, filename, chapter)
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.log('❌ data/raw/ 폴더가 없습니다.')
    process.exit(1)
  }

  const pdfFiles = fs
    .readdirSync(RAW_DIR)
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .sort()

  if (pdfFiles.length === 0) {
    console.log('❌ data/raw/ 에 PDF 파일이 없습니다.')
    process.exit(1)
  }

  console.log(`\n🔍 PDF ${pdfFiles.length}개 파싱 시작...\n`)

  fs.mkdirSync(PARSED_DIR, { recursive: true })

  const allChunks: Chunk[] = []
  const stats: { file: string; chunks: number }[] = []

  for (const file of pdfFiles) {
    const filePath = path.join(RAW_DIR, file)
    const chunks = await parsePDF(filePath)
    allChunks.push(...chunks)
    stats.push({ file, chunks: chunks.length })
  }

  // Assign sequential IDs globally
  let globalChapterNum = 0
  let prevChapter = ''
  let chunkInChapter = 0
  for (const chunk of allChunks) {
    if (chunk.chapter !== prevChapter) {
      globalChapterNum++
      chunkInChapter = 0
      prevChapter = chunk.chapter
    }
    chunkInChapter++
    chunk.id = `ch${String(globalChapterNum).padStart(2, '0')}-c${String(chunkInChapter).padStart(3, '0')}`
  }

  // Save
  const outPath = path.join(PARSED_DIR, 'chunks.json')
  fs.writeFileSync(outPath, JSON.stringify(allChunks, null, 2), 'utf-8')

  // Stats
  const totalChars = allChunks.reduce((sum, c) => sum + c.charCount, 0)
  const avgChars =
    allChunks.length > 0 ? Math.round(totalChars / allChunks.length) : 0
  const minLen = allChunks.length
    ? Math.min(...allChunks.map((c) => c.charCount))
    : 0
  const maxLen = allChunks.length
    ? Math.max(...allChunks.map((c) => c.charCount))
    : 0

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`📊 파싱 결과 통계`)
  console.log(`${'─'.repeat(50)}`)
  console.log(`총 청크 수:   ${allChunks.length}`)
  console.log(`평균 글자 수: ${avgChars}자`)
  console.log(`최소/최대:    ${minLen}자 / ${maxLen}자`)
  console.log('')
  for (const s of stats) {
    console.log(`  📁 ${s.file}: ${s.chunks}개 청크`)
  }
  console.log(`${'─'.repeat(50)}`)
  console.log(`💾 저장: ${outPath}\n`)
}

main().catch((err) => {
  console.error('❌ 오류:', err)
  process.exit(1)
})
