import { useRef, useState, type PointerEvent } from 'react';
import { CARD_SHORT_MM, ESTIMATE_PX_PER_MM, MAX_PX_PER_MM, MIN_PX_PER_MM, calibrate, clamp } from '../lib/measure';
import { fixed } from '../lib/format';
import { detent } from '../lib/sound';
import { Icon } from '../ui/icons';
import { Primary, Segmented, useApp, useBack, useRafMove, useSize, type Pt } from '../ui/kit';

/** Full-screen calibration: match a line to a bank card's short side, or to any object of known length. */
export default function Calibrate({ onClose }: { onClose: () => void }) {
  const { save, set, settings, tap, toast, celebrate } = useApp();
  useBack(true, onClose);
  const inch = settings.units === 'imperial';
  const [method, setMethod] = useState<'card' | 'known'>(save.cal.method === 'known' ? 'known' : 'card');
  const [text, setText] = useState(() => (inch ? fixed(save.cal.knownMm / 25.4, 2) : String(Math.round(save.cal.knownMm * 10) / 10)));
  const [ppm, setPpm] = useState(save.cal.pxPerMm);
  const [zone, size] = useSize<HTMLDivElement>();
  const drag = useRef<{ id: number; y: number; p: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const typed = Number(text.replace(',', '.'));
  const typedMm = inch ? typed * 25.4 : typed;
  // the longest object that fits between the lines on this screen, with a little room to spare
  const fitMm = Math.floor(((size.h - 6) / save.cal.pxPerMm) * 0.95);
  const knownErr = method === 'known'
    ? (!text.trim() || !Number.isFinite(typed) || typed <= 0 ? 'Type the object’s real length.'
      : typedMm < 20 ? 'Use something at least 20 mm (¾ in) long, for accuracy.'
        : size.h && typedMm > fitMm ? `Too long for this screen. Use something up to ${inch ? `${fixed(fitMm / 25.4, 1)} in` : `${fitMm} mm`} long.` : null)
    : null;
  const L = method === 'card' ? CARD_SHORT_MM : knownErr ? 50 : typedMm;
  const maxP = size.h ? Math.min(MAX_PX_PER_MM, (size.h - 6) / L) : MAX_PX_PER_MM;
  const p = clamp(ppm, MIN_PX_PER_MM, Math.max(MIN_PX_PER_MM, maxP));
  const lineY = L * p;
  const atEdge = p >= maxP - 1e-6 && maxP < MAX_PX_PER_MM;

  const down = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { id: e.pointerId, y: e.clientY, p };
    e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); tap();
  };
  const move = (e: Pt) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const next = clamp(d.p + (e.clientY - d.y) / L, MIN_PX_PER_MM, maxP);
    if (Math.floor(next * L / 10) !== Math.floor(p * L / 10)) detent(settings.sound);
    setPpm(next);
  };
  const rafMove = useRafMove(move);
  const up = (e: PointerEvent<HTMLDivElement>) => { if (drag.current?.id === e.pointerId) { move(e); drag.current = null; setDragging(false); } };
  const nudge = (dir: number) => { tap(); setPpm(clamp(p + dir / L, MIN_PX_PER_MM, maxP)); };

  const saveIt = () => {
    if (knownErr) { tap('warning'); toast(knownErr); return; }
    const r = calibrate(lineY, L);
    if (!r.ok) { tap('warning'); toast(r.reason); return; }
    set((s) => ({ ...s, cal: { pxPerMm: r.pxPerMm, method, prompted: true, knownMm: method === 'known' ? Math.round(typedMm * 10) / 10 : s.cal.knownMm } }));
    tap('success'); celebrate(); onClose();
  };
  const useEstimate = () => {
    set((s) => ({ ...s, cal: { ...s.cal, pxPerMm: ESTIMATE_PX_PER_MM, method: 'estimate', prompted: true } }));
    tap(); toast('Using the estimate (160 px per inch)'); onClose();
  };

  return (
    <div className="calibrate" role="dialog" aria-label="Calibrate">
      <header className="cal-head">
        <h2>Calibrate</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </header>
      <div className="cal-top">
        <Segmented label="Calibrate with" value={method} onChange={(v) => { tap(); setMethod(v); }}
          options={[{ v: 'card', label: <><Icon name="card" size={18} />Bank card</> }, { v: 'known', label: <><Icon name="ruler" size={18} />Known length</> }]} />
        {method === 'known' && (
            <div className="cal-known">
              <label className="known-in">
                <span>Real length</span>
                <input inputMode="decimal" value={text} aria-label="Real length of the object" aria-invalid={!!knownErr}
                  onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, '').slice(0, 6))} />
                <b>{inch ? 'in' : 'mm'}</b>
              </label>
            </div>
          )}
      </div>
      <div className="cal-zone mat" ref={zone} style={{ ['--mm' as string]: `${p}px` }} onPointerDown={down} onPointerMove={rafMove} onPointerUp={up} onPointerCancel={up} data-testid="cal-zone">
        <div className="cal-ref"><span>{method === 'card' ? 'card top edge' : 'object start'}</span></div>
        {size.h > 0 && (
          <>
            {method === 'card' && (
              <div className="cal-card" style={{ height: lineY, width: 85.6 * p, marginLeft: -42.8 * p }}>
                <i className="chip" style={{ width: 11 * p, height: 8.5 * p, top: lineY * 0.3, left: `calc(50% - ${30 * p}px)` }} />
              </div>
            )}
            <div className="cal-dim" style={{ height: lineY }}>
              <span>{method === 'card' ? '53.98 mm' : knownErr ? '—' : inch ? `${fixed(typed, 2)} in` : `${fixed(typedMm, 1)} mm`}</span>
            </div>
            <div className={`cal-line ${dragging ? 'on' : ''}`} style={{ top: lineY }}>
              <span className="cal-grip"><Icon name="units" size={16} />drag</span>
            </div>
          </>
        )}
      </div>
      <div className="cal-bottom">
        {knownErr && method === 'known' ? <p className="field-err center">{knownErr}</p>
          : <p className={`cal-hint ${atEdge ? 'warn' : ''}`}>{atEdge ? 'The line is at the bottom of the space. A taller screen area is needed for this length.'
            : method === 'card' ? <>Lay a bank card <b>across</b> the screen, top edge on the yellow line. Drag until the cyan line meets its bottom edge.</>
              : <>Lay the object down from the yellow line. Drag until the cyan line meets its other end.</>}</p>}
        <div className="cal-fine">
          <button className="icon-btn boxed" onClick={() => nudge(-1)} aria-label="One pixel shorter"><Icon name="minus" /></button>
          <div className="cal-read"><b>{fixed(p, 2)} px/mm</b><small>{fixed(p * 25.4, 0)} px/in · {save.cal.method === 'estimate' ? 'now estimated' : 'now calibrated'}</small></div>
          <button className="icon-btn boxed" onClick={() => nudge(1)} aria-label="One pixel longer"><Icon name="plus" /></button>
        </div>
        <div className="cal-actions">
          <button className="ghost" onClick={useEstimate}>Use estimate</button>
          <Primary icon="check" onClick={saveIt} disabled={!!knownErr}>Save</Primary>
        </div>
      </div>
    </div>
  );
}
