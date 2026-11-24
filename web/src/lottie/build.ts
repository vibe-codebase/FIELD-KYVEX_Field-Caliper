/**
 * Tiny builders for bodymovin 5.x JSON, so Caliper's animations are written in code with the theme's colours.
 * Only shape layers, groups, rect / ellipse / path, fill / stroke, trim paths and transforms: everything the
 * light SVG player renders without expressions.
 */
export type RGBA = [number, number, number, number];
export type Ease = { i: { x: number[]; y: number[] }; o: { x: number[]; y: number[] } };
export type Key<T> = { t: number; s: T; i?: Ease['i']; o?: Ease['o'] };
export type Prop<T> = { a: 0; k: T } | { a: 1; k: Key<T>[] };
export type Shape = Record<string, unknown>;
export type Layer = Record<string, unknown>;
export type Anim = { v: string; fr: number; ip: number; op: number; w: number; h: number; nm: string; ddd: 0; assets: []; layers: Layer[] };

/** "#ffcc1a" → [1, 0.8, 0.1, 1]. Bad input is black, never NaN. */
export function rgb(hex: string, alpha = 1): RGBA {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, alpha];
}

/** Ease presets: out (decelerate), inOut (drafting-arm sweep), linear. */
export const EASE: Record<"out" | "inOut" | "linear", Ease> = {
  out: { i: { x: [0.2], y: [1] }, o: { x: [0.16], y: [0.6] } },
  inOut: { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
  linear: { i: { x: [1], y: [1] }, o: { x: [0], y: [0] } },
};

export const still = <T>(k: T): Prop<T> => ({ a: 0, k });
/** Keyframes as [frame, value] pairs; every segment uses the given ease and the last key holds. */
export function keys<T>(pairs: [number, T][], ease: Ease = EASE.inOut): Prop<T> {
  return { a: 1, k: pairs.map(([t, s], n) => (n < pairs.length - 1 ? { t, s, i: ease.i, o: ease.o } : { t, s })) };
}
const arr = (x: number | number[]) => (Array.isArray(x) ? x : [x]);
/** Wrap scalars as one-item arrays the way bodymovin stores 1-D animated values. */
export function keys1(pairs: [number, number][], ease: Ease = EASE.inOut): Prop<number[]> {
  return keys(pairs.map(([t, v]) => [t, arr(v)] as [number, number[]]), ease);
}

export type Tr = { p?: Prop<number[]>; a?: Prop<number[]>; s?: Prop<number[]>; r?: Prop<number> | Prop<number[]>; o?: Prop<number> | Prop<number[]> };
function tr(t: Tr = {}): Shape {
  return { ty: 'tr', p: t.p ?? still([0, 0]), a: t.a ?? still([0, 0]), s: t.s ?? still([100, 100]), r: t.r ?? still(0), o: t.o ?? still(100), sk: still(0), sa: still(0), nm: 'Transform' };
}
export function group(nm: string, items: Shape[], t?: Tr): Shape { return { ty: 'gr', nm, it: [...items, tr(t)] }; }
export function rect(w: number, h: number, x = 0, y = 0, r = 0): Shape { return { ty: 'rc', d: 1, nm: 'rect', s: still([w, h]), p: still([x, y]), r: still(r) }; }
export function ellipse(w: number, h: number, x = 0, y = 0): Shape { return { ty: 'el', d: 1, nm: 'ellipse', s: still([w, h]), p: still([x, y]) }; }
/** A polyline (or polygon when closed) through the points. */
export function path(points: [number, number][], closed = false): Shape {
  // fresh arrays for every tangent: the player converts them to absolute values in place
  const z = () => points.map(() => [0, 0]);
  return { ty: 'sh', d: 1, nm: 'path', ks: still({ i: z(), o: z(), v: points.map(([x, y]) => [x, y]), c: closed }) };
}
/** A circular arc as a cubic bezier path, angles in degrees counter-clockwise from +x with y down on screen. */
export function arc(cx: number, cy: number, r: number, from: number, to: number): Shape {
  const segs = Math.max(1, Math.ceil(Math.abs(to - from) / 90));
  const step = (to - from) / segs, rad = Math.PI / 180;
  const k = (4 / 3) * Math.tan((step * rad) / 4) * r;
  const v: number[][] = [], i: number[][] = [], o: number[][] = [];
  for (let n = 0; n <= segs; n++) {
    const a = (from + step * n) * rad;
    const x = cx + Math.cos(a) * r, y = cy - Math.sin(a) * r;
    const tx = -Math.sin(a), ty = -Math.cos(a); // tangent in screen space
    v.push([x, y]); i.push(n ? [-tx * k, -ty * k] : [0, 0]); o.push(n < segs ? [tx * k, ty * k] : [0, 0]);
  }
  return { ty: 'sh', d: 1, nm: 'arc', ks: still({ i, o, v, c: false }) };
}
export function fill(c: RGBA, o: Prop<number> = still(100)): Shape { return { ty: 'fl', nm: 'fill', c: still(c), o, r: 1 }; }
export function stroke(c: RGBA, w: number, opts: { cap?: 1 | 2 | 3; dash?: [number, number]; o?: Prop<number> } = {}): Shape {
  const s: Shape = { ty: 'st', nm: 'stroke', c: still(c), o: opts.o ?? still(100), w: still(w), lc: opts.cap ?? 3, lj: 1, ml: 4 };
  if (opts.dash) s.d = [{ n: 'd', nm: 'dash', v: still(opts.dash[0]) }, { n: 'g', nm: 'gap', v: still(opts.dash[1]) }, { n: 'o', nm: 'offset', v: still(0) }];
  return s;
}
/** Trim paths: animate `end` 0→100 to draw a line on. */
export function trim(end: Prop<number> | Prop<number[]>, start: Prop<number> | Prop<number[]> = still(0)): Shape {
  return { ty: 'tm', nm: 'trim', s: start, e: end, o: still(0), m: 1 };
}

let ind = 0;
export function layer(nm: string, shapes: Shape[], op: number, t: Tr = {}): Layer {
  ind += 1;
  return {
    ddd: 0, ind, ty: 4, nm, sr: 1, ao: 0, bm: 0, ip: 0, op, st: 0,
    ks: { o: t.o ?? still(100), r: t.r ?? still(0), p: t.p ?? still([0, 0, 0]), a: t.a ?? still([0, 0, 0]), s: t.s ?? still([100, 100, 100]) },
    shapes,
  };
}
/** Layers are listed top first, as in After Effects. */
export function anim(nm: string, w: number, h: number, op: number, layers: Layer[]): Anim {
  return { v: '5.7.4', fr: 60, ip: 0, op, w, h, nm, ddd: 0, assets: [], layers };
}

/** Checks a built animation the way the player needs it; returns the problems found (empty = valid). */
export function validate(a: unknown): string[] {
  const bad: string[] = [];
  const o = a as Partial<Anim>;
  for (const k of ['v', 'fr', 'ip', 'op', 'w', 'h', 'layers'] as const) if (o?.[k] === undefined) bad.push(`missing ${k}`);
  if (!(typeof o.op === 'number' && typeof o.ip === 'number' && o.op > o.ip)) bad.push('op must be after ip');
  if (!Array.isArray(o.layers) || !o.layers.length) bad.push('no layers');
  const walk = (x: unknown, at: string) => {
    if (typeof x === 'number') { if (!Number.isFinite(x)) bad.push(`non-finite number at ${at}`); return; }
    if (Array.isArray(x)) { x.forEach((y, n) => walk(y, `${at}[${n}]`)); return; }
    if (x && typeof x === 'object') {
      const r = x as Record<string, unknown>;
      if ((r.ty === 'fl' || r.ty === 'st') && r.c) {
        const c = (r.c as { k: unknown }).k;
        if (!Array.isArray(c) || c.length !== 4 || c.some((v) => typeof v !== 'number' || v < 0 || v > 1)) bad.push(`colour out of range at ${at}`);
      }
      for (const [k, v] of Object.entries(r)) walk(v, `${at}.${k}`);
    }
  };
  walk(o.layers, 'layers');
  return bad;
}
