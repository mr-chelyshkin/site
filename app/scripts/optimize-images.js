import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const srcDir = fileURLToPath(new URL('../src/', import.meta.url))
const inputDir = path.join(srcDir, 'assets/images-source')
const outputDir = path.join(srcDir, 'assets/images')

// `BaseImage` builds its `srcset` from the same list.
const widths = JSON.parse(fs.readFileSync(path.join(srcDir, 'assets/image-widths.json'), 'utf8'))
const quality = 90

async function optimizeImages() {
  if (!fs.existsSync(inputDir)) {
    throw new Error(`Source images directory not found: ${inputDir}`)
  }

  const imageFiles = fs.readdirSync(inputDir).filter((file) => /\.(jpe?g|png|webp)$/i.test(file))

  if (imageFiles.length === 0) {
    throw new Error(`No source images found in ${inputDir}`)
  }

  fs.mkdirSync(outputDir, { recursive: true })

  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file)
    const name = path.parse(file).name

    console.log(`\noptimizing: ${file}`)
    for (const width of widths) {
      const outputName = `${name}-${width}.webp`
      const outputPath = path.join(outputDir, outputName)

      try {
        await sharp(inputPath)
          .resize(width, null, { withoutEnlargement: true, fit: 'inside' })
          .webp({ quality })
          .toFile(outputPath)
      } catch (error) {
        throw new Error(`Error while optimizing ${outputName}: ${error.message}`, { cause: error })
      }

      const sizeKB = Math.round(fs.statSync(outputPath).size / 1024)
      console.log(` ${outputName} (${sizeKB}KB)`)
    }
  }
}

optimizeImages().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
