import type { InjectionKey, Ref } from 'vue'
import { clamp01 } from '@/utils/isometric'

/**
 * The runtime's loop, which the plate under it follows too. In seconds of a
 * LOOP: node DOWN, srv1, goes down at 1 and is back at 5; its work, sent to
 * SPARE, srv3, lands at 3 and finishes at FINISH; new work, sent to DOWN,
 * lands at 8.1. Nodes count row by row from the back left of the plate.
 */
export const LOOP = 10
export const DOWN = 3
export const SPARE = 5
export const FINISH = 6.4
/** How long work takes from the control plane to its node. */
export const SEND = 1.2
/** When the platform's deploy is entered, and sets off for the control plane. */
export const DEPLOY = 6.5
/**
 * Where the runtime plate's control plane stands, in plate units from the
 * plate top's back corner (StackRuntime draws it); the platform's link lands
 * on top of it.
 */
export const CONTROL_PLANE = { u: 16, v: 66, width: 60, depth: 60, height: 26 }
export const LANDINGS = [
  { node: SPARE, at: 3 },
  { node: DOWN, at: 8.1 },
] as const

/** 0 before `start`, 1 after `length` more, linear between. */
export const phase = (t: number, start: number, length: number) => clamp01((t - start) / length)
export const smooth = (t: number) => t * t * (3 - 2 * t)

/** How far node DOWN is down, 0 to 1. */
export const downness = (t: number) => phase(t, 1, 0.3) - phase(t, 5, 0.4)

/** Work on its way to a node, and how far along, 0 to 1. */
export const inFlight = (t: number) =>
  LANDINGS.map(({ node, at }) => ({ node, at: phase(t, at - SEND, SEND) })).filter(
    ({ at }) => at > 0 && at < 1,
  )

/** Seconds the loop has played, from ExplodedStack, which runs the clock. */
export const storyClock: InjectionKey<Ref<number>> = Symbol('story clock')
