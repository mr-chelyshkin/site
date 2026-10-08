import { seeded } from '@/utils/seeded'

export type Edge = 'top' | 'right' | 'bottom' | 'left'

// Steps along the top and bottom and down the sides, how much deeper the bottom tears, and
// the px each percent of depth may reach at most.
const STEPS_ACROSS = 48
const STEPS_DOWN = 32
const BOTTOM_SCALE = 1.3
const PX_PER_PERCENT = 7

/**
 * A `clip-path` polygon for paper with its listed edges torn: each torn edge is
 * a run of points up to `depth` percent deep, the same for the same seed. The
 * depth is capped in px, so a sheet over 700px tears no deeper than a 700px one.
 *
 * Every run starts and ends on the box's corners, so two torn edges meet there
 * without crossing while `depth` stays under about one step (100 / 48, about
 * 2%); the default 1.4 is safe.
 */
export function tornClipPath(seed: string, edges: readonly Edge[], depth = 1.4): string {
  const rand = seeded(seed)
  const run = (steps: number, deep: number) =>
    Array.from(
      { length: steps + 1 },
      (_, i) => [i / steps, i === 0 || i === steps ? 0 : rand() * deep] as const,
    )
  const straight = [
    [0, 0],
    [1, 0],
  ] as const
  const pct = (n: number) => `${+n.toFixed(2)}%`
  const off = (o: number) => `min(${pct(o)}, ${+(o * PX_PER_PERCENT).toFixed(2)}px)`
  const bottomDepth = depth * BOTTOM_SCALE

  const points: string[] = []
  for (const [t, o] of edges.includes('top') ? run(STEPS_ACROSS, depth) : straight)
    points.push(`${pct(t * 100)} ${off(o)}`)
  for (const [t, o] of edges.includes('right') ? run(STEPS_DOWN, depth) : straight)
    points.push(`calc(100% - ${off(o)}) ${pct(t * 100)}`)
  for (const [t, o] of edges.includes('bottom') ? run(STEPS_ACROSS, bottomDepth) : straight)
    points.push(`${pct(100 - t * 100)} calc(100% - ${off(o)})`)
  for (const [t, o] of edges.includes('left') ? run(STEPS_DOWN, depth) : straight)
    points.push(`${off(o)} ${pct(100 - t * 100)}`)

  return `polygon(${points.join(', ')})`
}
