/** Length maths: calibration (CSS px per mm), unit conversion, inch fractions and span readouts. */

export const MM_PER_INCH = 25.4;
/** Android lays out 160 dp per inch, and the WebView maps 1 CSS px to 1 dp, so this is the uncalibrated guess. */
export const ESTIMATE_PX_PER_MM = 160 / MM_PER_INCH;
/** ISO/IEC 7810 ID-1 (bank and ID cards): 85.60 × 53.98 mm. */
export const CARD_MM = 85.6;
export const CARD_SHORT_MM = 53.98;
/** No real phone screen falls outside this: about 76 to 305 CSS px per inch. */
export const MIN_PX_PER_MM = 3;
export const MAX_PX_PER_MM = 12;

export type Units = 'metric' | 'imperial';

export function validPxPerMm(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= MIN_PX_PER_MM && x <= MAX_PX_PER_MM;
}

/** Calibration from a drag: `px` on screen matched a real object `mm` long. Absurd results come back as an error message. */
export function calibrate(px: number, mm: number): { ok: true; pxPerMm: number } | { ok: false; reason: string } {
  if (!Number.isFinite(mm) || mm <= 0) return { ok: false, reason: 'Enter the object’s real length first.' };
  if (!Number.isFinite(px) || px <= 0) return { ok: false, reason: 'Drag the line to the end of the object.' };
  const r = px / mm;
  if (r < MIN_PX_PER_MM) return { ok: false, reason: 'That is shorter than any phone screen allows. Check the length you typed.' };
  if (r > MAX_PX_PER_MM) return { ok: false, reason: 'That is longer than any phone screen allows. Check the length you typed.' };
  return { ok: true, pxPerMm: r };
}

export const pxToMm = (px: number, pxPerMm: number) => px / pxPerMm;
export const mmToPx = (mm: number, pxPerMm: number) => mm * pxPerMm;
export const mmToIn = (mm: number) => mm / MM_PER_INCH;
export const inToMm = (inch: number) => inch * MM_PER_INCH;
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Round half away from zero to `step` (0.5 mm, 1/32 in …) without float drift like 0.30000000000000004. */
export function snap(x: number, step: number): number {
  if (!(step > 0)) return x;
  const n = Math.round(Math.abs(x) / step) * step * Math.sign(x);
  return Number(n.toFixed(6)) || 0;
}

function gcd(a: number, b: number): number { while (b) [a, b] = [b, a % b]; return a; }

/** Inches as a reduced fraction to the nearest 1/denom: 1.6875 → { whole: 1, num: 11, den: 16 }. */
export function inchFraction(inches: number, denom = 16): { neg: boolean; whole: number; num: number; den: number } {
  const neg = inches < 0;
  const total = Math.round(Math.abs(inches) * denom);
  const whole = Math.floor(total / denom);
  let num = total - whole * denom, den = denom;
  if (num === 0) return { neg: neg && total > 0, whole, num: 0, den: 1 };
  const g = gcd(num, den); num /= g; den /= g;
  return { neg, whole, num, den };
}

/** "1 11/16", "3/8", "2", "0". */
export function formatInches(inches: number, denom = 16): string {
  const f = inchFraction(inches, denom);
  const sign = f.neg ? '−' : '';
  if (!f.num) return `${sign}${f.whole}`;
  return f.whole ? `${sign}${f.whole} ${f.num}/${f.den}` : `${sign}${f.num}/${f.den}`;
}

const group = (x: number, digits: number) => x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** A length in mm for the big readout: under 1 m in mm to 0.1 mm (handles move in 0.5 mm steps), longer in m. */
export function formatMetric(mm: number): { value: string; unit: string } {
  const a = Math.abs(mm);
  if (a >= 1000) return { value: group(mm / 1000, 3), unit: 'm' };
  return { value: group(snap(mm, 0.1), 1), unit: 'mm' };
}

/** Both readings for a span, as shown under the ruler: "42.5 mm" and "1 11/16 in". */
export function spanReadout(mm: number, units: Units): { main: string; mainUnit: string; alt: string } {
  const inches = mmToIn(mm);
  const met = formatMetric(mm);
  const imp = formatInches(inches);
  if (units === 'imperial') return { main: imp, mainUnit: 'in', alt: `${group(inches, 2)} in · ${met.value} ${met.unit}` };
  return { main: met.value, mainUnit: met.unit, alt: `${imp} in · ${group(mm / 10, 2)} cm` };
}

/** Which whole unit (cm or inch) a ruler position is in, for the detent click: crossing a boundary changes it. */
export function detentIndex(mm: number, units: Units): number {
  return Math.floor((units === 'imperial' ? mmToIn(mm) : mm / 10) + 1e-9);
}

export type Tick = { at: number; level: 0 | 1 | 2 | 3 | 4; label?: string };
/**
 * Ruler ticks from 0 to `lengthMm`, positions in mm. Metric: mm, 5 mm and labelled cm.
 * Imperial: 1/16 in up to labelled whole inches (level 0 = longest).
 */
export function rulerTicks(lengthMm: number, units: Units): Tick[] {
  const out: Tick[] = [];
  if (!(lengthMm > 0)) return out;
  if (units === 'metric') {
    const n = Math.floor(Math.min(lengthMm, 5000) + 1e-9);
    for (let i = 0; i <= n; i++) out.push(i % 10 === 0 ? { at: i, level: 0, label: String(i / 10) } : { at: i, level: i % 5 === 0 ? 1 : 3 });
    return out;
  }
  const n = Math.floor(Math.min(mmToIn(lengthMm), 200) * 16 + 1e-9);
  for (let i = 0; i <= n; i++) {
    const level = i % 16 === 0 ? 0 : i % 8 === 0 ? 1 : i % 4 === 0 ? 2 : i % 2 === 0 ? 3 : 4;
    out.push(level === 0 ? { at: inToMm(i / 16), level: 0, label: String(i / 16) } : { at: inToMm(i / 16), level });
  }
  return out;
}

/** Long-object mode: each slide adds the current span to a running total. */
export function addSlide(total: { mm: number; count: number }, spanMm: number) {
  if (!Number.isFinite(spanMm) || spanMm <= 0) return total;
  return { mm: Number((total.mm + spanMm).toFixed(3)), count: total.count + 1 };
}
