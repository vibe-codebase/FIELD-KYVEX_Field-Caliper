/** Caliper's icons: drafting-pen strokes, 1.8 wide, square caps and mitred corners on a 24 grid. */
const P: Record<string, string> = {
  ruler: 'M3 17.5 17.5 3 21 6.5 6.5 21zM7 13.5l2 2M9.5 11l1.5 1.5M12 8.5l2 2M14.5 6l1.5 1.5',
  protractor: 'M3 18h18M5 18a7 7 0 0 1 14 0M12 18 16.5 9.5M12 18V8M8.5 14.2l-1.2-1M15.5 14.2l1.2-1',
  level: 'M2.5 9h19v6h-19zM9.5 9v6M14.5 9v6M12 12h.01',
  ring: 'M12 21a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM12 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM9 6l3-3 3 3',
  settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  help: 'M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19zM9.3 9.3a2.8 2.8 0 1 1 4 2.5c-.9.5-1.3 1.1-1.3 2v.7M12 17.4h.01',
  back: 'M15 4.5 7.5 12l7.5 7.5', close: 'M5.5 5.5l13 13M18.5 5.5l-13 13', check: 'M4.5 12.5l4.5 4.5 10.5-10.5',
  plus: 'M12 4.5v15M4.5 12h15', minus: 'M4.5 12h15',
  lock: 'M5 11h14v10H5zM8 11V7.5a4 4 0 0 1 8 0V11M12 15v2.5',
  unlock: 'M5 11h14v10H5zM8 11V7.5a4 4 0 0 1 7.7-1.5M12 15v2.5',
  hold: 'M8 5v14M16 5v14',
  slide: 'M3 15h12v5H3zM6 15v2M9 15v2M12 15v2M18 7v8M14 11h8M15 4h-3',
  card: 'M2.5 6h19v12h-19zM2.5 10h19M6 14.5h4',
  target: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 1.5V6M12 18v4.5M1.5 12H6M18 12h4.5',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13.5h10L18 7M9 7V3.5h6V7',
  tour: 'M4 4h16v13H9l-5 4zM9 10.5h6M12 7.5v6',
  sound: 'M4 9h4l5-4.5v15L8 15H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  vibrate: 'M8 3h8v18H8zM4.5 8v8M19.5 8v8M2 10.5v3M22 10.5v3',
  motion: 'M3 12h4l2-5 3 10 3-8 2 3h4',
  units: 'M3 8h14l-3-3M21 16H7l3 3',
  string: 'M4 15c3-5 5 3 8-2s5-3 8 1M4 15v.01M20 14v.01',
  finger: 'M9 21V9.5a2 2 0 0 1 4 0V13l4.5 1a2 2 0 0 1 1.5 2.3L18 21',
};
export function Icon({ name, size = 22, className, strokeWidth = 1.8 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d={P[name] ?? P.ruler} />
    </svg>
  );
}

/** The Caliper mark: a yellow drafting square with engraved ticks along its inner edges. */
export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M4 3h8v17h17v8H4z" fill="var(--tool)" />
      <path d="M12 6h-3M12 9h-2M12 12h-3M12 15h-2M12 18h-3M15 20v-3M18 20v-2M21 20v-3M24 20v-2M27 20v-3" stroke="var(--on-tool)" strokeWidth="1.3" />
      <circle cx="8" cy="24" r="1.6" fill="var(--on-tool)" />
    </svg>
  );
}

/** A dimension line used as a divider: |←  label  →|. */
export function Dim({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={`dim ${className ?? ''}`} aria-hidden={label ? undefined : true}>
      <svg className="dim-end" width="10" height="14" viewBox="0 0 10 14"><path d="M1 0v14M1 7l8-3.5v7z" /></svg>
      <span className="dim-line" />
      {label && <span className="dim-label">{label}</span>}
      <span className="dim-line" />
      <svg className="dim-end r" width="10" height="14" viewBox="0 0 10 14"><path d="M9 0v14M9 7 1 3.5v7z" /></svg>
    </div>
  );
}
