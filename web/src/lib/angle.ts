/** Protractor maths. Angles are in degrees, measured counter-clockwise from the +x axis, with screen y pointing down. */

/** Any angle into [0, 360). */
export function norm360(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  const r = deg % 360;
  const v = r < 0 ? r + 360 : r;
  return v >= 360 - 1e-9 ? 0 : v;
}

/** Direction of a point from the vertex, as a protractor reads it (counter-clockwise, y up). */
export function pointAngle(vx: number, vy: number, px: number, py: number): number {
  return norm360((Math.atan2(vy - py, px - vx) * 180) / Math.PI);
}

/** The angle between two arms, the smaller side: 0 to 180. */
export function between(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b));
  return d > 180 ? 360 - d : d;
}

/** Supplement (180 − a) and reflex (360 − a) of an angle in [0, 180]. */
export function companions(a: number): { supplement: number; reflex: number } {
  return { supplement: 180 - a, reflex: 360 - a };
}

/** Snap to whole degrees when snapping is on, else to the 0.1° the readout shows. */
export function snapAngle(deg: number, whole: boolean): number {
  const step = whole ? 1 : 0.1;
  return norm360(Number((Math.round(deg / step) * step).toFixed(1)));
}

/** In half-circle mode an arm stays on the top half: below the baseline it sticks to whichever end is nearer. */
export function clampHalf(deg: number): number {
  const d = norm360(deg);
  if (d <= 180) return d;
  return d < 270 ? 180 : 0;
}

/** "42.5°" with the readout's single decimal. */
export const formatDeg = (deg: number) => `${(Math.round(deg * 10) / 10).toFixed(1)}°`;

/** Which arm a touch grabs: the one pointing closer to it. */
export function nearerArm(a: number, b: number, touch: number): 'a' | 'b' {
  return between(a, touch) <= between(b, touch) ? 'a' : 'b';
}
