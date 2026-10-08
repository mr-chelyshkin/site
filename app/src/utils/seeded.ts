/**
 * Pseudo-random numbers in [0, 1) from a string seed (FNV-1a into mulberry32),
 * so torn edges, tilts and barcodes look hand-made yet stay the same on every
 * load.
 *
 * Namespace the seed per use (e.g. `${name}:tilt`) so two uses of one name
 * don't share a sequence.
 */
export function seeded(seed: string): () => number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619)
  let state = hash >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
