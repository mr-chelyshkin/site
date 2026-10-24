// feTurbulence fractalNoise from the SVG spec's reference code, so the texture matches the filter.

const SIZE = 0x100
const MASK = 0xff
const OFFSET = 0x1000
const M = 2147483647
const A = 16807
const Q = 127773
const R = 2836

const next = (seed) => {
  const value = A * (seed % Q) - R * Math.floor(seed / Q)
  return value <= 0 ? value + M : value
}

function tables(seed) {
  let state = seed <= 0 ? -(seed % (M - 1)) + 1 : Math.min(seed, M - 1)
  const lattice = new Int32Array(SIZE * 2 + 2)
  const gradients = Array.from({ length: 4 }, () =>
    Array.from({ length: SIZE * 2 + 2 }, () => [0, 0]),
  )
  let i = 0
  for (const gradient of gradients) {
    for (i = 0; i < SIZE; i++) {
      lattice[i] = i
      for (let j = 0; j < 2; j++) {
        state = next(state)
        gradient[i][j] = ((state % (SIZE * 2)) - SIZE) / SIZE
      }
      const length = Math.hypot(gradient[i][0], gradient[i][1])
      gradient[i][0] /= length
      gradient[i][1] /= length
    }
  }
  while (--i) {
    const k = lattice[i]
    state = next(state)
    const j = state % SIZE
    lattice[i] = lattice[j]
    lattice[j] = k
  }
  for (i = 0; i < SIZE + 2; i++) {
    lattice[SIZE + i] = lattice[i]
    for (const gradient of gradients) gradient[SIZE + i] = [...gradient[i]]
  }
  return { lattice, gradients }
}

const smooth = (t) => t * t * (3 - 2 * t)
const lerp = (t, a, b) => a + t * (b - a)

/** Returns a sampler for one channel (0-3) of fractalNoise, mapped to 0..1 like the filter's output. */
export function fractalNoise(seed, channel) {
  const { lattice, gradients } = tables(seed)
  const gradient = gradients[channel]
  const noise = (x, y) => {
    const tx = x + OFFSET
    const ty = y + OFFSET
    const bx0 = Math.trunc(tx) & MASK
    const by0 = Math.trunc(ty) & MASK
    const bx1 = (bx0 + 1) & MASK
    const by1 = (by0 + 1) & MASK
    const rx0 = tx - Math.trunc(tx)
    const ry0 = ty - Math.trunc(ty)
    const rx1 = rx0 - 1
    const ry1 = ry0 - 1
    const i = lattice[bx0]
    const j = lattice[bx1]
    const dot = (b, rx, ry) => rx * gradient[b][0] + ry * gradient[b][1]
    const sx = smooth(rx0)
    const a = lerp(sx, dot(lattice[i + by0], rx0, ry0), dot(lattice[j + by0], rx1, ry0))
    const b = lerp(sx, dot(lattice[i + by1], rx0, ry1), dot(lattice[j + by1], rx1, ry1))
    return lerp(smooth(ry0), a, b)
  }
  return (x, y, frequency, octaves) => {
    let sum = 0
    for (let octave = 0, scale = 1; octave < octaves; octave++, scale *= 2) {
      sum += noise(x * frequency * scale, y * frequency * scale) / scale
    }
    return Math.min(1, Math.max(0, (sum + 1) / 2))
  }
}
