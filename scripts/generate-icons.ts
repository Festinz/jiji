import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const SRC = path.resolve('public/mascot/greeting.png')
const OUT = path.resolve('public/icons')

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

  const sizes = [192, 512]
  for (const size of sizes) {
    const outPath = path.join(OUT, `icon-${size}.png`)
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 250, g: 245, b: 239, alpha: 1 } })
      .png()
      .toFile(outPath)
    console.log(`✅ ${outPath} (${size}x${size})`)
  }

  console.log('\n🎉 PWA 아이콘 생성 완료!')
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
