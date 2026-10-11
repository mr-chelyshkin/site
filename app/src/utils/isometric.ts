export type Point = readonly [number, number]
export type Vec3 = readonly [number, number, number]
export type Projector = (x: number, y: number, z: number) => Point

const COS_30 = Math.cos(Math.PI / 6)
export function projector(originX: number, originY: number): Projector {
  return (x, y, z) => [originX + (x - y) * COS_30, originY + (x + y) * 0.5 - z]
}

export interface PlateShape {
  width: number
  depth: number
  thickness: number
  z: number
}

export interface Box {
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
  anchor: Point
}

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

export function planeTransform(project: Projector, origin: Vec3, u: Vec3, v: Vec3): string {
  const [x, y, z] = origin
  const [ex, ey] = project(x, y, z)
  const [ux, uy] = project(x + u[0], y + u[1], z + u[2])
  const [vx, vy] = project(x + v[0], y + v[1], z + v[2])
  const n = (value: number) => +value.toFixed(4)
  return `matrix(${n(ux - ex)} ${n(uy - ey)} ${n(vx - ex)} ${n(vy - ey)} ${n(ex)} ${n(ey)})`
}

export const X: Vec3 = [1, 0, 0]
export const Y: Vec3 = [0, 1, 0]
export const DOWNWARD: Vec3 = [0, 0, -1]

export const onTop = (project: Projector, box: Box) =>
  planeTransform(project, [box.x, box.y, box.z + box.height], X, Y)
export const onFront = (project: Projector, box: Box) =>
  planeTransform(project, [box.x, box.y + box.depth, box.z + box.height], X, DOWNWARD)
export const onRight = (project: Projector, box: Box) =>
  planeTransform(project, [box.x + box.width, box.y, box.z + box.height], Y, DOWNWARD)

export const svgPoints = (pts: readonly Point[]) =>
  pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
