/** Shared state and the drafting-table building blocks of Caliper. */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import type { Save, Settings } from '../lib/store';
import { Icon } from './icons';

export type Page = 'ruler' | 'protractor' | 'level' | 'ring' | 'settings' | 'about';
export type Haptic = 'light' | 'medium' | 'success' | 'warning';
export type AppApi = {
  save: Save;
  settings: Settings;
  set: (fn: (s: Save) => Save) => void;
  tap: (k?: Haptic) => void;
  go: (p: Page) => void;
  pushBack: (fn: () => void) => () => void;
  toast: (m: string, undo?: () => void) => void;
  confirm: (o: { title: string; body: string; action: string; onYes: () => void }) => void;
  calibrate: () => void;
  help: () => void;
  tour: () => void;
  celebrate: () => void;
};
export const AppCtx = createContext<AppApi>(null as never);
export const useApp = () => useContext(AppCtx);
/** Registers a close function on the Android back stack while `active`. */
export function useBack(active: boolean, close: () => void) {
  const { pushBack } = useApp();
  const ref = useRef(close);
  ref.current = close;
  useEffect(() => (active ? pushBack(() => ref.current()) : undefined), [active, pushBack]);
}

export function Toggle({ on, onChange, label, hint, icon }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string; icon?: string }) {
  return (
    <button className="row" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      {icon && <span className="row-ic"><Icon name={icon} /></span>}
      <span className="row-text"><b>{label}</b>{hint && <small>{hint}</small>}</span>
      <span className={`switch ${on ? 'on' : ''}`}><i /></span>
    </button>
  );
}

/** Segmented choice drawn as a short rule with a sliding cursor. */
export function Segmented<T extends string>({ value, options, onChange, label, small }: { value: T; options: { v: T; label: ReactNode }[]; onChange: (v: T) => void; label: string; small?: boolean }) {
  const i = Math.max(0, options.findIndex((o) => o.v === value));
  return (
    <div className={`seg ${small ? 'small' : ''}`} role="radiogroup" aria-label={label} style={{ ['--n' as string]: options.length, ['--i' as string]: i }}>
      <span className="seg-cursor" />
      {options.map((o) => <button key={o.v} role="radio" aria-checked={o.v === value} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>)}
    </div>
  );
}

/** The one big yellow action of a screen. */
export function Primary({ children, onClick, disabled, icon }: { children: ReactNode; onClick: () => void; disabled?: boolean; icon?: string }) {
  return <button className="primary" onClick={onClick} disabled={disabled}>{icon && <Icon name={icon} size={20} strokeWidth={2} />}<span>{children}</span></button>;
}
export function Tool({ children, onClick, icon, on, label, disabled }: { children?: ReactNode; onClick: () => void; icon: string; on?: boolean; label?: string; disabled?: boolean }) {
  return <button className={`tool ${on ? 'on' : ''}`} onClick={onClick} aria-label={label} aria-pressed={on} disabled={disabled}><Icon name={icon} size={20} />{children && <span>{children}</span>}</button>;
}

/** Calibrated / Estimated stamp shown on the measuring screens; tapping it opens calibration. */
export function CalBadge() {
  const { save, calibrate, tap } = useApp();
  const ok = save.cal.method !== 'estimate';
  return (
    <button className={`cal-badge ${ok ? 'ok' : ''}`} onClick={() => { tap(); calibrate(); }} aria-label={ok ? 'Calibrated. Tap to calibrate again' : 'Estimated. Tap to calibrate'}>
      <i />{ok ? 'Calibrated' : 'Estimated'}
    </button>
  );
}

export const reduced = () => document.documentElement.dataset.motion === 'reduce' || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Bottom sheet: springs up, closes with back, the scrim, the close button or a downward fling of its header. */
export function Sheet({ title, onClose, children, className }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const [closing, setClosing] = useState(false);
  const box = useRef<HTMLElement>(null);
  const drag = useRef<{ id: number; y0: number; dy: number; v: number; t: number; raf: number } | null>(null);
  const done = useRef(onClose); done.current = onClose;
  const close = useCallback(() => {
    setClosing((c) => { if (!c) setTimeout(() => done.current(), reduced() ? 60 : 200); return true; });
  }, []);
  useBack(!closing, close);
  const down = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { id: e.pointerId, y0: e.clientY, dy: 0, v: 0, t: performance.now(), raf: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (box.current) box.current.style.transition = 'none';
  };
  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const now = performance.now(), dy = Math.max(0, e.clientY - d.y0);
    d.v = 0.7 * d.v + 0.3 * ((dy - d.dy) / Math.max(1, now - d.t)); d.dy = dy; d.t = now;
    if (!d.raf) d.raf = requestAnimationFrame(() => { if (drag.current) drag.current.raf = 0; if (box.current) box.current.style.transform = `translateY(${d.dy}px)`; });
  };
  const up = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    drag.current = null; cancelAnimationFrame(d.raf);
    const el = box.current; if (!el) return;
    if (d.dy > 96 || (d.v > 0.55 && d.dy > 16)) {
      el.style.transition = 'transform .2s cubic-bezier(.4,0,1,1)'; el.style.transform = 'translateY(110%)'; close();
    } else {
      el.style.transition = 'transform .42s cubic-bezier(.2,1.25,.3,1)'; el.style.transform = '';
    }
  };
  return (
    <div className={`sheet-wrap ${closing ? 'closing' : ''}`}>
      <div className="scrim" onClick={close} />
      <section className={`sheet ${className ?? ''}`} role="dialog" aria-label={title} ref={box}>
        <header className="sheet-head" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <span className="grabber" aria-hidden="true" />
          <h2>{title}</h2>
          <button className="icon-btn" onClick={close} aria-label="Close"><Icon name="close" /></button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  );
}

/** A label above a group, written like a drawing's section callout. */
export function Callout({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return <div className="callout"><span className="callout-tag">{children}</span><span className="callout-rule" />{right}</div>;
}

/** Live size of an element (the measuring field), in CSS px. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const read = () => setSize((o) => (o.w === el.clientWidth && o.h === el.clientHeight ? o : { w: el.clientWidth, h: el.clientHeight }));
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Pointer moves coalesced to one update per animation frame: the drag follows the finger 1:1 without flooding React. */
export type Pt = { pointerId: number; clientX: number; clientY: number };
export function useRafMove(fn: (e: Pt) => void) {
  const latest = useRef<Pt | null>(null);
  const raf = useRef(0);
  const cb = useRef(fn); cb.current = fn;
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (e: Pt) => {
    latest.current = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY };
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => { raf.current = 0; const l = latest.current; if (l) cb.current(l); });
  };
}
