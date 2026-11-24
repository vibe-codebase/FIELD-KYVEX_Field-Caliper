import { useEffect, useRef, useState } from 'react';
import { applyOffset, bubble, detectMode, edgeReading, flatReading, isLevel, lowPass, readout, upFromGravity, upFromOrientation, type Mode, type Vec } from '../lib/level';
import { signedDeg } from '../lib/format';
import { clack, settle } from '../lib/sound';
import { Icon } from '../ui/icons';
import Lottie from '../lottie/Lottie';
import { Segmented, Tool, useApp } from '../ui/kit';

type Reading = { mode: Mode; x: number; y: number; total: number; edge: number; turn: number; rawX: number; rawY: number; rawEdge: number };
const RANGE = 10; // degrees at which the bubble reaches the end of its travel

function useTilt(paused: boolean) {
  const [up, setUp] = useState<Vec | null>(null);
  const [state, setState] = useState<'wait' | 'live' | 'none'>('wait');
  const [attempt, setAttempt] = useState(0);
  const last = useRef<{ v: Vec | null; t: number; orientAt: number }>({ v: null, t: 0, orientAt: 0 });
  const pausedRef = useRef(paused); pausedRef.current = paused;
  useEffect(() => {
    setState('wait');
    let seen = false;
    const feed = (raw: Vec) => {
      seen = true;
      const now = performance.now();
      const L = last.current;
      L.v = lowPass(L.v, raw, now - (L.t || now));
      L.t = now;
      if (!pausedRef.current) { setUp(L.v); setState('live'); }
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (typeof e.beta !== 'number' || typeof e.gamma !== 'number' || !Number.isFinite(e.beta) || !Number.isFinite(e.gamma)) return;
      last.current.orientAt = performance.now();
      feed(upFromOrientation(e.beta, e.gamma));
    };
    const onMotion = (e: DeviceMotionEvent) => {
      // only a fallback for devices whose orientation events carry no angles
      if (performance.now() - last.current.orientAt < 600) return;
      const g = e.accelerationIncludingGravity;
      const v = g && typeof g.x === 'number' && typeof g.y === 'number' && typeof g.z === 'number' ? upFromGravity(g.x, g.y, g.z) : null;
      if (v) feed(v);
    };
    window.addEventListener('deviceorientation', onOrient);
    window.addEventListener('devicemotion', onMotion);
    const t = setTimeout(() => { if (!seen) setState('none'); }, 1500);
    return () => { clearTimeout(t); window.removeEventListener('deviceorientation', onOrient); window.removeEventListener('devicemotion', onMotion); };
  }, [attempt]);
  return { up, state, retry: () => setAttempt((n) => n + 1) };
}

export default function Level() {
  const { save, set, settings, tap, toast } = useApp();
  const L = save.level;
  const [held, setHeld] = useState(false);
  const { up, state, retry } = useTilt(held);
  const modeRef = useRef<Mode | null>(null);
  const [frozen, setFrozen] = useState<Reading | null>(null);
  const chimeAt = useRef({ was: false, t: 0 });

  let r: Reading | null = null;
  if (up) {
    const auto = detectMode(up, modeRef.current);
    modeRef.current = auto;
    const mode = L.mode === 'auto' ? auto : L.mode;
    const f = flatReading(up), e = edgeReading(up);
    r = { mode, rawX: f.x, rawY: f.y, rawEdge: e.angle, x: applyOffset(f.x, L.flatX), y: applyOffset(f.y, L.flatY), total: 0, edge: applyOffset(e.angle, L.edge), turn: e.turn };
    r.total = Math.hypot(r.x, r.y);
  }
  const show = held ? frozen : r;
  const value = show ? (show.mode === 'flat' ? show.total : show.edge) : 0;
  const level = !!show && isLevel(value);
  const zero = !!show && readout(value) === '0.0';

  useEffect(() => {
    const c = chimeAt.current, now = performance.now();
    if (zero && !c.was && now - c.t > 1500 && !held) { settle(settings.sound); tap('success'); c.t = now; }
    c.was = zero;
  }, [zero, held, settings.sound, tap]);

  const hold = () => {
    if (!r && !held) return;
    clack(settings.sound); tap('medium');
    if (held) { setHeld(false); setFrozen(null); } else { setFrozen(r); setHeld(true); }
  };
  const zeroHere = () => {
    if (!r) return;
    const before = { ...L };
    if (r.mode === 'flat') set((s) => ({ ...s, level: { ...s.level, flatX: clampOff(r.rawX), flatY: clampOff(r.rawY) } }));
    else set((s) => ({ ...s, level: { ...s.level, edge: clampOff(r.rawEdge) } }));
    tap('success');
    const far = r.mode === 'flat' ? Math.max(Math.abs(r.rawX), Math.abs(r.rawY)) : Math.abs(r.rawEdge);
    toast(far > 20 ? 'Zero offsets stop at 20°, so this tilt is only partly zeroed' : 'Zero set to this surface', () => set((s) => ({ ...s, level: before })));
  };

  if (state === 'none') {
    return (
      <div className="level-page none">
        <div className="no-sensor">
          <Lottie scene="noSensor" theme={settings.theme} still={settings.reduceMotion} className="ns-art" label="A level tube with its bubble drifting while signal arcs search for a sensor" />
          <h2>No motion sensor found on this device</h2>
          <p>The level reads your phone’s tilt sensor, and none answered. Ruler, Protractor and Ring still work.</p>
          <button className="ghost" onClick={() => { tap(); retry(); }}><Icon name="motion" size={20} />Try again</button>
        </div>
      </div>
    );
  }

  const mode: Mode = show?.mode ?? (L.mode === 'edge' ? 'edge' : 'flat');
  const hint = !show ? 'Reading the sensor…' : mode === 'flat'
    ? (level ? 'Level' : sideHint(show.x, show.y))
    : (level ? 'Level' : show.edge > 0 ? 'Right end high' : 'Left end high');

  return (
    <div className={`level-page ${level ? 'is-level' : ''} ${held ? 'held' : ''}`}>
      <div className="field mat level-field" data-testid="level-field">
        {mode === 'flat' ? (
          <div className="bullseye">
            <svg viewBox="-100 -100 200 200" aria-hidden="true">
              <circle r="96" className="be-ring outer" />
              {[1, 2, 5].map((d) => <circle key={d} r={(d / RANGE) * 84} className="be-ring" />)}
              <path d="M-96 0H96M0 -96V96" className="be-cross" />
              {[-90, -45, 45, 90].map((v) => <path key={v} d={`M${v} -5v10M-5 ${v}h10`} className="be-tick" />)}
              <circle r="15" className="be-target" />
              <path d="M0 -99l-6 -9h12z" className="be-top" />
              <g style={{ transform: `translate(${show ? bubble(show.x, RANGE) * 84 : 0}px, ${show ? -bubble(show.y, RANGE) * 84 : 0}px)` }} className="be-bubble-g">
                <circle r="13" className="bubble" />
                <ellipse cx="-4" cy="-5" rx="5" ry="3" className="bubble-hi" />
              </g>
            </svg>
          </div>
        ) : (
          <div className="tube-wrap" style={{ transform: `rotate(${show?.turn ?? 0}deg)` }}>
            <div className="tube">
              <span className="tube-mark l" /><span className="tube-mark r" />
              <i className="tube-bubble" style={{ ['--b' as string]: show ? bubble(show.edge, RANGE) : 0 }} />
            </div>
            <div className="tube-scale">{[-10, -5, 0, 5, 10].map((d) => <span key={d}>{d === 0 ? '0' : Math.abs(d)}</span>)}</div>
          </div>
        )}
        <div className="lv-mode-tag">{mode === 'flat' ? 'Surface · lay flat' : 'Edge · stand on an edge'}</div>
      </div>
      <div className="dock">
        <div className={`lv-read ${level ? 'ok' : ''}`} aria-live="polite">
          <div className="ar-main"><b>{show ? readout(Math.abs(value)) : '–.–'}</b><span>°</span></div>
          <div className="lv-side">
            <b>{hint}</b>
            {show && mode === 'flat' && <small>X {signedDeg(show.x)} · Y {signedDeg(show.y)}</small>}
            {show && mode === 'edge' && <small>{level ? 'Bubble centred' : 'Green within ±0.5°'}</small>}
            {held && <span className="ro-held"><Icon name="lock" size={13} />Held</span>}
          </div>
        </div>
        <div className="dock-row three">
          <Segmented small label="Level mode" value={L.mode} onChange={(v) => { tap(); set((s) => ({ ...s, level: { ...s.level, mode: v } })); }}
            options={[{ v: 'auto', label: 'Auto' }, { v: 'flat', label: 'Flat' }, { v: 'edge', label: 'Edge' }]} />
          <Tool icon={held ? 'unlock' : 'hold'} on={held} onClick={hold} label={held ? 'Release the reading' : 'Hold the reading'} disabled={!show}>{held ? 'Release' : 'Hold'}</Tool>
          <Tool icon="target" onClick={zeroHere} label="Zero here" disabled={!r || held}>Zero</Tool>
        </div>
      </div>
    </div>
  );
}

const clampOff = (d: number) => Math.max(-20, Math.min(20, d));
function sideHint(x: number, y: number): string {
  const ax = Math.abs(x), ay = Math.abs(y);
  if (ay >= ax) return y > 0 ? 'Top edge high' : 'Bottom edge high';
  return x > 0 ? 'Right edge high' : 'Left edge high';
}
