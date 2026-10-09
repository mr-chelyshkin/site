import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const srcDir = fileURLToPath(new URL('../src/', import.meta.url))
const sourceDir = path.join(srcDir, 'assets/images-source')
const source = path.join(sourceDir, 'hero.png')
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
// the crop. `clahe`, when set, evens out local contrast first, so a face keeps its
// features through the dither. `contrast` and `brightness` go to sharp's
// `linear(a, b)`, gray × a + b, before dithering. `ghost` also writes
// `<name>-cyan.png`.
const renders = [
  {
    name: 'hero-poster',
    width: 560,
    crop: [0.268, 0.06, 0.48, 0.7],
    clahe: { width: 40, height: 40, maxSlope: 3 },
    contrast: 1.15,
    brightness: -30,
    ghost: true,
    // The person, dithered three times as fine and sharpened, over the street's
    // coarser grain: at the poster's size on a 2x screen, about one dot per pixel.
    // The fine grain covers the skin, and the dark hair and shirt up to their
    // edges, so it stops at the person's outline while the lighter street around
    // stays coarse. Ellipses are [cx, cy, rx, ry] as fractions of the render:
    // `skin` (face, then neck and collar) always takes the fine grain; `dark`
    // (head, then shoulders) only where the photo is darker than `darkBelow`.
    subject: {
      skin: [
        [0.494, 0.4, 0.074, 0.13],
        [0.494, 0.565, 0.075, 0.065],
      ],
      dark: [
        [0.494, 0.36, 0.1, 0.17],
        [0.5, 0.8, 0.32, 0.3],
      ],
      darkBelow: 70,
      scale: 3,
      sharpen: { sigma: 0.9, m2: 3 },
      clahe: { width: 64, height: 64, maxSlope: 3 },
      // Midtones stay where they are (1.25 × 128 − 32 = 128): sharper, not lighter.
      contrast: 1.25,
      brightness: -32,
    },
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

// Photographs the stack drawing uses whole and in color, as they were taken:
// cropped and `width` drawing units wide at `scale` pixels a unit, `brightness`
// times as bright. The drawing gives each the crop's proportions: the rack's
// three servers, 946 × 292 pixels of the photo, front a chassis 340 wide and
// 105 tall (StackMetal.vue, ExplodedStack.vue); a MacBook's deck, shot from
// straight above and cropped below the hinge, is the laptop's 212 × 146 deck,
// and the data centre aisle the wallpaper on its 200 × 128 screen, dimmed
// under the terminal (StackLaptop.vue). The aisle's source is cropped clear of
// the people in it. The deck is Polina Tankilevitch's, from Pexels (pexels.com/
// photo/4523026), free to use under the Pexels license.
const faces = [
  {
    name: 'stack-rack',
    source: 'rack-front.jpg',
    crop: [0.165625, 0.45, 0.7390625, 0.3041667],
    width: 340,
    scale: 2,
  },
  {
    name: 'stack-deck',
    source: 'macbook-deck.jpg',
    crop: [0, 0, 1, 1],
    width: 212,
    scale: 2.5,
  },
  {
    name: 'stack-wallpaper',
    source: 'datacenter-aisle.jpg',
    crop: [0, 0, 1, 1],
    width: 200,
    scale: 2.5,
    brightness: 0.8,
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

function checkCrop(name, [x, y, w, h]) {
  // The tolerance only absorbs floating point in a crop that ends at the edge.
  if (Math.min(x, y, w, h) < 0 || x + w > 1 + 1e-9 || y + h > 1 + 1e-9) {
    throw new Error(`Crop of ${name} runs outside the photo`)
  }
}

// A crop in pixels. Clamped: a crop flush with an edge overshoots it when its
// offset and size both round up.
function region({ width, height }, [x, y, w, h]) {
  const left = Math.round(x * width)
  const top = Math.round(y * height)
  return {
    left,
    top,
    width: Math.min(Math.round(w * width), width - left),
    height: Math.min(Math.round(h * height), height - top),
  }
}

async function grayscale({ width, crop, sharpen, clahe, contrast, brightness }) {
  const meta = await sharp(source).metadata()
  let image = sharp(source).extract(region(meta, crop)).resize(width).grayscale()
  if (sharpen) image = image.sharpen(sharpen)
  if (clahe) image = image.clahe(clahe)
  const { data, info } = await image
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

// A 4×4 Bayer matrix as thresholds in (0, 1), so the fine person fades into the
// coarse street dot by dot rather than along a seam.
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

// One channel in, one channel out: sharp's blur otherwise hands back three.
const blurred = (data, width, height, sigma) =>
  sharp(data, { raw: { width, height, channels: 1 } })
    .blur(sigma)
    .extractChannel(0)
    .raw()
    .toBuffer()

// How much of the fine render to show at each pixel, 0 to 1: the skin, and the dark
// parts inside the subject's outline. Blurring the mask and cutting it again drops
// stray specks, and a last blur gives an edge a pixel or two soft.
async function silhouette({ data, width, height }, { skin, dark, darkBelow }) {
  const within = (ellipses, u, v) =>
    ellipses.some(([cx, cy, rx, ry]) => Math.hypot((u - cx) / rx, (v - cy) / ry) < 1)
  const mask = Buffer.alloc(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const u = x / width
      const v = y / height
      const person = within(skin, u, v) || (within(dark, u, v) && data[i] < darkBelow)
      mask[i] = person ? 255 : 0
    }
  }
  const spread = await blurred(mask, width, height, 2)
  const shape = Buffer.from(Uint8Array.from(spread, (v) => (v > 128 ? 255 : 0)))
  const edge = await blurred(shape, width, height, 1.5)
  return Float32Array.from(edge, (v) => v / 255)
}

// The fine render where the subject's silhouette covers it, the coarse one scaled
// up to the fine render's size everywhere else.
function blend(coarse, fine, weights) {
  const lit = new Uint8Array(fine.width * fine.height)
  const scale = fine.width / coarse.width
  for (let y = 0; y < fine.height; y++) {
    for (let x = 0; x < fine.width; x++) {
      const i = y * fine.width + x
      const weight = weights[i]
      const cxy =
        Math.min(coarse.height - 1, Math.floor(y / scale)) * coarse.width +
        Math.min(coarse.width - 1, Math.floor(x / scale))
      lit[i] = weight > bayer[(y & 3) * 4 + (x & 3)] ? fine.lit[i] : coarse.lit[cxy]
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

async function render({ name, ghost, subject, ...options }) {
  checkCrop(name, options.crop)
  try {
    let image = await grayscale(options)
    let lit = dither(image)
    if (subject) {
      const fine = await grayscale({ ...options, ...subject, width: image.width * subject.scale })
      const weights = await silhouette(fine, subject)
      lit = blend({ ...image, lit }, { ...fine, lit: dither(fine) }, weights)
      image = fine
    }
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

async function face({ name, source: file, crop, width, scale, brightness = 1 }) {
  checkCrop(name, crop)
  const input = path.join(sourceDir, file)
  if (!fs.existsSync(input)) throw new Error(`Source photo not found: ${input}`)
  try {
    const info = await sharp(input)
      .extract(region(await sharp(input).metadata(), crop))
      .resize(Math.round(width * scale))
      .modulate({ brightness })
      .webp({ quality: 82 })
      .toFile(path.join(outputDir, `${name}.webp`))
    console.log(` ${name}.webp (${info.width}×${info.height}), from ${file}`)
  } catch (error) {
    throw new Error(`Could not cut ${name}: ${error.message}`, { cause: error })
  }
}

async function main() {
  checkQrCodes()
  if (!fs.existsSync(source)) throw new Error(`Source photo not found: ${source}`)
  fs.mkdirSync(outputDir, { recursive: true })
  console.log('\nrendering: hero.png')
  for (const options of renders) await render(options)
  console.log('\ncutting: stack faces')
  for (const options of faces) await face(options)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
