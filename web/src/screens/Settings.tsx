import { defaults, type Settings as S, type ThemeId } from '../lib/store';
import { density } from '../lib/format';
import { Dim, Icon, Mark } from '../ui/icons';
import { APP } from '../app-info';
import { Callout, Segmented, Toggle, useApp } from '../ui/kit';

export const THEMES: { id: ThemeId; name: string; bg: string; grid: string; tool: string; ink: string; dark: boolean }[] = [
  { id: 'workshop', name: 'Workshop', bg: '#1f2328', grid: '#2b3036', tool: '#ffcc1a', ink: '#eef0f2', dark: true },
  { id: 'blueprint', name: 'Blueprint', bg: '#0f3a6b', grid: '#2a5c95', tool: '#ffd84a', ink: '#e8f1ff', dark: true },
  { id: 'paper', name: 'Paper', bg: '#f2f0ea', grid: '#dcd8cc', tool: '#e0a800', ink: '#1a1a1a', dark: false },
];

export default function Settings() {
  const { save, settings, set, tap, confirm, toast, calibrate, tour, go } = useApp();
  const upd = (p: Partial<S>) => { tap(); set((s) => ({ ...s, settings: { ...s.settings, ...p } })); };
  const offsets = save.level.flatX !== 0 || save.level.flatY !== 0 || save.level.edge !== 0;
  const cal = save.cal;
  return (
    <div className="page-scroll settings">
      <Callout>Calibration</Callout>
      <div className="card cal-card-set">
        <div className="cal-status">
          <span className={`cal-badge static ${cal.method !== 'estimate' ? 'ok' : ''}`}><i />{cal.method === 'estimate' ? 'Estimated' : cal.method === 'card' ? 'Calibrated · bank card' : 'Calibrated · known length'}</span>
          <b className="mono">{density(cal.pxPerMm)}</b>
          <small>{cal.method === 'estimate' ? 'Using the Android standard of 160 px per inch. Calibrate for exact lengths.' : 'Ruler and Ring use this measured screen density.'}</small>
        </div>
        <button className="row" onClick={() => { tap(); calibrate(); }}>
          <span className="row-ic"><Icon name="card" /></span>
          <span className="row-text"><b>{cal.method === 'estimate' ? 'Calibrate now' : 'Calibrate again'}</b><small>With a bank card or any object of known length</small></span>
          <Icon name="back" className="chev" size={18} />
        </button>
      </div>

      <Callout>Units</Callout>
      <div className="card pad">
        <Segmented label="Units" value={settings.units} onChange={(v) => upd({ units: v })}
          options={[{ v: 'metric', label: 'Metric · mm, cm' }, { v: 'imperial', label: 'Imperial · inches' }]} />
      </div>

      <Callout>Theme</Callout>
      <div className="themes">
        {THEMES.map((t) => (
          <button key={t.id} className={`theme ${settings.theme === t.id ? 'on' : ''}`} onClick={() => upd({ theme: t.id })} aria-pressed={settings.theme === t.id}
            style={{ background: `linear-gradient(${t.grid} 1px, transparent 1px) 0 0 / 10px 10px, linear-gradient(90deg, ${t.grid} 1px, transparent 1px) 0 0 / 10px 10px, ${t.bg}`, color: t.ink }}>
            <span className="th-tool" style={{ background: t.tool }} />
            <b>{t.name}</b>
            {settings.theme === t.id && <span className="th-check" style={{ background: t.tool }}><Icon name="check" size={14} strokeWidth={2.4} /></span>}
          </button>
        ))}
      </div>

      <Callout>Feedback</Callout>
      <div className="card">
        <Toggle icon="sound" on={settings.sound} onChange={(v) => upd({ sound: v })} label="Sounds" hint="Detent clicks while dragging, a chime at 0.0°" />
        <Toggle icon="vibrate" on={settings.haptics} onChange={(v) => upd({ haptics: v })} label="Vibration" hint="A light tick for each cm or inch" />
        <Toggle icon="motion" on={settings.reduceMotion} onChange={(v) => upd({ reduceMotion: v })} label="Reduce motion" hint="Steadier transitions and tour" />
      </div>

      <Callout>Level</Callout>
      <div className="card">
        <button className="row" disabled={!offsets} onClick={() => {
          const before = save.level;
          set((s) => ({ ...s, level: { ...s.level, flatX: 0, flatY: 0, edge: 0 } })); tap();
          toast('Level zero reset', () => set((s) => ({ ...s, level: before })));
        }}>
          <span className="row-ic"><Icon name="target" /></span>
          <span className="row-text"><b>Reset level zero</b><small>{offsets ? 'Forget the surface you zeroed on' : 'No offset set'}</small></span>
        </button>
      </div>

      <Callout>More</Callout>
      <div className="card">
        <button className="row" onClick={() => { tap(); tour(); }}>
          <span className="row-ic"><Icon name="tour" /></span>
          <span className="row-text"><b>Show the welcome tour</b><small>Three cards on how {APP.name} works</small></span>
        </button>
        <button className="row" onClick={() => { tap(); go('about'); }}>
          <span className="row-ic"><Icon name="help" /></span>
          <span className="row-text"><b>About and privacy</b><small>Version, maker and the privacy policy</small></span>
        </button>
        <button className="row danger" onClick={() => confirm({
          title: `Reset ${APP.name}?`, body: 'Calibration, level zero, ruler totals and settings all go back to the start.', action: 'Reset',
          onYes: () => { set(() => ({ ...defaults(), tourDone: true, cal: { ...defaults().cal, prompted: true } })); toast('Everything reset'); },
        })}>
          <span className="row-ic"><Icon name="trash" /></span>
          <span className="row-text"><b>Reset everything</b><small>Calibration, offsets, totals and settings</small></span>
        </button>
      </div>

      <div className="about">
        <Dim label={`${APP.name} ${APP.version}`} />
        <Mark size={48} />
        <p>Ruler, protractor, spirit level and ring sizer. Works offline. No ads, no tracking, no account.</p>
      </div>
    </div>
  );
}
