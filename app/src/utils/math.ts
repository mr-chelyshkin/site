export const lerp = (from: number, to: number, t: number) => from + (to - from) * t

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
