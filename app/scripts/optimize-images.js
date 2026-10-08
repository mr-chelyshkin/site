import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const srcDir = fileURLToPath(new URL('../src/', import.meta.url))
const source = path.join(srcDir, 'assets/images-source/hero.png')
const outputDir = path.join(srcDir, 'assets/images')
const content = path.join(srcDir, 'contents/site.json')
const qrDir = path.join(srcDir, 'assets/qr')
const qrTargets = path.join(qrDir, 'targets.json')

// `ink` and `light` are the render's own two tones; `cyan` matches `$color-cyan`.
const ink = [9, 10, 11]
const light = [217, 228, 232]
const cyan = [95, 176, 191]

// Crops are [left, top, width, height] as fractions of the source photo, so they
// survive a re-export at another size. When the photograph changes, move them to
// frame the new portrait and face. `width` is the output width; the height follows
// the crop. `contrast` and `brightness` go to sharp's `linear(a, b)`, gray × a + b,
// before dithering. `ghost` also writes `<name>-cyan.png`.
const renders = [
  {
    name: 'hero-poster',
    width: 470,
    crop: [0.1875, 0.0444, 0.625, 0.9111],
    contrast: 1.3,
    brightness: -56,
    ghost: true,
  },
  {
    name: 'hero-face',
    width: 42,
    crop: [0.4375, 0.2, 0.1388, 0.3289],
    contrast: 1.5,
    brightness: -40,
    ghost: false,
  },
]

// Neighbors, as [dx, dy], that each take 1/8 of a pixel's error. Only 6/8 is passed
// on, deliberately: dropping the rest is what gives Atkinson its contrast.
const atkinson = [
  [1, 0],
  [2, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
  [0, 2],
]

// The QR codes are generated on macOS and committed, so the build can only check
// that each one exists and still opens its project's first link. Without
// targets.json no code counts as generated, so the error says what to run.
function checkQrCodes() {
  const { projects } = JSON.parse(fs.readFileSync(content, 'utf8')).home.openSource
  const targets = fs.existsSync(qrTargets) ? JSON.parse(fs.readFileSync(qrTargets, 'utf8')) : {}
  for (const { name, qr, links } of projects) {
    if (!qr) continue
    const href = links?.[0]?.href
    if (!targets[qr] || !fs.existsSync(path.join(qrDir, `${qr}.png`))) {
      throw new Error(`QR code ${qr}.png is missing: run npm run qr-codes on macOS`)
    }
    if (targets[qr] !== href) {
      throw new Error(
        `QR code ${qr}.png opens ${targets[qr]}, but ${name}'s first link is ${href}: run npm run qr-codes on macOS`,
      )
    }
  }
}

async function grayscale({ width, crop, contrast, brightness }) {
  const meta = await sharp(source).metadata()
  const [x, y, w, h] = crop
  const left = Math.round(x * meta.width)
  const top = Math.round(y * meta.height)
  // Clamped: a crop flush with an edge overshoots it when its offset and size both round up.
  const region = {
    left,
    top,
    width: Math.min(Math.round(w * meta.width), meta.width - left),
    height: Math.min(Math.round(h * meta.height), meta.height - top),
  }
  const { data, info } = await sharp(source)
    .extract(region)
    .resize(width)
    .grayscale()
    .linear(contrast, brightness)
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

// Atkinson error diffusion to one bit per pixel: the photo as a cheap printer or
// an old screen would show it.
function dither({ data, width, height }) {
  const levels = Float32Array.from(data)
  const lit = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const value = levels[i] < 128 ? 0 : 255
      const error = (levels[i] - value) / 8
      lit[i] = value ? 1 : 0
      for (const [dx, dy] of atkinson) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny < height) levels[ny * width + nx] += error
      }
    }
  }
  return lit
}

// RGB with both colors, or RGBA with only the lit bits when `off` is omitted.
function paint(lit, on, off) {
  const channels = off ? 3 : 4
  const litPixel = off ? on : [...on, 255]
  const data = Buffer.alloc(lit.length * channels)
  lit.forEach((bit, i) => {
    if (bit) data.set(litPixel, i * channels)
    else if (off) data.set(off, i * channels)
  })
  return { data, channels }
}

async function render({ name, ghost, ...options }) {
  const [x, y, w, h] = options.crop
  // The tolerance only absorbs floating point in a crop that ends at the edge.
  if (Math.min(x, y, w, h) < 0 || x + w > 1 + 1e-9 || y + h > 1 + 1e-9) {
    throw new Error(`Crop of ${name} runs outside the photo`)
  }
  try {
    const image = await grayscale(options)
    const lit = dither(image)
    // Two colors fit a 1-bit palette PNG.
    const save = ({ data, channels }, file) =>
      sharp(data, { raw: { width: image.width, height: image.height, channels } })
        .png({ palette: true, colors: 2 })
        .toFile(path.join(outputDir, file))

    await save(paint(lit, light, ink), `${name}.png`)
    if (ghost) await save(paint(lit, cyan), `${name}-cyan.png`)
    console.log(
      ` ${name}.png (${image.width}×${image.height})${ghost ? ` + ${name}-cyan.png` : ''}`,
    )
  } catch (error) {
    throw new Error(`Could not render ${name}: ${error.message}`, { cause: error })
  }
}

async function main() {
  checkQrCodes()
  if (!fs.existsSync(source)) throw new Error(`Source photo not found: ${source}`)
  fs.mkdirSync(outputDir, { recursive: true })
  console.log('\nrendering: hero.png')
  for (const options of renders) await render(options)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
