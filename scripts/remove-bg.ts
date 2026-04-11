import sharp from 'sharp'
import path from 'path'

const SRC_DIR = path.resolve('C:/Users/scj94/Downloads/지지')
const DEST_DIR = path.resolve('public/mascot')

const files = [
  'fire.png',
  'level_1.png',
  'level_2.png',
  'level_3.png',
  'level_4.png',
  'level_5.png',
  'health.png',
  'sleeping.png',
  'walk_1.png',
  'walk_2.png',
  'walk_3.png',
]

async function removeWhiteBg(srcPath: string, destPath: string) {
  const image = sharp(srcPath)
  const { width, height } = await image.metadata()
  if (!width || !height) throw new Error(`Cannot read metadata: ${srcPath}`)

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const channels = info.channels // 4 (RGBA)

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (r > 240 && g > 240 && b > 240) {
      // Pure white or near-white → fully transparent
      data[i + 3] = 0
    } else if (r > 220 && g > 220 && b > 220) {
      // Anti-aliased edge pixels → partial transparency
      const alpha = Math.min(255, (255 - r) * 3)
      data[i + 3] = alpha
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(destPath)

  console.log(`✓ ${path.basename(destPath)}`)
}

async function main() {
  console.log('Removing white backgrounds...\n')

  for (const file of files) {
    const src = path.join(SRC_DIR, file)
    const dest = path.join(DEST_DIR, file)
    await removeWhiteBg(src, dest)
  }

  console.log('\nDone! All images saved to public/mascot/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
