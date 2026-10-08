import type { PassCord } from './pass-physics'

/** The kinds of pass on the cable. */
export const PASS_KINDS = ['holder', 'reel', 'laminated', 'smartcard', 'metal', 'visitor'] as const
export type PassKind = (typeof PASS_KINDS)[number]

/** Black cord, a reel's nylon line that pays out, a woven ribbon, and a ball chain. */
export const CORDS = {
  cord: { hz: 3.2, stretch: 50, thins: true },
  nylon: { hz: 1.7, stretch: 150, thins: false },
  ribbon: { hz: 5, stretch: 28, thins: false },
  chain: { hz: 8, stretch: 14, thins: false },
} as const satisfies Record<string, PassCord>
export type CordKind = keyof typeof CORDS

/**
 * How a kind of pass hangs:
 * - `width`: how wide the pass is;
 * - `dropExtra`: how much lower it hangs, so a reel has room;
 * - `slot`: its pivot below the card's top edge;
 * - `tie`: where its cord ties on above the pivot;
 * - `hookY`: where the cord swings from below the ring;
 * - `cord`: which cord it hangs on.
 *
 * Each kind's partial (`_pass-*.scss`) draws its slot and hardware at these
 * places; a reel's mouth, at `hookY`, is `.commerce__reel` in `_commerce.scss`.
 */
export interface PassShape {
  width: number
  dropExtra: number
  slot: number
  tie: number
  hookY: number
  cord: CordKind
}

export const SHAPES: Record<PassKind, PassShape> = {
  holder: { width: 206, dropExtra: 0, slot: 13, tie: 28, hookY: 0, cord: 'cord' },
  reel: { width: 194, dropExtra: 32, slot: 13, tie: 30, hookY: 44, cord: 'nylon' },
  laminated: { width: 202, dropExtra: 0, slot: 16, tie: 15, hookY: 0, cord: 'cord' },
  smartcard: { width: 196, dropExtra: 0, slot: 12, tie: 38, hookY: 0, cord: 'cord' },
  metal: { width: 172, dropExtra: 0, slot: 15, tie: 2, hookY: 0, cord: 'chain' },
  visitor: { width: 206, dropExtra: 0, slot: 6, tie: 22, hookY: 0, cord: 'ribbon' },
}

/** The kind the content names, or a holder for anything else. */
export const kindOf = (value: string | undefined): PassKind =>
  PASS_KINDS.find((kind) => kind === value) ?? 'holder'
