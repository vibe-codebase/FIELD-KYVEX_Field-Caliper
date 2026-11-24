import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { between, clampHalf, companions, formatDeg, nearerArm, norm360, pointAngle, snapAngle } from '../lib/angle';
import { detent } from '../lib/sound';
import { Segmented, Tool, useApp, useRafMove, useSize, type Pt } from '../ui/kit';

const RAD = Math.PI / 180;

export default function Protractor() {
  const { save, set, settings, tap } = useApp();
  const p = save.protractor;
  const [ref, size] = useSize<HTMLDivElement>();
  const [active, setActive] = useState<'a' | 'b' | null>(null);
  const drag = useRef<{ id: number; which: 'a' | 'b' } | null>(null);
  const full = p.full;
  const W = size.w, H = size.h;
  // the knobs ride just outside the scale, so the numbers stay readable under a finger
  const KNOB = 26;
  const R = full ? Math.max(50, Math.min(W, H) / 2 - KNOB - 18) : Math.max(50, Math.min(W / 2 - KNOB - 18, H - KNOB - 70));
  const cx = W / 2, cy = full ? H / 2 : Math.min(H - 28, H / 2 + (R + KNOB) / 2);
  const a = full ? p.a : clampHalf(p.a), b = full ? p.b : clampHalf(p.b);
  const ang = between(a, b);
  const comp = companions(ang);
  const pt = (deg: number, r: number) => [cx + Math.cos(deg * RAD) * r, cy - Math.sin(deg * RAD) * r] as const;

  const scale = useMemo(() => {
    if (!W || !H) return null;
    const max = full ? 359 : 180;
    const lines: string[] = [];
    const labels: { x: number; y: number; t: string; inner?: boolean; rot: number }[] = [];
    for (let d = 0; d <= max; d++) {
      const len = d % 10 === 0 ? 16 : d % 5 === 0 ? 11 : 6;
      const [x1, y1] = pt(d, R), [x2, y2] = pt(d, R - len);
      lines.push(`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`);
      // about 40 px between numbers, whatever the radius
      const every = full ? 30 : R >= 210 ? 10 : R >= 120 ? 20 : 30;
      if (d % every === 0 && !(full && d === 360)) {
        const [lx, ly] = pt(d, R - 27);
        labels.push({ x: lx, y: ly, t: String(d), rot: 90 - d });
        if (!full && R >= 120) { const [ix, iy] = pt(d, R - 45); labels.push({ x: ix, y: iy, t: String(180 - d), inner: true, rot: 90 - d }); }
      }
    }
    return { ticks: lines.join(''), labels };
  }, [W, H, R, full]);

  const touch = (e: Pt) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const setArm = (which: 'a' | 'b', deg: number) => {
    let v = snapAngle(deg, p.snap);
    if (!full) v = clampHalf(v);
    const prev = which === 'a' ? a : b;
    if (v === prev) return;
    if (Math.floor(v / (p.snap ? 5 : 10)) !== Math.floor(prev / (p.snap ? 5 : 10))) { detent(settings.sound); tap(); }
    set((s) => ({ ...s, protractor: { ...s.protractor, [which]: v } }));
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    const t = touch(e);
    if (Math.hypot(t.x - cx, t.y - cy) < 16) return;
    const deg = pointAngle(cx, cy, t.x, t.y);
    const which = nearerArm(a, b, full ? deg : clampHalf(deg));
    drag.current = { id: e.pointerId, which };
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(which); tap();
    setArm(which, deg);
  };
  const move = (e: Pt) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const t = touch(e);
    if (Math.hypot(t.x - cx, t.y - cy) < 16) return;
    setArm(d.which, pointAngle(cx, cy, t.x, t.y));
  };
  const rafMove = useRafMove(move);
  const up = (e: PointerEvent<HTMLDivElement>) => { if (drag.current?.id === e.pointerId) { move(e); drag.current = null; setActive(null); } };

  // the swept arc between the arms, the short way round
  const lo = norm360(a), hi = norm360(b);
  const start = (norm360(hi - lo) <= 180 ? lo : hi);
  const arcR = R * 0.3;
  const [sx, sy] = pt(start, arcR), [ex, ey] = pt(start + ang, arcR);
  const mid = start + ang / 2;
  const [mx, my] = pt(mid, R * 0.54);

  return (
    <div className="protractor-page">
      <div className="field mat" ref={ref} style={{ ['--mm' as string]: `${save.cal.pxPerMm}px` }}
        onPointerDown={down} onPointerMove={rafMove} onPointerUp={up} onPointerCancel={up} data-testid="protractor-field">
        {scale && (
          <svg width={W} height={H} aria-hidden="true">
            {full
              ? <path className="pr-body" fillRule="evenodd" d={`M${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0zM${cx - R * 0.36} ${cy}a${R * 0.36} ${R * 0.36} 0 1 1 ${R * 0.72} 0a${R * 0.36} ${R * 0.36} 0 1 1 ${-R * 0.72} 0z`} />
              : <path className="pr-body" fillRule="evenodd" d={`M${cx - R - 10} ${cy + 14}V${cy}h10a${R} ${R} 0 0 1 ${2 * R} 0h10v14zM${cx - R * 0.36} ${cy}a${R * 0.36} ${R * 0.36} 0 0 1 ${R * 0.72} 0z`} />}
            <path className="pr-ticks" d={scale.ticks} />
            {scale.labels.map((l, i) => <text key={i} className={`pr-n ${l.inner ? 'in' : ''}`} x={l.x} y={l.y} transform={`rotate(${l.rot} ${l.x} ${l.y})`}>{l.t}</text>)}
            <line className="pr-base" x1={full ? cx - R : cx - R - 10} x2={full ? cx + R : cx + R + 10} y1={cy} y2={cy} />
            {full && <line className="pr-base" x1={cx} x2={cx} y1={cy - R} y2={cy + R} />}
            {ang > 0.05 && <path className="pr-sweep" d={`M${cx} ${cy}L${sx} ${sy}A${arcR} ${arcR} 0 0 0 ${ex} ${ey}z`} />}
            {(['a', 'b'] as const).map((k) => {
              const d = k === 'a' ? a : b;
              const [x2, y2] = pt(d, R + KNOB), [kx, ky] = pt(d, R + KNOB);
              return (
                <g key={k} className={`arm ${active === k ? 'on' : ''}`}>
                  <line x1={cx} y1={cy} x2={x2} y2={y2} />
                  <circle className="arm-knob" cx={kx} cy={ky} r="15" />
                  <text className="arm-l" x={kx} y={ky + 5}>{k.toUpperCase()}</text>
                </g>
              );
            })}
            {ang >= 24 && R > 90 && <text className="pr-callout" x={mx} y={my + 5}>{formatDeg(ang)}</text>}
            <circle className="pr-vertex" cx={cx} cy={cy} r="5" />
          </svg>
        )}
      </div>
      <div className="dock">
        <div className="angle-read" aria-live="polite">
          <div className="ar-main"><b>{formatDeg(ang).replace('°', '')}</b><span>°</span></div>
          <dl className="ar-sub">
            <div><dt>Supplement</dt><dd>{formatDeg(comp.supplement)}</dd></div>
            <div><dt>Reflex</dt><dd>{formatDeg(comp.reflex)}</dd></div>
          </dl>
        </div>
        <div className="dock-row">
          <Segmented label="Protractor shape" value={full ? 'full' : 'half'} onChange={(v) => { tap(); set((s) => ({ ...s, protractor: { ...s.protractor, full: v === 'full' } })); }}
            options={[{ v: 'half', label: 'Half' }, { v: 'full', label: 'Full' }]} />
          <Tool icon="target" on={p.snap} onClick={() => { tap(); set((s) => ({ ...s, protractor: { ...s.protractor, snap: !s.protractor.snap } })); }} label="Snap to whole degrees">Snap 1°</Tool>
        </div>
      </div>
    </div>
  );
}
