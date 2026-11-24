import { useRef } from 'react';
import { RING_MAX_MM, RING_MIN_MM, diameterFromCirc, parseCircumference, sizesFor, type RingSizes } from '../lib/ring';
import { fixed } from '../lib/format';
import { detent } from '../lib/sound';
import { Icon } from '../ui/icons';
import { CalBadge, Segmented, useApp, useSize } from '../ui/kit';

function SizeGrid({ s, units }: { s: RingSizes | null; units: 'metric' | 'imperial' }) {
  const cells: [string, string, string | undefined][] = s ? [
    ['US · CA', s.us.text, s.us.note], ['UK · AU', s.uk.text, s.uk.note], ['EU · ISO', s.eu.text, s.eu.note],
    ['JP · CN', s.jp.text, s.jp.note], ['India', s.in.text, s.in.note],
    [units === 'imperial' ? 'Around, in' : 'Around, mm', units === 'imperial' ? fixed(s.circ / 25.4, 2) : fixed(s.circ, 1), undefined],
  ] : [['US · CA', '–', undefined], ['UK · AU', '–', undefined], ['EU · ISO', '–', undefined], ['JP · CN', '–', undefined], ['India', '–', undefined], ['Around', '–', undefined]];
  return (
    <div className="sizes" aria-live="polite">
      {cells.map(([k, v, note], i) => (
        <div key={k} className={`size ${i === 0 ? 'first' : ''} ${i === 5 ? 'circ' : ''}`}>
          <small>{k}</small><b key={v} className="roll">{v}</b>{note && <em>{note === 'small' ? 'below chart' : 'above chart'}</em>}
        </div>
      ))}
    </div>
  );
}

export default function Ring() {
  const { save, set, settings, tap } = useApp();
  const g = save.ring;
  const ppm = save.cal.pxPerMm;
  const last = useRef(g.dia);
  const [stage, size] = useSize<HTMLDivElement>();
  const setDia = (d: number) => {
    const v = Math.round(Math.min(RING_MAX_MM, Math.max(RING_MIN_MM, d)) * 10) / 10;
    if (Math.floor(v) !== Math.floor(last.current)) detent(settings.sound);
    last.current = v;
    set((s) => ({ ...s, ring: { ...s.ring, dia: v } }));
  };
  const parsed = parseCircumference(g.circText, g.circUnit);
  const sizes = g.mode === 'ring' ? sizesFor(g.dia) : parsed.ok ? sizesFor(diameterFromCirc(parsed.mm)) : null;
  const stageH = Math.round(Math.min(300, Math.max(160, RING_MAX_MM * ppm + 40)));
  const dPx = g.dia * ppm;
  const H = size.h || stageH;
  const inch = settings.units === 'imperial';

  return (
    <div className="page-scroll ring-page">
      <Segmented label="Ring mode" value={g.mode} onChange={(v) => { tap(); set((s) => ({ ...s, ring: { ...s.ring, mode: v } })); }}
        options={[{ v: 'ring', label: <><Icon name="ring" size={18} />Ring on screen</> }, { v: 'finger', label: <><Icon name="string" size={18} />Finger</> }]} />
      {g.mode === 'ring' ? (
        <>
          <div className="ring-stage mat" ref={stage} style={{ minHeight: stageH, ['--mm' as string]: `${ppm}px` }} data-testid="ring-stage">
            <div className="ring-badge"><CalBadge /></div>
            <svg className="ring-svg" width="100%" height={H} aria-hidden="true">
              <g transform={`translate(${size.w / 2} ${H / 2})`}>
                <circle r={dPx / 2} className="ring-circle" />
                <path d={`M${-dPx / 2 - 14} 0H${dPx / 2 + 14}M0 ${-dPx / 2 - 14}V${dPx / 2 + 14}`} className="ring-cross" />
                <path d={`M${-dPx / 2 + 1} 0l8 -3.5v7zM${dPx / 2 - 1} 0l-8 -3.5v7z`} className="ring-arrow" />
                <path d={`M${dPx * 0.354} ${-dPx * 0.354}l22 -22h34`} className="ring-leader" />
              </g>
            </svg>
            <div className="ring-label" style={{ left: Math.min(size.w / 2 + dPx * 0.354 + 26, size.w - 90), top: Math.max(6, H / 2 - dPx * 0.354 - 44) }}>
              <small>Ø inside</small><b>{inch ? `${fixed(g.dia / 25.4, 3)} in` : `${fixed(g.dia, 1)} mm`}</b>
            </div>
          </div>
          <div className="ring-adjust">
            <button className="icon-btn boxed" onClick={() => { tap(); setDia(g.dia - 0.1); }} disabled={g.dia <= RING_MIN_MM} aria-label="Smaller by 0.1 mm"><Icon name="minus" /></button>
            <input type="range" className="rule-range" min={RING_MIN_MM} max={RING_MAX_MM} step={0.1} value={g.dia} aria-label="Ring inside diameter"
              onChange={(e) => setDia(Number(e.target.value))} style={{ ['--p' as string]: (g.dia - RING_MIN_MM) / (RING_MAX_MM - RING_MIN_MM) }} />
            <button className="icon-btn boxed" onClick={() => { tap(); setDia(g.dia + 0.1); }} disabled={g.dia >= RING_MAX_MM} aria-label="Bigger by 0.1 mm"><Icon name="plus" /></button>
          </div>
          <p className="ring-tip">Lay a ring flat on the circle and resize until the yellow line just touches the <b>inside</b> edge all round.</p>
        </>
      ) : (
        <div className="finger">
          <svg viewBox="0 0 300 96" className="finger-art" aria-hidden="true">
            <path d="M8 30h104a18 18 0 0 1 0 36H8" className="fa-finger" />
            <path d="M112 36a10 10 0 0 1 0 24" className="fa-nail" />
            <ellipse cx="46" cy="48" rx="6" ry="21" className="fa-string" />
            <path d="M46 22v-8" className="fa-mark" />
            <path d="M148 48h18M160 42l6 6-6 6" className="fa-arrow" />
            <path d="M184 60h108" className="fa-strip" />
            <path d="M184 52v16M292 52v16" className="fa-mark" />
            <path d="M184 34h108M184 34l7-3.5v7zM292 34l-7-3.5v7z" className="fa-dim" />
            <text x="238" y="24" className="fa-t">length round</text>
          </svg>
          <ol className="steps">
            <li>Wrap a thin strip of paper or string round the base of the finger.</li>
            <li>Mark where it meets, unwrap it and measure it on the Ruler tab.</li>
            <li>Type the length here.</li>
          </ol>
          <label className="field-in">
            <span>Length round the finger</span>
            <div className="in-row">
              <input inputMode="decimal" value={g.circText} placeholder={g.circUnit === 'mm' ? '54.5' : g.circUnit === 'cm' ? '5.45' : '2.15'} aria-label="Length round the finger"
                aria-invalid={!!g.circText && !parsed.ok}
                onChange={(e) => { const t = e.target.value.replace(/[^\d.,]/g, '').slice(0, 8); set((s) => ({ ...s, ring: { ...s.ring, circText: t } })); }} />
              <Segmented small label="Length unit" value={g.circUnit} onChange={(v) => { tap(); set((s) => ({ ...s, ring: { ...s.ring, circUnit: v } })); }}
                options={[{ v: 'mm', label: 'mm' }, { v: 'cm', label: 'cm' }, { v: 'in', label: 'in' }]} />
            </div>
            {g.circText && !parsed.ok && <em className="field-err">{parsed.reason}</em>}
            {parsed.ok && <em className="field-ok">Inside diameter {inch ? `${fixed(diameterFromCirc(parsed.mm) / 25.4, 3)} in` : `${fixed(diameterFromCirc(parsed.mm), 1)} mm`}</em>}
          </label>
        </div>
      )}
      <SizeGrid s={sizes} units={settings.units} />
    </div>
  );
}
