/** A point in drawing units. */
export type Point = readonly [number, number]
export type Projector = (x: number, y: number, z: number) => Point

const COS_30 = Math.cos(Math.PI / 6)

/** Isometric projection around an origin: x runs to the lower right, y to the lower left, z up. */
export function projector(originX: number, originY: number): Projector {
  return (x, y, z) => [originX + (x - y) * COS_30, originY + (x + y) * 0.5 - z]
}

export interface PlateShape {
  width: number
  depth: number
  thickness: number
  /** Height of the top face. */
  z: number
}

export interface PlateFaces {
  top: Point[]
  right: Point[]
  front: Point[]
  /** The right corner of the top face, where a leader line starts. */
  anchor: Point
}

/** The three visible faces of a plate centered on the axis. */
export function plateFaces(project: Projector, plate: PlateShape): PlateFaces {
  const x0 = -plate.width / 2
  const y0 = -plate.depth / 2
  const x1 = x0 + plate.width
  const y1 = y0 + plate.depth
  const top = plate.z
  const bottom = plate.z - plate.thickness

  const a = project(x0, y0, top)
  const b = project(x1, y0, top)
  const c = project(x1, y1, top)
  const d = project(x0, y1, top)
  const bLow = project(x1, y0, bottom)
  const cLow = project(x1, y1, bottom)
  const dLow = project(x0, y1, bottom)

  return { top: [a, b, c, d], right: [b, c, cLow, bLow], front: [c, d, dLow, cLow], anchor: b }
}

/** SVG `points` for a polyline or polygon. */
export const svgPoints = (pts: readonly Point[]) =>
  pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
