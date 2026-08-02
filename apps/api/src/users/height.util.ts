/**
 * Profile.height is free text (onboarding accepts anything, e.g. "5ft 8in" or "5' 8\""),
 * not a canonical format — so range filtering has to parse it, not string-match it.
 * Mirrors apps/web/lib/height.ts's parseHeight so both sides agree on what counts as valid input.
 */
export function parseHeightToInches(
  value: string | null | undefined,
): number | null {
  if (!value?.trim()) return null;

  const feetInches = value.match(/(\d+)\s*['′]\s*(\d+)\s*["″]?/);
  if (feetInches) {
    return parseInt(feetInches[1], 10) * 12 + parseInt(feetInches[2], 10);
  }

  const ftIn = value.match(
    /(\d+)\s*(?:ft|feet)\s*(\d+)\s*(?:in|inch|inches)?/i,
  );
  if (ftIn) {
    return parseInt(ftIn[1], 10) * 12 + parseInt(ftIn[2], 10);
  }

  return null;
}
