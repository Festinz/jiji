import sharp from 'sharp'
import path from 'path'

const INPUT = path.join(
  process.env.USERPROFILE ?? '',
  'Downloads',
  '지지',
  '지지 앱 캐릭터.png',
)
const OUT_DIR = path.resolve('public/mascot')

// Grid layout detected from image analysis (2198x1952px):
// 3 columns separated by white bands, 2 rows of characters
// Columns: 147-749, 802-1404, 1461-2064
// Rows:    70-650, 696-1272
const cols = [
  { left: 147, width: 749 - 147 },   // col 0
  { left: 802, width: 1404 - 802 },   // col 1
  { left: 1461, width: 2064 - 1461 }, // col 2
]
const rows = [
  { top: 70, height: 650 - 70 },   // row 0
  { top: 696, height: 1272 - 696 }, // row 1
]

// 2x3 grid, row-major: GREETING, HAPPY, SAD / STUDYING, SLEEPING, FIRE
const sprites: { name: string; row: number; col: number }[] = [
  { name: 'greeting', row: 0, col: 0 },
  { name: 'happy', row: 0, col: 1 },
  { name: 'sad', row: 0, col: 2 },
  { name: 'studying', row: 1, col: 0 },
  { name: 'sleeping', row: 1, col: 1 },
  { name: 'fire', row: 1, col: 2 },
]

async function main() {
  console.log(`입력: ${INPUT}`)
  console.log(`출력: ${OUT_DIR}\n`)

  for (const sprite of sprites) {
    const { left, width } = cols[sprite.col]
    const { top, height } = rows[sprite.row]

    const outPath = path.join(OUT_DIR, `${sprite.name}.png`)

    await sharp(INPUT)
      .extract({ left, top, width, height })
      .png()
      .toFile(outPath)

    console.log(`  ${sprite.name}.png  (${width}x${height} from ${left},${top})`)
  }

  console.log('\n6개 스프라이트 크롭 완료!')
}

main().catch((err) => {
  console.error('오류:', err.message)
  process.exit(1)
})
