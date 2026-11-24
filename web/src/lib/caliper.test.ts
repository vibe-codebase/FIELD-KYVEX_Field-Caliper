import { describe, expect, it } from 'vitest';
import {
  CARD_MM, ESTIMATE_PX_PER_MM, MAX_PX_PER_MM, MIN_PX_PER_MM, addSlide, calibrate, detentIndex, formatInches, formatMetric,
  inchFraction, mmToIn, mmToPx, pxToMm, rulerTicks, snap, spanReadout, validPxPerMm,
} from './measure';
import { between, clampHalf, companions, formatDeg, nearerArm, norm360, pointAngle, snapAngle } from './angle';
import { applyOffset, bubble, detectMode, edgeReading, flatReading, isLevel, lowPass, readout, upFromGravity, upFromOrientation } from './level';
import { euSize, inSize, jpDiameter, jpSize, parseCircumference, sizesFor, ukCircumference, ukSize, usDiameter, usSize } from './ring';
import { SAVE_VERSION, defaults, parseSave } from './store';
import { density, shortLength, signedDeg } from './format';
import { rgb, validate } from '../lottie/build';
import { SCENES } from '../lottie/scenes';

const near = (a: number, b: number, eps = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(eps);

describe('calibration and conversion', () => {
  it('estimates 160 CSS px per inch until calibrated', () => {
    near(ESTIMATE_PX_PER_MM * 25.4, 160);
    near(pxToMm(160, ESTIMATE_PX_PER_MM), 25.4);
    near(mmToPx(CARD_MM, ESTIMATE_PX_PER_MM), 539.21, 0.01);
  });
  it('calibrates from a bank card matched on screen', () => {
    const r = calibrate(600, CARD_MM);
    expect(r.ok).toBe(true);
    if (r.ok) { near(r.pxPerMm, 600 / 85.6); near(pxToMm(300, r.pxPerMm), 42.8); }
  });
  it('rejects absurd or missing calibrations with a reason', () => {
    expect(calibrate(100, CARD_MM).ok).toBe(false); // 1.17 px/mm
    expect(calibrate(5000, CARD_MM).ok).toBe(false); // 58 px/mm
    expect(calibrate(400, 0).ok).toBe(false);
    expect(calibrate(400, -5).ok).toBe(false);
    expect(calibrate(Number.NaN, 50).ok).toBe(false);
    const r = calibrate(5000, 10);
    expect(!r.ok && r.reason).toMatch(/longer/);
  });
  it('bounds px/mm to what real screens can be', () => {
    expect(validPxPerMm(MIN_PX_PER_MM)).toBe(true);
    expect(validPxPerMm(MAX_PX_PER_MM)).toBe(true);
    for (const x of [2.99, 12.01, 0, -6, Infinity, Number.NaN, '6', null]) expect(validPxPerMm(x)).toBe(false);
  });
  it('snaps without float drift', () => {
    expect(snap(42.26, 0.5)).toBe(42.5);
    expect(snap(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(snap(-1.24, 0.5)).toBe(-1);
    expect(snap(-0.2, 0.5)).toBe(0);
    expect(Object.is(snap(-0.2, 0.5), -0)).toBe(false);
  });
});

describe('inch fractions', () => {
  it('rounds to the nearest 1/16 and reduces', () => {
    expect(formatInches(1.6875)).toBe('1 11/16');
    expect(formatInches(0.5)).toBe('1/2');
    expect(formatInches(0.375)).toBe('3/8');
    expect(formatInches(2)).toBe('2');
    expect(formatInches(0)).toBe('0');
    expect(formatInches(0.02)).toBe('0'); // under 1/32 rounds to zero
    expect(formatInches(0.97)).toBe('1'); // 15.52/16 rounds up to the whole inch
  });
  it('handles negatives and huge values', () => {
    expect(formatInches(-0.25)).toBe('−1/4');
    expect(formatInches(-0.01)).toBe('0');
    expect(formatInches(1234.5)).toBe('1234 1/2');
    expect(inchFraction(1.65625, 32)).toEqual({ neg: false, whole: 1, num: 21, den: 32 });
  });
  it('gives both span readouts', () => {
    const m = spanReadout(42.5, 'metric');
    expect(m.main).toBe('42.5'); expect(m.mainUnit).toBe('mm'); expect(m.alt).toBe('1 11/16 in · 4.25 cm');
    const i = spanReadout(25.4, 'imperial');
    expect(i.main).toBe('1'); expect(i.alt).toBe('1.00 in · 25.4 mm');
    expect(formatMetric(1234).unit).toBe('m');
    expect(formatMetric(1234).value).toBe('1.234');
    expect(formatMetric(0).value).toBe('0.0');
  });
});

describe('ruler', () => {
  it('lays out metric ticks with labelled centimetres', () => {
    const t = rulerTicks(100, 'metric');
    expect(t).toHaveLength(101);
    expect(t[0]).toEqual({ at: 0, level: 0, label: '0' });
    expect(t[5].level).toBe(1); expect(t[7].level).toBe(3);
    expect(t.filter((x) => x.label).map((x) => x.label)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });
  it('lays out imperial ticks down to 1/16 inch', () => {
    const t = rulerTicks(mmToIn(1) * 0 + 25.4 * 2, 'imperial');
    expect(t).toHaveLength(33);
    expect(t.map((x) => x.level).slice(0, 17)).toEqual([0, 4, 3, 4, 2, 4, 3, 4, 1, 4, 3, 4, 2, 4, 3, 4, 0]);
    near(t[16].at, 25.4);
    expect(rulerTicks(0, 'metric')).toEqual([]);
    expect(rulerTicks(-5, 'imperial')).toEqual([]);
  });
  it('clicks once per whole cm or inch crossed', () => {
    expect(detentIndex(9.99, 'metric')).toBe(0);
    expect(detentIndex(10, 'metric')).toBe(1);
    expect(detentIndex(25.39, 'imperial')).toBe(0);
    expect(detentIndex(25.4, 'imperial')).toBe(1);
  });
  it('sums slides for long objects and ignores empty spans', () => {
    let t = { mm: 0, count: 0 };
    t = addSlide(t, 120.5); t = addSlide(t, 98); t = addSlide(t, 0); t = addSlide(t, Number.NaN);
    expect(t).toEqual({ mm: 218.5, count: 2 });
  });
});

describe('protractor', () => {
  it('reads directions counter-clockwise with screen y down', () => {
    near(pointAngle(100, 100, 200, 100), 0);
    near(pointAngle(100, 100, 100, 0), 90);
    near(pointAngle(100, 100, 0, 100), 180);
    near(pointAngle(100, 100, 100, 200), 270);
    near(pointAngle(0, 0, 1, -1), 45);
  });
  it('measures the smaller angle across the 0/360 seam', () => {
    near(between(10, 350), 20);
    near(between(350, 10), 20);
    near(between(0, 180), 180);
    near(between(30, 30), 0);
    near(between(-90, 90), 180);
    near(between(725, 5), 0);
  });
  it('gives the supplement and reflex', () => {
    expect(companions(60)).toEqual({ supplement: 120, reflex: 300 });
    expect(companions(0)).toEqual({ supplement: 180, reflex: 360 });
  });
  it('snaps to whole or tenth degrees and wraps', () => {
    expect(snapAngle(42.46, true)).toBe(42);
    expect(snapAngle(42.46, false)).toBe(42.5);
    expect(snapAngle(359.96, false)).toBe(0);
    expect(norm360(-30)).toBe(330);
    expect(norm360(Number.NaN)).toBe(0);
    expect(formatDeg(89.96)).toBe('90.0°');
  });
  it('keeps half-circle arms on the top half and picks the nearer arm', () => {
    expect(clampHalf(200)).toBe(180);
    expect(clampHalf(300)).toBe(0);
    expect(clampHalf(120)).toBe(120);
    expect(nearerArm(0, 90, 80)).toBe('b');
    expect(nearerArm(10, 200, 350)).toBe('a');
  });
});

describe('level', () => {
  it('turns beta and gamma into the up direction', () => {
    const flat = upFromOrientation(0, 0);
    near(flat.x, 0); near(flat.y, 0); near(flat.z, 1);
    const upright = upFromOrientation(90, 0);
    near(upright.y, 1); near(upright.z, 0);
    const g = upFromGravity(0, 0, 9.81)!;
    near(g.z, 1);
    expect(upFromGravity(0, 0, 0)).toBeNull();
    expect(upFromGravity(Number.NaN, 0, 1)).toBeNull();
  });
  it('detects flat and edge use with a dead band', () => {
    expect(detectMode(upFromOrientation(5, 3), null)).toBe('flat');
    expect(detectMode(upFromOrientation(85, 2), null)).toBe('edge');
    expect(detectMode(upFromOrientation(42, 0), 'flat')).toBe('flat');
    expect(detectMode(upFromOrientation(42, 0), 'edge')).toBe('edge');
    expect(detectMode(upFromOrientation(-80, 0), 'flat')).toBe('edge');
  });
  it('reads flat tilt per axis', () => {
    const r = flatReading(upFromOrientation(0, -3));
    near(r.x, 3, 1e-9); near(r.y, 0, 1e-9); near(r.total, 3, 1e-9);
    const t = flatReading(upFromOrientation(2, 0));
    near(t.y, 2, 1e-9);
  });
  it('reads edge tilt on every edge', () => {
    const tilt = (deg: number) => ({ x: Math.sin((deg * Math.PI) / 180), y: Math.cos((deg * Math.PI) / 180), z: 0 });
    const r = edgeReading(tilt(1.5));
    expect(r.quarter).toBe(0); near(r.angle, 1.5, 1e-9);
    const left = edgeReading(tilt(91));
    expect(left.quarter).toBe(1); expect(left.turn).toBe(90); near(left.angle, 1, 1e-9);
    const right = edgeReading(tilt(-92));
    expect(right.quarter).toBe(3); expect(right.turn).toBe(-90); near(right.angle, -2, 1e-9);
    const top = edgeReading(tilt(179));
    expect(top.quarter).toBe(2); near(top.angle, -1, 1e-9);
  });
  it('smooths readings at the same rate whatever the sensor speed', () => {
    const a = { x: 0, y: 0, z: 1 }, b = upFromOrientation(0, 10);
    let fast = a; for (let i = 0; i < 12; i++) fast = lowPass(fast, b, 1000 / 120);
    let slow = a; for (let i = 0; i < 3; i++) slow = lowPass(slow, b, 1000 / 30);
    near(fast.x, slow.x, 1e-3); // per-step renormalising keeps it close, not exact
    expect(Math.abs(fast.x)).toBeLessThan(Math.abs(b.x));
    expect(lowPass(null, b, 16)).toEqual(lowPass(null, b, 999));
    const nan = lowPass(a, b, Number.NaN);
    expect(Number.isFinite(nan.x)).toBe(true);
  });
  it('applies zero offsets and wraps', () => {
    near(applyOffset(1.2, 1.2), 0);
    near(applyOffset(179, -3), -178);
    near(applyOffset(-179, 3), 178);
  });
  it('rounds the readout and the level band', () => {
    expect(readout(-0.04)).toBe('0.0');
    expect(readout(0.05)).toBe('0.1');
    expect(isLevel(0.5)).toBe(true); expect(isLevel(-0.51)).toBe(false);
    expect(bubble(30, 10)).toBe(1); expect(bubble(-5, 10)).toBe(-0.5);
    expect(signedDeg(-0.04)).toBe('0.0°'); expect(signedDeg(-1.26)).toBe('−1.3°'); expect(signedDeg(2)).toBe('+2.0°');
  });
});

describe('ring sizes', () => {
  it('matches known chart rows', () => {
    near(usDiameter(7), 17.32, 0.01);
    const s = sizesFor(usDiameter(7));
    expect(s.us.text).toBe('7');
    expect(s.uk.text.startsWith('N')).toBe(true); // UK N to N½ ≈ US 7
    expect(s.eu.text).toBe('54');
    expect(s.jp.text).toBe('14');
    expect(s.in.text).toBe('14');
    expect(sizesFor(usDiameter(5)).jp.text).toBe('9');
    expect(sizesFor(usDiameter(9)).uk.text).toBe('R½');
    expect(sizesFor(usDiameter(10)).eu.text).toBe('62');
    expect(usSize(usDiameter(6.5)).text).toBe('6½');
  });
  it('round-trips each system formula', () => {
    expect(ukSize(ukCircumference(0) / Math.PI).text).toBe('A');
    expect(ukSize(ukCircumference(25) / Math.PI).text).toBe('Z');
    expect(ukSize(ukCircumference(26) / Math.PI).text).toBe('Z+1');
    expect(jpSize(jpDiameter(20)).text).toBe('20');
    expect(euSize(50 / Math.PI).text).toBe('50');
    expect(inSize(56 / Math.PI).text).toBe('16');
  });
  it('flags sizes off the end of a chart', () => {
    expect(usSize(10).note).toBe('small');
    expect(usSize(30).note).toBe('large');
    expect(ukSize(10).note).toBe('small');
    expect(jpSize(30).note).toBe('large');
  });
  it('parses a finger circumference gently', () => {
    expect(parseCircumference('54', 'mm')).toEqual({ ok: true, mm: 54 });
    const cm = parseCircumference('5,45', 'cm');
    expect(cm.ok && cm.mm).toBeCloseTo(54.5);
    const inch = parseCircumference('2.125', 'in');
    expect(inch.ok && inch.mm).toBeCloseTo(53.975);
    expect(parseCircumference('', 'mm').ok).toBe(false);
    expect(parseCircumference('5.4', 'mm').ok).toBe(false); // that is cm typed as mm
    expect(parseCircumference('١٢', 'mm').ok).toBe(false);
    expect(parseCircumference('12abc', 'mm').ok).toBe(false);
    expect(parseCircumference('200', 'mm').ok).toBe(false);
  });
});

describe('save parsing', () => {
  it('loads defaults from nothing, junk or a newer version', () => {
    expect(parseSave(null)).toEqual(defaults());
    expect(parseSave('{not json')).toEqual(defaults());
    expect(parseSave('[]')).toEqual(defaults());
    expect(parseSave('"hello"')).toEqual(defaults());
    expect(parseSave(JSON.stringify({ v: SAVE_VERSION + 1, settings: { theme: 'paper' } }))).toEqual(defaults());
    expect(parseSave('x'.repeat(300_000))).toEqual(defaults());
  });
  it('rejects absurd calibration and wrong types field by field', () => {
    const s = parseSave(JSON.stringify({
      v: 1, settings: { theme: 'neon', units: 'furlongs', sound: false, haptics: 'yes' },
      cal: { pxPerMm: 99, method: 'card', prompted: true },
      ruler: { a: -40, b: 1e9, totalMm: 'lots', slides: 3.7 },
      protractor: { a: 720, b: Number.NaN, full: 1, snap: true },
      level: { flatX: 400, edge: -400, mode: 'sideways' },
      ring: { mode: 'finger', dia: 3, circText: '<b>54</b>mm', circUnit: 'ft' },
    }));
    expect(s.settings).toEqual({ theme: 'workshop', units: 'metric', sound: false, haptics: true, reduceMotion: false });
    expect(s.cal.pxPerMm).toBe(ESTIMATE_PX_PER_MM);
    expect(s.cal.method).toBe('estimate');
    expect(s.cal.prompted).toBe(true);
    expect(s.ruler).toEqual({ a: 0, b: 400, totalMm: 0, slides: 4 });
    expect(s.protractor).toEqual({ a: 359.9, b: 60, full: false, snap: true });
    expect(s.level).toEqual({ flatX: 20, flatY: 0, edge: -20, mode: 'auto' });
    expect(s.ring).toEqual({ mode: 'finger', dia: 12, circText: '54', circUnit: 'mm' });
  });
  it('keeps a valid save intact', () => {
    const d = defaults();
    d.settings.theme = 'blueprint'; d.settings.units = 'imperial'; d.tourDone = true;
    d.cal = { pxPerMm: 6.81, method: 'card', prompted: true, knownMm: 120 };
    d.ring = { mode: 'finger', dia: 18.1, circText: '56.5', circUnit: 'mm' };
    expect(parseSave(JSON.stringify(d))).toEqual(d);
  });
  it('formats densities and short lengths', () => {
    expect(density(ESTIMATE_PX_PER_MM)).toBe('6.30 px/mm · 160 px/in');
    expect(shortLength(312.4, 'metric')).toBe('312.5 mm');
    expect(shortLength(1500, 'metric')).toBe('1.500 m');
    expect(shortLength(25.4 * 12.3125, 'imperial')).toBe('12 5/16 in');
  });
});

describe('lottie animations', () => {
  const themes = [
    { tool: '#ffcc1a', onTool: '#111111', ink: '#eef0f2', ink2: '#a8b0b9', measure: '#3fd0ff', panel: '#272c32', grid: '#2b3036', ok: '#4ade80' },
    { tool: '#e0a800', onTool: '#1a1a1a', ink: '#1a1a1a', ink2: '#5d5a52', measure: '#0a78ad', panel: '#fbfaf6', grid: '#dcd8cc', ok: '#15803d' },
  ];
  it('every scene is valid bodymovin with finite keys and 0–1 colours in every theme', () => {
    for (const p of themes) for (const [id, make] of Object.entries(SCENES)) {
      const a = make(p);
      expect(validate(a), id).toEqual([]);
      expect(a.fr).toBe(60);
      expect(a.op - a.ip).toBeGreaterThanOrEqual(60);
      expect(a.layers.length).toBeGreaterThan(0);
      expect(JSON.stringify(a)).not.toMatch(/null|NaN/);
    }
  });
  it('loops end where they start so they repeat without a jump', () => {
    const a = SCENES.drag(themes[0]);
    const firstLast = (k: { t: number; s: unknown }[]) => [JSON.stringify(k[0].s), JSON.stringify(k[k.length - 1].s)];
    const walk = (x: unknown): void => {
      if (Array.isArray(x)) { x.forEach(walk); return; }
      if (x && typeof x === 'object') {
        const r = x as { a?: number; k?: unknown };
        if (r.a === 1 && Array.isArray(r.k)) { const [f, l] = firstLast(r.k as { t: number; s: unknown }[]); expect(l).toBe(f); }
        Object.values(x).forEach(walk);
      }
    };
    walk(a.layers);
  });
  it('catches broken data', () => {
    expect(validate({})).toContain('no layers');
    expect(validate({ v: '5', fr: 60, ip: 10, op: 5, w: 1, h: 1, layers: [{ shapes: [{ ty: 'fl', c: { a: 0, k: [2, 0, 0, 1] } }] }] }).join()).toMatch(/op must be after ip.*colour/);
    expect(validate({ v: '5', fr: 60, ip: 0, op: 5, w: 1, h: 1, layers: [{ x: Number.NaN }] })).toHaveLength(1);
    expect(rgb('nope')).toEqual([0, 0, 0, 1]);
    expect(rgb('#ff8000')).toEqual([1, 128 / 255, 0, 1]);
  });
});
