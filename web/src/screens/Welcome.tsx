import { APP } from '../app-info';
import { useRef, useState } from 'react';
import Lottie from '../lottie/Lottie';
import type { SceneId } from '../lottie/scenes';
import { Mark } from '../ui/icons';
import { Primary, useApp, useBack } from '../ui/kit';

const CARDS: { title: string; body: string; scene: SceneId; label: string }[] = [
  { title: 'A measuring kit in your pocket', body: 'Ruler, protractor, spirit level and ring sizer. Fully offline, nothing to sign up for.', scene: 'kit', label: 'A ruler, a protractor arm sweeping, a level bubble settling and a ring' },
  { title: 'Drag the yellow cursors', body: 'Lay the object along the ruler, cursor A at one end, and drag B to the other. The span reads out live.', scene: 'drag', label: 'Cursor B sliding down the ruler while the dimension line grows' },
  { title: 'Calibrate once, then it is exact', body: 'A bank card sets your screen’s true scale. Every screen has a ? for help, and the gear opens Settings.', scene: 'calibrate', label: 'A bank card landing on the yellow line and the cyan line meeting its edge' },
];

export default function Welcome({ onDone }: { onDone: () => void }) {
  const { tap, settings } = useApp();
  useBack(true, onDone);
  const track = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0); // fractional card position, follows the finger
  const i = Math.round(pos);
  const go = (n: number) => {
    const el = track.current; if (!el) return;
    el.scrollTo({ left: n * el.clientWidth, behavior: settings.reduceMotion ? 'auto' : 'smooth' });
  };
  const last = i === CARDS.length - 1;
  const still = settings.reduceMotion || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  return (
    <div className="welcome" role="dialog" aria-label={`Welcome to ${APP.name}`}>
      <header className="wl-head">
        <span className="wl-brand"><Mark size={28} /><b>{APP.name}</b></span>
        <button className="link-btn" onClick={() => { tap(); onDone(); }}>Skip</button>
      </header>
      <div className="wl-track" ref={track} onScroll={(e) => { const el = e.currentTarget; setPos(el.scrollLeft / Math.max(1, el.clientWidth)); }}>
        {CARDS.map((c, n) => (
          <section className="wl-card" key={c.title} aria-hidden={n !== i} style={{ ['--d' as string]: Math.max(-1, Math.min(1, n - pos)) }}>
            <div className="wl-art"><Lottie scene={c.scene} theme={settings.theme} still={still} label={c.label} /></div>
            <div className="wl-text">
              <h2>{c.title}</h2>
              <p>{c.body}</p>
            </div>
          </section>
        ))}
      </div>
      <footer className="wl-foot">
        <div className="wl-dots" role="tablist" aria-label="Tour cards">
          {CARDS.map((c, n) => (
            <button key={c.title} role="tab" aria-selected={n === i} aria-label={`Card ${n + 1} of 3`} onClick={() => { tap(); go(n); }}
              style={{ ['--on' as string]: Math.max(0, 1 - Math.abs(n - pos)) }}><i /></button>
          ))}
        </div>
        <Primary icon={last ? 'check' : undefined} onClick={() => { tap(); if (last) onDone(); else go(i + 1); }}>{last ? 'Start' : 'Next'}</Primary>
      </footer>
    </div>
  );
}
