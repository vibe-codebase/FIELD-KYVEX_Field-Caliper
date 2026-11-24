import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { haptic, onNative, toNative } from './bridge';
import { load, persist, type Save } from './lib/store';
import { suspendAudio } from './lib/sound';
import Lottie, { setBackground } from './lottie/Lottie';
import { Icon, Mark } from './ui/icons';
import { AppCtx, Primary, Sheet, useApp, useBack, type AppApi, type Haptic, type Page } from './ui/kit';
import Ruler from './screens/Ruler';
import Protractor from './screens/Protractor';
import Level from './screens/Level';
import Ring from './screens/Ring';
import Settings, { THEMES } from './screens/Settings';
import About from './screens/About';
import { APP } from './app-info';
import Calibrate from './screens/Calibrate';
import Welcome from './screens/Welcome';
import { HELP } from './screens/help';

const TABS: { id: Page; label: string; icon: string }[] = [
  { id: 'ruler', label: 'Ruler', icon: 'ruler' },
  { id: 'protractor', label: 'Angle', icon: 'protractor' },
  { id: 'level', label: 'Level', icon: 'level' },
  { id: 'ring', label: 'Ring', icon: 'ring' },
];
const TITLES: Record<Page, string> = { ruler: APP.name, protractor: 'Protractor', level: 'Level', ring: 'Ring size', settings: 'Settings', about: 'About' };
const ORDER: Record<Page, number> = { ruler: 0, protractor: 1, level: 2, ring: 3, settings: 4, about: 5 };
type Confirm = { title: string; body: string; action: string; danger?: boolean; onYes: () => void };
type Toast = { text: string; n: number; undo?: () => void };

export default function App() {
  const [save, setSave] = useState<Save>(load);
  const [page, setPage] = useState<Page>('ruler');
  const [tab, setTab] = useState<Page>('ruler');
  const [dir, setDir] = useState(1);
  const [ask, setAsk] = useState<Confirm | null>(null);
  const [toastMsg, setToast] = useState<Toast | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(() => !load().tourDone);
  const [party, setParty] = useState(0);
  const backs = useRef<(() => void)[]>([]);
  const ref = useRef(save); ref.current = save;
  const settings = save.settings;

  useEffect(() => { const t = setTimeout(() => persist(save), 250); return () => clearTimeout(t); }, [save]);
  useEffect(() => {
    const t = THEMES.find((x) => x.id === settings.theme) ?? THEMES[0];
    document.documentElement.dataset.theme = t.id;
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.bg);
    toNative({ type: 'chrome', bg: t.bg, dark: t.dark });
  }, [settings.theme]);
  useEffect(() => { document.documentElement.dataset.motion = settings.reduceMotion ? 'reduce' : 'full'; }, [settings.reduceMotion]);

  const tap = useCallback((k: Haptic = 'light') => haptic(k, ref.current.settings.haptics), []);
  const toast = useCallback((text: string, undo?: () => void) => setToast((t) => ({ text, undo, n: (t?.n ?? 0) + 1 })), []);
  useEffect(() => { if (!toastMsg) return; const t = setTimeout(() => setToast(null), toastMsg.undo ? 4000 : 1900); return () => clearTimeout(t); }, [toastMsg]);
  useEffect(() => { if (!party) return; const t = setTimeout(() => setParty(0), 1700); return () => clearTimeout(t); }, [party]);
  const pushBack = useCallback((fn: () => void) => { backs.current.push(fn); return () => { backs.current = backs.current.filter((f) => f !== fn); }; }, []);
  const pageRef = useRef(page); pageRef.current = page;
  const tabRef = useRef(tab); tabRef.current = tab;
  const go = useCallback((p: Page) => {
    if (p === pageRef.current) return;
    setDir(ORDER[p] >= ORDER[pageRef.current] ? 1 : -1);
    setPage(p); if (p !== 'settings' && p !== 'about') setTab(p);
    setHelpOpen(false);
  }, []);

  useEffect(() => onNative((e) => {
    if (e.type === 'native.lifecycle') {
      if (e.state === 'background') { persist(ref.current); suspendAudio(); setBackground(true); } else setBackground(false);
      return;
    }
    const top = backs.current[backs.current.length - 1];
    if (top) { top(); return; }
    if (pageRef.current === 'about') { go('settings'); return; }
    if (pageRef.current === 'settings') go(tabRef.current);
    else if (pageRef.current !== 'ruler') go('ruler');
    else setAsk({ title: `Leave ${APP.name}?`, body: 'Your calibration and saved lengths stay on this phone.', action: 'Leave', danger: false, onYes: () => toNative({ type: 'exit' }) });
  }), [go]);

  const set = useCallback((fn: (s: Save) => Save) => setSave((s) => fn(s)), []);
  const api: AppApi = useMemo(() => ({
    save, settings, tap, go, pushBack, toast, set,
    confirm: (o) => { tap(); setAsk(o); },
    calibrate: () => setCalOpen(true),
    help: () => setHelpOpen(true),
    tour: () => setTourOpen(true),
    celebrate: () => setParty((n) => n + 1),
  }), [save, settings, tap, go, pushBack, toast, set]);

  const needsPrompt = save.tourDone && !tourOpen && !save.cal.prompted && !calOpen && (page === 'ruler' || page === 'ring');
  const Screen = { ruler: Ruler, protractor: Protractor, level: Level, ring: Ring, settings: Settings, about: About }[page];
  const ti = Math.max(0, TABS.findIndex((t) => t.id === tab));
  const help = HELP[page];

  return (
    <AppCtx.Provider value={api}>
      <div className="app">
        <header className="top">
          {(page === 'settings' || page === 'about')
            ? <button className="icon-btn" onClick={() => { tap(); go(page === 'about' ? 'settings' : tab); }} aria-label="Back"><Icon name="back" /></button>
            : <span className="mark"><Mark size={30} /></span>}
          <h1 key={page}>{TITLES[page]}</h1>
          <button className="icon-btn" onClick={() => { tap(); setHelpOpen(true); }} aria-label={`Help for ${TITLES[page]}`}><Icon name="help" /></button>
          {page !== 'settings' && page !== 'about' && <button className="icon-btn" onClick={() => { tap(); go('settings'); }} aria-label="Settings"><Icon name="settings" /></button>}
        </header>
        <main className="stage" key={page} data-dir={dir}><Screen /></main>
        {page !== 'settings' && page !== 'about' && (
          <nav className="tabs" style={{ ['--i' as string]: ti, ['--n' as string]: TABS.length }} aria-label="Tools">
            <span className="rule-ticks" aria-hidden="true" />
            <span className="rule-cursor" aria-hidden="true"><i /></span>
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => { if (tab !== t.id) tap(); go(t.id); }}>
                <Icon name={t.icon} size={22} /><span>{t.label}</span>
              </button>
            ))}
          </nav>
        )}
        {toastMsg && (
          <div className={`toast ${toastMsg.undo ? 'has-undo' : ''}`} key={`toast-${toastMsg.n}`} role="status">
            <span>{toastMsg.text}</span>
            {toastMsg.undo && <button onClick={() => { tap(); toastMsg.undo?.(); setToast(null); }}>Undo</button>}
          </div>
        )}
        {helpOpen && (
          <Sheet title={help.title} onClose={() => setHelpOpen(false)} className="help">
            <ol className="help-steps">{help.steps.map((s, n) => <li key={n} style={{ ['--k' as string]: n }}>{s}</li>)}</ol>
          </Sheet>
        )}
        {needsPrompt && <CalPrompt onLater={() => set((s) => ({ ...s, cal: { ...s.cal, prompted: true } }))} onGo={() => { set((s) => ({ ...s, cal: { ...s.cal, prompted: true } })); setCalOpen(true); }} />}
        {calOpen && <Calibrate onClose={() => setCalOpen(false)} />}
        {tourOpen && <Welcome onDone={() => { setTourOpen(false); set((s) => ({ ...s, tourDone: true })); }} />}
        {ask && <ConfirmCard c={ask} onClose={() => setAsk(null)} />}
        {party > 0 && (
          <div className="party" key={`party-${party}`} aria-live="polite">
            <div className="party-card"><Lottie scene="success" loop={false} theme={settings.theme} still={settings.reduceMotion} className="party-anim" /><b>Calibrated</b><small>Lengths are now exact on this screen</small></div>
          </div>
        )}
      </div>
    </AppCtx.Provider>
  );
}

function CalPrompt({ onLater, onGo }: { onLater: () => void; onGo: () => void }) {
  const { tap } = useApp();
  useBack(true, onLater);
  return (
    <div className="confirm-wrap">
      <div className="scrim" onClick={onLater} />
      <div className="confirm prompt" role="alertdialog" aria-label="Calibrate your screen">
        <span className="prompt-art" aria-hidden="true"><Icon name="card" size={30} /></span>
        <h3>Make every length exact</h3>
        <p>Readings use an estimate of your screen’s size for now. A one-minute check with any bank card makes them exact.</p>
        <div className="confirm-actions">
          <button className="ghost" onClick={() => { tap(); onLater(); }}>Not now</button>
          <Primary icon="card" onClick={() => { tap(); onGo(); }}>Calibrate</Primary>
        </div>
      </div>
    </div>
  );
}

function ConfirmCard({ c, onClose }: { c: Confirm; onClose: () => void }) {
  const { tap } = useApp();
  useBack(true, onClose);
  return (
    <div className="confirm-wrap">
      <div className="scrim" onClick={onClose} />
      <div className="confirm" role="alertdialog" aria-label={c.title}>
        <h3>{c.title}</h3><p>{c.body}</p>
        <div className="confirm-actions">
          <button className="ghost" onClick={() => { tap(); onClose(); }}>Cancel</button>
          <button className={c.danger === false ? 'primary' : 'danger-btn'} onClick={() => { tap('medium'); c.onYes(); onClose(); }}>{c.action}</button>
        </div>
      </div>
    </div>
  );
}
