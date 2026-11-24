/** Versioned local save, validated field by field: bad or hostile data loads as defaults or is clamped. */
import { ESTIMATE_PX_PER_MM, validPxPerMm, type Units } from './measure';
import { RING_MAX_MM, RING_MIN_MM } from './ring';

export const SAVE_KEY = 'caliper.save';
export const SAVE_VERSION = 1;
export type ThemeId = 'workshop' | 'blueprint' | 'paper';
export const THEME_IDS: readonly ThemeId[] = ['workshop', 'blueprint', 'paper'];
export type CalMethod = 'estimate' | 'card' | 'known';
export type Settings = { theme: ThemeId; units: Units; sound: boolean; haptics: boolean; reduceMotion: boolean };
export type Save = {
  v: number;
  settings: Settings;
  tourDone: boolean;
  cal: { pxPerMm: number; method: CalMethod; prompted: boolean; knownMm: number };
  ruler: { a: number; b: number; totalMm: number; slides: number };
  protractor: { a: number; b: number; full: boolean; snap: boolean };
  level: { flatX: number; flatY: number; edge: number; mode: 'auto' | 'flat' | 'edge' };
  ring: { mode: 'ring' | 'finger'; dia: number; circText: string; circUnit: 'mm' | 'cm' | 'in' };
};

export function defaults(): Save {
  return {
    v: SAVE_VERSION,
    settings: { theme: 'workshop', units: 'metric', sound: true, haptics: true, reduceMotion: false },
    tourDone: false,
    cal: { pxPerMm: ESTIMATE_PX_PER_MM, method: 'estimate', prompted: false, knownMm: 40 },
    ruler: { a: 0, b: 50, totalMm: 0, slides: 0 },
    protractor: { a: 0, b: 60, full: false, snap: false },
    level: { flatX: 0, flatY: 0, edge: 0, mode: 'auto' },
    ring: { mode: 'ring', dia: 17.3, circText: '', circUnit: 'mm' },
  };
}

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x);
const num = (x: unknown, d: number, lo: number, hi: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d);
const pick = <T extends string>(x: unknown, opts: readonly T[], d: T): T => (opts.includes(x as T) ? (x as T) : d);

export function parseSave(text: string | null): Save {
  const d = defaults();
  if (!text || text.length > 200_000) return d;
  let o: unknown;
  try { o = JSON.parse(text); } catch { return d; }
  if (!isObj(o) || typeof o.v !== 'number' || !Number.isFinite(o.v) || o.v > SAVE_VERSION || o.v < 1) return d;
  const s = isObj(o.settings) ? o.settings : {};
  const c = isObj(o.cal) ? o.cal : {};
  const r = isObj(o.ruler) ? o.ruler : {};
  const p = isObj(o.protractor) ? o.protractor : {};
  const l = isObj(o.level) ? o.level : {};
  const g = isObj(o.ring) ? o.ring : {};
  const calOk = validPxPerMm(c.pxPerMm);
  return {
    v: SAVE_VERSION,
    settings: {
      theme: pick(s.theme, THEME_IDS, 'workshop'), units: pick(s.units, ['metric', 'imperial'] as const, 'metric'),
      sound: s.sound !== false, haptics: s.haptics !== false, reduceMotion: s.reduceMotion === true,
    },
    tourDone: o.tourDone === true,
    cal: {
      // an absurd stored calibration is worse than the estimate, so it falls back to it
      pxPerMm: calOk ? (c.pxPerMm as number) : d.cal.pxPerMm,
      method: calOk ? pick(c.method, ['estimate', 'card', 'known'] as const, 'estimate') : 'estimate',
      prompted: c.prompted === true, knownMm: num(c.knownMm, 40, 5, 300),
    },
    ruler: { a: num(r.a, 0, 0, 400), b: num(r.b, 50, 0, 400), totalMm: num(r.totalMm, 0, 0, 1e6), slides: Math.round(num(r.slides, 0, 0, 9999)) },
    protractor: { a: num(p.a, 0, 0, 359.9), b: num(p.b, 60, 0, 359.9), full: p.full === true, snap: p.snap === true },
    level: { flatX: num(l.flatX, 0, -20, 20), flatY: num(l.flatY, 0, -20, 20), edge: num(l.edge, 0, -20, 20), mode: pick(l.mode, ['auto', 'flat', 'edge'] as const, 'auto') },
    ring: {
      mode: g.mode === 'finger' ? 'finger' : 'ring', dia: num(g.dia, 17.3, RING_MIN_MM, RING_MAX_MM),
      circText: typeof g.circText === 'string' ? g.circText.replace(/[^\d.,]/g, '').slice(0, 8) : '',
      circUnit: pick(g.circUnit, ['mm', 'cm', 'in'] as const, 'mm'),
    },
  };
}
export function load(): Save { try { return parseSave(localStorage.getItem(SAVE_KEY)); } catch { return defaults(); } }
export function persist(s: Save) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* keep running from memory */ } }
