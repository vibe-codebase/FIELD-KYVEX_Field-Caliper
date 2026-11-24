/** Display helpers shared by the screens. */
import { MM_PER_INCH, formatInches, type Units } from './measure';

export const fixed = (x: number, digits: number) =>
  (Object.is(Math.round(x * 10 ** digits), -0) ? 0 : x).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** "6.30 px/mm · 160 px/in" for the calibration readouts. */
export function density(pxPerMm: number): string {
  return `${fixed(pxPerMm, 2)} px/mm · ${fixed(pxPerMm * MM_PER_INCH, 0)} px/in`;
}

/** A short length for chips and totals, in the chosen units: "312.5 mm", "12 5/16 in". */
export function shortLength(mm: number, units: Units): string {
  if (units === 'imperial') return `${formatInches(mm / MM_PER_INCH)} in`;
  return mm >= 1000 ? `${fixed(mm / 1000, 3)} m` : `${fixed(Math.round(mm * 2) / 2, 1)} mm`;
}

/** A signed angle for the level, with a real minus sign. */
export function signedDeg(deg: number): string {
  const r = Math.round(deg * 10) / 10;
  if (r === 0) return '0.0°';
  return `${r < 0 ? '−' : '+'}${Math.abs(r).toFixed(1)}°`;
}
