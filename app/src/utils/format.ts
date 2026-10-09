/** Two-digit ordinal for list positions: 0 becomes "01". */
export const padIndex = (index: number) => String(index + 1).padStart(2, '0')

/**
 * The months a pass was valid, as a pass prints them: "10/14–09/16", or
 * "since 12/25" while it still is. Months come as "YYYY-MM".
 */
export function validity(from: string, to: string | null) {
  const short = (month: string) => `${month.slice(5, 7)}/${month.slice(2, 4)}`
  return to ? `${short(from)}–${short(to)}` : `since ${short(from)}`
}
