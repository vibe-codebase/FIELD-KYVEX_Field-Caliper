/** Motion maths: a damped spring sampled into a CSS linear() easing, list stagger, and the drag-to-dismiss decision. */

/** Position of a unit spring (0 → 1) over time, by semi-implicit Euler at 1 ms steps. */
export function springSamples(stiffness = 210, damping = 22, mass = 1, n = 48): { values: number[]; ms: number } {
  const dt = 1 / 1000;
  let x = 0, v = 0, t = 0;
  const trace: number[] = [];
  // settle when both the offset and the speed are tiny, or after 1.5 s
  while (t < 1.5) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt; x += v * dt; t += dt;
    trace.push(x);
    if (t > 0.05 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break;
  }
  const ms = Math.round(t * 1000);
  const values = Array.from({ length: n + 1 }, (_, i) => (i === n ? 1 : trace[Math.min(trace.length - 1, Math.round((i / n) * (trace.length - 1)))]));
  values[0] = 0;
  return { values, ms };
}
/** CSS `linear()` easing that follows the spring, plus how long it takes. */
export function springEasing(stiffness?: number, damping?: number): { easing: string; ms: number } {
  const { values, ms } = springSamples(stiffness, damping);
  return { easing: `linear(${values.map((x) => Math.round(x * 10000) / 10000).join(', ')})`, ms };
}
/** Delay for the i-th list item: 35 ms apart, only the first 8 are staggered. */
export function stagger(i: number, step = 35, max = 8): number { return Math.max(0, Math.min(i, max)) * step; }
/** Close a dragged sheet when pulled past 30% of its height, or flicked down fast enough. */
export function shouldDismiss(dy: number, height: number, velocity: number): boolean {
  if (dy <= 8) return false;
  return dy > height * 0.3 || velocity > 0.55;
}
/** Rubber-band resistance when dragging the wrong way. */
export function rubber(d: number, limit = 60): number { return d >= 0 ? d : -limit * (1 - Math.exp(d / limit)); }
