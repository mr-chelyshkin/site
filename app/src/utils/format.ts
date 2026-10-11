export const padIndex = (index: number) => String(index + 1).padStart(2, '0')

export function validity(from: string, to: string | null, since = 'since ') {
  const short = (month: string) => `${month.slice(5, 7)}/${month.slice(2, 4)}`
  return to ? `${short(from)}–${short(to)}` : `${since}${short(from)}`
}
