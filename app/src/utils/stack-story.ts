import type { InjectionKey, Ref } from 'vue'
import { clamp01 } from '@/utils/math'

export const LOOP = 10
export const DOWN = 3
export const SPARE = 5
export const FAIL = 1
export const RECOVER = 5
export const FINISH = 6.4
export const SEND = 1.2
export const DEPLOY = 6.5
export const CONTROL_PLANE = { u: 16, v: 66, width: 60, depth: 60, height: 26 }
export const LANDINGS = [
  { node: SPARE, at: 3 },
  { node: DOWN, at: 8.1 },
] as const

export const phase = (t: number, start: number, length: number) => clamp01((t - start) / length)
export const smooth = (t: number) => t * t * (3 - 2 * t)

export const downness = (t: number) => phase(t, FAIL, 0.3) - phase(t, RECOVER, 0.4)

export const nodeName = (node: number) => `srv${node < 3 ? node + 4 : node - 2}`
export const serverOf = (node: number) => (node < 3 ? -1 : node - 3)
export const serverName = (server: number) => nodeName(server + 3)

export const inFlight = (t: number) =>
  LANDINGS.map(({ node, at }) => ({ node, at: phase(t, at - SEND, SEND) })).filter(
    ({ at }) => at > 0 && at < 1,
  )

export const storyClock: InjectionKey<Ref<number>> = Symbol('story clock')
