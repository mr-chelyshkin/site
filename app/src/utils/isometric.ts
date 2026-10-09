/** A point in drawing units. */
export type Point = readonly [number, number]
/** A point or a direction in world units. */
export type Vec3 = readonly [number, number, number]
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

export interface Box {
  /** The back corner of the box's foot, the one furthest from the viewer. */
  x: number
  y: number
  z: number
  width: number
  depth: number
  height: number
}

export interface BoxFaces {
  top: Point[]
  right: Point[]
  front: Point[]
}

export interface PlateFaces extends BoxFaces {
  /** The right corner of the top face, where a leader line starts. */
  anchor: Point
}

/** The three visible faces of a box: its top, its right side and its front. */
export function boxFaces(project: Projector, box: Box): BoxFaces {
  const x1 = box.x + box.width
  const y1 = box.y + box.depth
  const top = box.z + box.height

  const a = project(box.x, box.y, top)
  const b = project(x1, box.y, top)
  const c = project(x1, y1, top)
  const d = project(box.x, y1, top)
  const bLow = project(x1, box.y, box.z)
  const cLow = project(x1, y1, box.z)
  const dLow = project(box.x, y1, box.z)

  return { top: [a, b, c, d], right: [b, c, cLow, bLow], front: [c, d, dLow, cLow] }
}

/** The three visible faces of a plate centered on the axis. */
export function plateFaces(project: Projector, plate: PlateShape): PlateFaces {
  const faces = boxFaces(project, {
    x: -plate.width / 2,
    y: -plate.depth / 2,
    z: plate.z - plate.thickness,
    width: plate.width,
    depth: plate.depth,
    height: plate.thickness,
  })
  return { ...faces, anchor: faces.top[1] }
}

/**
 * An SVG transform that lays flat drawing onto a plane of the scene: local
 * (0, 0) lands on `origin`, and a local unit along x or y on a world unit along
 * `u` or `v`. The projection is affine, so shapes and text drawn in the plane's
 * own units come out foreshortened as the plane is.
 */
export function planeTransform(project: Projector, origin: Vec3, u: Vec3, v: Vec3): string {
  const [x, y, z] = origin
  const [ex, ey] = project(x, y, z)
  const [ux, uy] = project(x + u[0], y + u[1], z + u[2])
  const [vx, vy] = project(x + v[0], y + v[1], z + v[2])
  const n = (value: number) => +value.toFixed(4)
  return `matrix(${n(ux - ex)} ${n(uy - ey)} ${n(vx - ex)} ${n(vy - ey)} ${n(ex)} ${n(ey)})`
}

/** SVG `points` for a polyline or polygon. */
export const svgPoints = (pts: readonly Point[]) =>
  pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
