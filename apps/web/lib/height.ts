export const HEIGHT_MIN_IN = 58 // 4' 10"
export const HEIGHT_MAX_IN = 78 // 6' 6"
export const HEIGHT_DEFAULT_IN = 66 // 5' 6"

export function formatHeight(inches: number): string {
  const clamped = Math.min(HEIGHT_MAX_IN, Math.max(HEIGHT_MIN_IN, Math.round(inches)))
  const ft = Math.floor(clamped / 12)
  const inch = clamped % 12
  return `${ft}' ${inch}"`
}

export function parseHeight(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const feetInches = value.match(/(\d+)\s*['′]\s*(\d+)\s*["″]?/)
  if (feetInches) {
    return parseInt(feetInches[1], 10) * 12 + parseInt(feetInches[2], 10)
  }
  const ftIn = value.match(/(\d+)\s*(?:ft|feet)\s*(\d+)\s*(?:in|inch|inches)?/i)
  if (ftIn) {
    return parseInt(ftIn[1], 10) * 12 + parseInt(ftIn[2], 10)
  }
  return null
}

export function heightToInches(value: string): number {
  const parsed = parseHeight(value)
  if (parsed == null) return HEIGHT_DEFAULT_IN
  return Math.min(HEIGHT_MAX_IN, Math.max(HEIGHT_MIN_IN, parsed))
}

/** All stored height strings for an inclusive inch range (matches profile/seed format). */
export function heightStringsInRange(minIn: number, maxIn: number): string[] {
  const lo = Math.min(HEIGHT_MAX_IN, Math.max(HEIGHT_MIN_IN, Math.round(minIn)))
  const hi = Math.min(HEIGHT_MAX_IN, Math.max(HEIGHT_MIN_IN, Math.round(maxIn)))
  const out: string[] = []
  for (let i = Math.min(lo, hi); i <= Math.max(lo, hi); i++) {
    out.push(formatHeight(i))
  }
  return out
}
