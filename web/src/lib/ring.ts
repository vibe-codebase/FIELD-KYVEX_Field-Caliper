/**
 * Ring sizes from the inside diameter (mm). Each system is a formula over its published table:
 * - US/CA: d = 11.63 + 0.8128 · size (US 7 ≈ 17.3 mm), half sizes.
 * - UK/AU: letters by inside circumference, A = 37.83 mm, +1.25 mm per letter, half letters; Z+1 … beyond Z.
 * - EU/ISO 8653: the inside circumference in whole mm.
 * - JP/CN: d = 13 + (n − 1) / 3 mm (JP 14 ≈ US 7).
 * - IN: circumference = 40 + n mm (IN 14 ≈ US 7).
 */
export const RING_MIN_MM = 12;
export const RING_MAX_MM = 24;
const circ = (d: number) => Math.PI * d;
export const diameterFromCirc = (c: number) => c / Math.PI;

export type SizeOut = { text: string; exact: number; note?: 'small' | 'large' };

function halfText(x: number): string {
  const w = Math.floor(x), h = x - w >= 0.5;
  return h ? (w ? `${w}½` : '½') : String(w);
}

export function usDiameter(size: number) { return 11.63 + 0.8128 * size; }
export function usSize(d: number): SizeOut {
  const exact = (d - 11.63) / 0.8128;
  const s = Math.round(exact * 2) / 2;
  if (s < 0) return { text: '0', exact, note: 'small' };
  if (s > 16) return { text: '16', exact, note: 'large' };
  return { text: halfText(s), exact };
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function ukCircumference(letterIndex: number) { return 37.83 + 1.25 * letterIndex; }
export function ukSize(d: number): SizeOut {
  const exact = (circ(d) - 37.83) / 1.25;
  const s = Math.round(exact * 2) / 2;
  if (s < 0) return { text: 'A', exact, note: 'small' };
  if (s > 29) return { text: 'Z+4', exact, note: 'large' };
  const i = Math.floor(s), half = s - i >= 0.5 ? '½' : '';
  return { text: i < 26 ? `${LETTERS[i]}${half}` : `Z+${i - 25}${half}`, exact };
}

export function euSize(d: number): SizeOut {
  const exact = circ(d);
  return { text: String(Math.round(exact)), exact };
}

export function jpDiameter(n: number) { return 13 + (n - 1) / 3; }
export function jpSize(d: number): SizeOut {
  const exact = (d - 13) * 3 + 1;
  const n = Math.round(exact);
  if (n < 1) return { text: '1', exact, note: 'small' };
  if (n > 33) return { text: '33', exact, note: 'large' };
  return { text: String(n), exact };
}

export function inSize(d: number): SizeOut {
  const exact = circ(d) - 40;
  const n = Math.round(exact);
  if (n < 1) return { text: '1', exact, note: 'small' };
  if (n > 35) return { text: '35', exact, note: 'large' };
  return { text: String(n), exact };
}

export type RingSizes = { dia: number; circ: number; us: SizeOut; uk: SizeOut; eu: SizeOut; jp: SizeOut; in: SizeOut };
export function sizesFor(diameterMm: number): RingSizes {
  const d = diameterMm;
  return { dia: d, circ: circ(d), us: usSize(d), uk: ukSize(d), eu: euSize(d), jp: jpSize(d), in: inSize(d) };
}

/** Finger mode: a typed circumference. Returns a plain hint for anything no ring can be. */
export function parseCircumference(text: string, unit: 'mm' | 'cm' | 'in'): { ok: true; mm: number } | { ok: false; reason: string } {
  const t = text.trim().replace(',', '.');
  if (!t) return { ok: false, reason: 'Type the length of string that went round your finger.' };
  if (!/^\d*\.?\d+$/.test(t)) return { ok: false, reason: 'Use digits only, like 54 or 54.5.' };
  const v = Number(t);
  const mm = unit === 'cm' ? v * 10 : unit === 'in' ? v * 25.4 : v;
  if (mm < 35) return { ok: false, reason: 'That is smaller than any adult ring (about 35 mm round). Check the unit.' };
  if (mm > 80) return { ok: false, reason: 'That is larger than ring charts go (about 80 mm round). Check the unit.' };
  return { ok: true, mm };
}
