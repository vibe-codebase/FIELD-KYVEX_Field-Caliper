/** Synthesised sounds, all quiet and short: a detent click per cm or inch, a lock clack, and the level's settle chime. */
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}
function click(c: AudioContext, at: number, f: number, g: number, q: number) {
  const s = c.createBufferSource(); s.buffer = noise;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
  const e = c.createGain(); e.gain.setValueAtTime(g, at); e.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
  s.connect(bp).connect(e).connect(c.destination); s.start(at);
}
function tone(c: AudioContext, at: number, f: number, g: number, d: number) {
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
  const e = c.createGain(); e.gain.setValueAtTime(0.0001, at); e.gain.exponentialRampToValueAtTime(g, at + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, at + d);
  o.connect(e).connect(c.destination); o.start(at); o.stop(at + d + 0.05);
}
/** The soft detent of a sliding cursor. */
export function detent(on: boolean) {
  const c = on ? ac() : null; if (!c) return;
  click(c, c.currentTime + 0.003, 2600, 0.16, 6);
}
/** A firmer clack for lock and hold. */
export function clack(on: boolean) {
  const c = on ? ac() : null; if (!c) return;
  const t = c.currentTime + 0.003;
  click(c, t, 1300, 0.22, 4); click(c, t + 0.028, 2100, 0.12, 5);
}
/** Two soft bell partials when the bubble settles on 0.0°. */
export function settle(on: boolean) {
  const c = on ? ac() : null; if (!c) return;
  const t = c.currentTime + 0.01;
  tone(c, t, 1318.5, 0.07, 0.9); tone(c, t + 0.07, 1975.5, 0.04, 0.7);
}
export function suspendAudio() { try { void ctx?.suspend(); } catch { /* ignore */ } }
