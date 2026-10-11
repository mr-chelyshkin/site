import { seeded } from '@/utils/seeded'

export type Edge = 'top' | 'right' | 'bottom' | 'left'

const STEPS_ACROSS = 48
const STEPS_DOWN = 32
const BOTTOM_SCALE = 1.3
const PX_PER_PERCENT = 7

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
