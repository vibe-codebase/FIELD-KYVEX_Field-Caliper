/**
 * Spirit-level maths. The sensor gives beta (front-back) and gamma (left-right) in degrees; from them we get the
 * "up" direction in the phone's own frame (x right, y toward the top edge, z out of the screen):
 *   up = (−sin γ · cos β, sin β, cos β · cos γ)
 * Flat on a table that is (0, 0, 1); standing upright in portrait it is (0, 1, 0).
 */
export type Vec = { x: number; y: number; z: number };
const RAD = Math.PI / 180, DEG = 180 / Math.PI;

export function upFromOrientation(beta: number, gamma: number): Vec {
  const b = beta * RAD, g = gamma * RAD;
  return { x: -Math.sin(g) * Math.cos(b), y: Math.sin(b), z: Math.cos(b) * Math.cos(g) };
}
/** accelerationIncludingGravity already points up (the spec: lying flat, z ≈ +9.81). */
export function upFromGravity(x: number, y: number, z: number): Vec | null {
  const n = Math.hypot(x, y, z);
  if (!Number.isFinite(n) || n < 1) return null;
  return { x: x / n, y: y / n, z: z / n };
}
function unit(v: Vec): Vec {
  const n = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

/** Exponential low-pass, time based so the bubble feels the same at 15 Hz or 120 Hz sensors. */
export function lowPass(prev: Vec | null, next: Vec, dtMs: number, tauMs = 140): Vec {
  if (!prev) return unit(next);
  const dt = Number.isFinite(dtMs) ? Math.max(0, Math.min(dtMs, 1000)) : 0;
  const k = 1 - Math.exp(-dt / tauMs);
  return unit({ x: prev.x + (next.x - prev.x) * k, y: prev.y + (next.y - prev.y) * k, z: prev.z + (next.z - prev.z) * k });
}

export type Mode = 'flat' | 'edge';
/** Lying flat or standing on an edge, with a dead band so it does not flicker at 40°. */
export function detectMode(up: Vec, prev: Mode | null): Mode {
  const tilt = Math.acos(Math.min(1, Math.abs(up.z))) * DEG;
  if (tilt < 35) return 'flat';
  if (tilt > 50) return 'edge';
  return prev ?? (tilt < 42.5 ? 'flat' : 'edge');
}

/** Flat reading: tilt along each screen axis (positive x = right edge high, positive y = top edge high) and in total. */
export function flatReading(up: Vec): { x: number; y: number; total: number } {
  const z = Math.max(1e-9, up.z);
  return { x: Math.atan2(up.x, z) * DEG, y: Math.atan2(up.y, z) * DEG, total: Math.acos(Math.min(1, Math.abs(up.z))) * DEG };
}

/**
 * Edge reading: the phone stands on one of its four edges. `quarter` says which (0 bottom edge down, 1 left edge down,
 * 2 top edge down, 3 right edge down); `turn` is the CSS rotation in degrees that keeps the tube level with the world;
 * `angle` is the tilt away from true level, positive when the right-hand end (as you look at it) is high.
 */
export function edgeReading(up: Vec): { quarter: 0 | 1 | 2 | 3; turn: number; angle: number } {
  const a = Math.atan2(up.x, up.y) * DEG; // 0 when the top edge points up
  const k = Math.round(a / 90);
  const quarter = (((k % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  return { quarter, turn: quarter === 3 ? -90 : quarter * 90, angle: a - k * 90 };
}

/** Subtract a stored zero offset and keep the result in −180 … 180. */
export function applyOffset(deg: number, offset: number): number {
  let d = deg - offset;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

/** Level means the rounded readout would sit within half a degree. */
export const isLevel = (deg: number, tol = 0.5) => Math.abs(deg) <= tol;
/** The readout shows one decimal; "0.0" (not "−0.0") triggers the settle chime. */
export function readout(deg: number): string {
  const r = Math.round(deg * 10) / 10;
  return (Object.is(r, -0) || r === 0 ? 0 : r).toFixed(1);
}

/** Where the bubble sits, as a fraction −1 … 1 of its travel; it saturates at `range` degrees. */
export function bubble(deg: number, range: number): number {
  return Math.max(-1, Math.min(1, deg / range));
}
