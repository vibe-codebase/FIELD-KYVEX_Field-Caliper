/** Caliper's Lottie animations, generated with the current theme's colours. All loop seamlessly except `success`. */
import { EASE, anim, arc, ellipse, fill, group, keys, keys1, layer, path, rect, rgb, still, stroke, trim, type Anim, type Shape } from './build';

export type Palette = { tool: string; onTool: string; ink: string; ink2: string; measure: string; panel: string; grid: string; ok: string };

function rulerTicks(x: number, top: number, n: number, gap: number, c: string, long = 14, short = 8): Shape {
  const lines: Shape[] = [];
  for (let i = 0; i < n; i++) lines.push(path([[x, top + i * gap], [x + (i % 5 === 0 ? long : short), top + i * gap]]));
  return group('ticks', [...lines, stroke(rgb(c), 1.4, { cap: 1 })]);
}

/** Card 1: the whole kit at work — protractor arm sweeping, bubble finding level, ring sizing. */
export function kitScene(p: Palette): Anim {
  const OP = 180;
  return anim('kit', 240, 150, OP, [
    layer('ring', [group('ring', [ellipse(34, 34), stroke(rgb(p.tool), 4)], { p: still([212, 108]), s: keys([[0, [100, 100]], [90, [118, 118]], [180, [100, 100]]]) }),
      group('ring-in', [ellipse(22, 22), stroke(rgb(p.ink2), 1.2, { dash: [3, 3] })], { p: still([212, 108]) })], OP),
    layer('bubble', [group('bubble', [ellipse(13, 13), fill(rgb(p.measure))],
      { p: keys([[0, [108, 30]], [50, [150, 30]], [95, [124, 30]], [130, [131, 30]], [150, [130, 30]], [180, [108, 30]]], EASE.inOut) })], OP),
    layer('tube', [group('marks', [path([[121, 21], [121, 39]]), path([[139, 21], [139, 39]]), stroke(rgb(p.ink2), 1.2, { cap: 1 })]),
      group('tube', [rect(104, 22, 130, 30, 11), fill(rgb(p.panel)), stroke(rgb(p.ink2), 1.6)])], OP),
    layer('arm', [group('arm', [path([[0, 0], [60, 0]]), stroke(rgb(p.measure), 2.4, { cap: 2 })], { p: still([130, 124]), r: keys1([[0, -20], [90, -78], [180, -20]]) }),
      group('knob', [ellipse(9, 9, 46, 0), fill(rgb(p.tool))], { p: still([130, 124]), r: keys1([[0, -20], [90, -78], [180, -20]]) })], OP),
    layer('protractor', [group('body', [arc(130, 124, 52, 0, 180), path([[78, 124], [182, 124]]), fill(rgb(p.tool, 1), still(22)), stroke(rgb(p.tool), 1.8)]),
      group('base', [path([[130, 124], [186, 124]]), stroke(rgb(p.ink), 1.6, { cap: 1 })])], OP),
    layer('ruler', [rulerTicks(20, 14, 26, 4.9, p.onTool), group('body', [rect(28, 132, 34, 75, 2), fill(rgb(p.tool))])], OP),
  ]);
}

/** Card 2: cursor B is dragged down the ruler and the dimension line follows. */
export function dragScene(p: Palette): Anim {
  const OP = 180, D = 56;
  const move = keys([[0, [0, 0]], [80, [0, D]], [110, [0, D]], [170, [0, 0]], [180, [0, 0]]], EASE.inOut);
  const tab = (y: number) => path([[50, y], [58, y - 10], [84, y - 10], [84, y + 10], [58, y + 10]], true);
  return anim('drag', 240, 150, OP, [
    layer('finger', [group('finger', [rect(22, 30, 72, 80, 11), fill(rgb(p.ink, 1), still(18)), stroke(rgb(p.ink), 1.4)],
      { p: move, s: keys([[0, [100, 100]], [8, [94, 94]], [170, [94, 94]], [180, [100, 100]]], EASE.out) })], OP, { o: still(90) }),
    layer('cursor-b', [
      group('ext', [path([[88, 64], [236, 64]]), stroke(rgb(p.tool), 1.4, { dash: [5, 4], cap: 1 })], { p: move }),
      group('hair', [path([[20, 64], [50, 64]]), stroke(rgb(p.onTool), 1.6, { cap: 1 })], { p: move }),
      group('tab', [tab(64), fill(rgb(p.tool))], { p: move }),
      group('arrow', [path([[100, 63], [96.5, 55], [103.5, 55]], true), fill(rgb(p.measure))], { p: move }),
    ], OP),
    layer('dim', [group('dim', [path([[100, 24], [100, 64]]), stroke(rgb(p.measure), 1.6, { cap: 1 })],
      { a: still([100, 24]), p: still([100, 24]), s: keys([[0, [100, 100]], [80, [100, 240]], [110, [100, 240]], [170, [100, 100]], [180, [100, 100]]], EASE.inOut) }),
    group('arrow-a', [path([[100, 25], [96.5, 33], [103.5, 33]], true), fill(rgb(p.measure))])], OP),
    layer('cursor-a', [
      group('ext', [path([[88, 24], [236, 24]]), stroke(rgb(p.tool), 1.4, { dash: [5, 4], cap: 1 })]),
      group('hair', [path([[20, 24], [50, 24]]), stroke(rgb(p.onTool), 1.6, { cap: 1 })]),
      group('tab', [tab(24), fill(rgb(p.tool))]),
    ], OP),
    layer('readout', [group('panel', [rect(84, 34, 184, 107, 4), fill(rgb(p.panel)), stroke(rgb(p.ink2), 1)]),
      group('bar', [rect(60, 6, 184, 107, 3), fill(rgb(p.measure))], { a: still([154, 107]), p: still([154, 107]), s: keys([[0, [40, 100]], [80, [100, 100]], [110, [100, 100]], [170, [40, 100]], [180, [40, 100]]], EASE.inOut) })], OP),
    layer('ruler', [rulerTicks(20, 24, 26, 4.8, p.onTool), group('body', [rect(30, 146, 35, 75, 2), fill(rgb(p.tool))])], OP),
  ]);
}

/** Card 3: a bank card lands on the yellow line, the cyan line meets its edge, a check confirms. */
export function calibrateScene(p: Palette): Anim {
  const OP = 240;
  const cardIn = keys([[0, [0, -70]], [45, [0, 0]], [205, [0, 0]], [235, [0, -70]], [240, [0, -70]]], EASE.out);
  const fade = keys1([[0, 0], [30, 100], [205, 100], [230, 0], [240, 0]], EASE.out);
  return anim('calibrate', 240, 150, OP, [
    layer('check', [
      group('tick', [path([[188, 70], [194, 76], [205, 64]]), stroke(rgb(p.onTool), 3, { cap: 2 }), trim(keys1([[0, 0], [122, 0], [146, 100], [240, 100]], EASE.out))], { o: keys1([[0, 100], [205, 100], [220, 0], [240, 0]]) }),
      group('badge', [ellipse(30, 30, 196, 70), fill(rgb(p.ok))], { a: still([196, 70]), p: still([196, 70]), s: keys([[0, [0, 0]], [110, [0, 0]], [128, [112, 112]], [140, [100, 100]], [205, [100, 100]], [222, [0, 0]], [240, [0, 0]]], EASE.out) }),
    ], OP),
    layer('line', [group('line', [path([[12, 132], [228, 132]]), stroke(rgb(p.measure), 2.2, { cap: 1 })],
      { p: keys([[0, [0, 0]], [55, [0, 0]], [105, [0, -32]], [210, [0, -32]], [236, [0, 0]], [240, [0, 0]]], EASE.out) })], OP),
    layer('card', [
      group('card', [
        group('plate', [rect(176, 60, 104, 70, 7), fill(rgb(p.ink, 1), still(14)), stroke(rgb(p.ink), 1.6)]),
        group('chip', [rect(26, 19, 46, 66, 4), path([[34, 88], [92, 88]]), stroke(rgb(p.ink2), 1.2, { cap: 1 })]),
      ], { p: cardIn, o: fade }),
    ], OP),
    layer('ref', [group('ref', [path([[12, 40], [228, 40]]), stroke(rgb(p.tool), 2.4, { cap: 1 })])], OP),
    layer('screen', [group('screen', [rect(224, 138, 120, 75, 10), fill(rgb(p.panel)), stroke(rgb(p.ink2), 1.4)])], OP),
  ]);
}

/** Level empty state: a tube with a bubble drifting while signal arcs search for a sensor. */
export function noSensorScene(p: Palette): Anim {
  const OP = 180;
  const wave = (n: number) => group(`wave${n}`, [arc(120, 70, 18 + n * 12, 50, 130), stroke(rgb(p.measure), 2, { cap: 2 })],
    { o: keys1([[0, 0], [20 + n * 22, 0], [50 + n * 22, 100], [90 + n * 22, 0], [180, 0]], EASE.out) });
  return anim('no-sensor', 240, 150, OP, [
    layer('waves', [wave(0), wave(1), wave(2)], OP),
    layer('bubble', [group('bubble', [ellipse(30, 12), fill(rgb(p.ink2))], { p: keys([[0, [108, 110]], [90, [132, 110]], [180, [108, 110]]], EASE.inOut), o: still(70) })], OP),
    layer('tube', [group('marks', [path([[106, 96], [106, 124]]), path([[134, 96], [134, 124]]), stroke(rgb(p.ink2), 1.2, { cap: 1 })]),
      group('tube', [rect(168, 30, 120, 110, 15), fill(rgb(p.panel)), stroke(rgb(p.ink2), 1.6, { dash: [6, 4] })])], OP),
  ]);
}

/** One-shot celebration for a saved calibration: a drawn ring, a check and ticks flicking outwards. */
export function successScene(p: Palette): Anim {
  const OP = 84;
  const ticks: Shape[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    ticks.push(path([[60 + Math.cos(a) * 36, 60 + Math.sin(a) * 36], [60 + Math.cos(a) * (i % 3 ? 42 : 46), 60 + Math.sin(a) * (i % 3 ? 42 : 46)]]));
  }
  return anim('success', 120, 120, OP, [
    layer('ticks', [group('ticks', [...ticks, stroke(rgb(p.tool), 2.2, { cap: 1 })],
      { a: still([60, 60]), p: still([60, 60]), s: keys([[0, [70, 70]], [26, [70, 70]], [50, [112, 112]], [84, [108, 108]]], EASE.out), o: keys1([[0, 0], [26, 0], [40, 100], [84, 100]], EASE.out) })], OP),
    layer('check', [group('check', [path([[46, 61], [56, 71], [76, 50]]), stroke(rgb(p.ok), 5, { cap: 2 }), trim(keys1([[0, 0], [22, 0], [46, 100], [84, 100]], EASE.out))])], OP),
    layer('ring', [group('ring', [ellipse(64, 64, 60, 60), stroke(rgb(p.ok), 4, { cap: 2 }), trim(keys1([[0, 0], [30, 100], [84, 100]], EASE.out))])], OP),
  ]);
}

export const SCENES = { kit: kitScene, drag: dragScene, calibrate: calibrateScene, noSensor: noSensorScene, success: successScene };
export type SceneId = keyof typeof SCENES;
