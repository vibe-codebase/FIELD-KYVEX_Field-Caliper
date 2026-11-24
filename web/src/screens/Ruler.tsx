import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { addSlide, clamp, detentIndex, rulerTicks, snap, spanReadout } from '../lib/measure';
import { clack, detent } from '../lib/sound';
import { shortLength } from '../lib/format';
import { Icon } from '../ui/icons';
import { CalBadge, Segmented, Tool, useApp, useRafMove, useSize, type Pt } from '../ui/kit';

const RW = 58; // ruler strip width
const LW = 48; // cursor lane width
const TOP = 18; // zero sits a little below the header so its cursor is never clipped
const TICK = [24, 16, 12, 9, 6];

export default function Ruler() {
  const { save, set, settings, tap, toast } = useApp();
  const ppm = save.cal.pxPerMm;
  const units = settings.units;
  const [ref, size] = useSize<HTMLDivElement>();
  const [held, setHeld] = useState(false);
  const [active, setActive] = useState<'a' | 'b' | null>(null);
  const [touched, setTouched] = useState(false);
  const drag = useRef<{ id: number; which: 'a' | 'b'; off: number } | null>(null);
  const r = save.ruler;
  const lenMm = size.h ? Math.max(0, (size.h - TOP - 6) / ppm) : 400;
  const a = clamp(r.a, 0, lenMm), b = clamp(r.b, 0, lenMm);
  const span = Math.abs(b - a);
  const read = spanReadout(span, units);
  const ticks = useMemo(() => rulerTicks(lenMm, units), [lenMm, units]);
  const step = units === 'imperial' ? 25.4 / 32 : 0.5;
  const y = (mm: number) => TOP + mm * ppm;

  const posAt = (e: Pt) => (e.clientY - (ref.current?.getBoundingClientRect().top ?? 0) - TOP) / ppm;
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (held) { tap('warning'); toast('Reading is held. Tap Release to measure again.'); return; }
    const mm = posAt(e);
    const which = Math.abs(mm - a) <= Math.abs(mm - b) ? 'a' : 'b';
    const cur = which === 'a' ? a : b;
    // grab near a cursor keeps its offset; a tap elsewhere brings the nearer cursor to the finger
    const off = Math.abs(mm - cur) * ppm < 34 ? cur - mm : 0;
    drag.current = { id: e.pointerId, which, off };
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(which); setTouched(true); tap();
    move(e, true);
  };
  const move = (e: Pt, first = false) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const next = snap(clamp(posAt(e) + d.off, 0, lenMm), step);
    const prev = d.which === 'a' ? a : b;
    if (next === prev) return;
    if (!first && detentIndex(prev, units) !== detentIndex(next, units)) { detent(settings.sound); tap(); }
    set((s) => ({ ...s, ruler: { ...s.ruler, [d.which]: next } }));
  };
  const rafMove = useRafMove((e) => move(e));
  const up = (e: PointerEvent<HTMLDivElement>) => { if (drag.current?.id === e.pointerId) { move(e); drag.current = null; setActive(null); } };

  const hold = () => { clack(settings.sound); tap('medium'); setHeld((h) => !h); };
  const addPart = () => {
    if (span < 0.5) { tap('warning'); toast('Open a span between A and B first'); return; }
    const before = { totalMm: r.totalMm, slides: r.slides };
    const t = addSlide({ mm: r.totalMm, count: r.slides }, span);
    set((s) => ({ ...s, ruler: { ...s.ruler, totalMm: t.mm, slides: t.count } }));
    tap('success');
    toast(`Added ${shortLength(span, units)}. Move the phone on and measure the next part.`, () => set((s) => ({ ...s, ruler: { ...s.ruler, ...before } })));
  };
  const clearTotal = () => {
    const before = { totalMm: r.totalMm, slides: r.slides };
    set((s) => ({ ...s, ruler: { ...s.ruler, totalMm: 0, slides: 0 } }));
    tap(); toast('Total cleared', () => set((s) => ({ ...s, ruler: { ...s.ruler, ...before } })));
  };
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const big = read.main.length > 6;

  return (
    <div className={`ruler-page ${held ? 'held' : ''}`}>
      <div className="field mat" ref={ref} style={{ ['--mm' as string]: `${ppm}px`, ['--top' as string]: `${TOP}px` }}
        onPointerDown={down} onPointerMove={rafMove} onPointerUp={up} onPointerCancel={up} data-testid="ruler-field">
        {size.h > 0 && (
          <svg className="ruler-svg" width={size.w} height={size.h} aria-hidden="true">
            <rect className="rule-body" x="0" y="0" width={RW} height={size.h} />
            <rect className="rule-edge" x={RW - 3} y="0" width="3" height={size.h} />
            {ticks.map((t) => (
              <g key={t.at}>
                <line className={`tk l${t.level}`} x1="0" x2={TICK[t.level]} y1={y(t.at)} y2={y(t.at)} />
                {t.label && y(t.at) < size.h - 28 && <text className="tk-n" x={TICK[0] + 4} y={y(t.at) + 4}>{t.label}</text>}
              </g>
            ))}
            <text className="tk-unit" x={RW / 2} y={size.h - 10}>{units === 'imperial' ? 'in' : 'cm'}</text>
            {/* span shading, extension lines and the dimension line */}
            <rect className="span-fill" x={RW} y={y(lo)} width={size.w - RW} height={(hi - lo) * ppm} />
            {(['a', 'b'] as const).map((k) => {
              const yy = y(k === 'a' ? a : b);
              return (
                <g key={k} className={`cursor ${active === k ? 'on' : ''}`}>
                  <line className="hair" x1="0" x2={RW} y1={yy} y2={yy} />
                  <line className="ext" x1={RW + LW - 6} x2={size.w} y1={yy} y2={yy} />
                  <path className="tab" d={`M${RW} ${yy}l11 -15h${LW - 15}v30h${-(LW - 15)}z`} />
                  <text className="tab-l" x={RW + LW / 2 + 4} y={yy + 5}>{k.toUpperCase()}</text>
                </g>
              );
            })}
            {(hi - lo) * ppm > 26 && (
              <g className="dimline">
                <line x1={RW + LW + 16} x2={RW + LW + 16} y1={y(lo) + 1} y2={y(hi) - 1} />
                <path d={`M${RW + LW + 16} ${y(lo) + 1}l-4 9h8zM${RW + LW + 16} ${y(hi) - 1}l-4 -9h8z`} />
              </g>
            )}
          </svg>
        )}
        <div className="field-chips" onPointerDown={(e) => e.stopPropagation()}>
          <CalBadge />
          <Segmented small label="Units" value={units} onChange={(v) => { tap(); set((s) => ({ ...s, settings: { ...s.settings, units: v } })); }}
            options={[{ v: 'metric', label: 'mm' }, { v: 'imperial', label: 'in' }]} />
        </div>
        {!touched && r.slides === 0 && <p className="ruler-hint" style={{ left: RW + LW + 34 }}>Lay the object along the yellow ruler, then drag the cursors to its ends.</p>}
        <div className="readout-panel" style={{ left: RW + LW + 34 }} onPointerDown={(e) => e.stopPropagation()}>
          <div className="ro-top"><span className="ro-tag">A–B</span>{held && <span className="ro-held"><Icon name="lock" size={13} />Held</span>}</div>
          <div className={`ro-main ${big ? 'long' : ''}`} aria-live="polite"><b>{read.main}</b><span>{read.mainUnit}</span></div>
          <div className="ro-alt">{read.alt}</div>
          <div className="ro-tools">
            <Tool icon={held ? 'unlock' : 'lock'} on={held} onClick={hold} label={held ? 'Release the reading' : 'Hold the reading'}>{held ? 'Release' : 'Hold'}</Tool>
            <Tool icon="slide" onClick={addPart} label="Add this span to the total">Add</Tool>
          </div>
          {r.slides > 0 && (
            <div className="ro-total">
              <span><small>Total · {r.slides} {r.slides === 1 ? 'part' : 'parts'}</small><b key={r.totalMm} className="roll">{shortLength(r.totalMm, units)}</b></span>
              <button className="icon-btn sm" onClick={clearTotal} aria-label="Clear the total"><Icon name="close" size={18} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
