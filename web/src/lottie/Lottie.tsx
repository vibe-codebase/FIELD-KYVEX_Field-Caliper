/** The Lottie player: the light SVG build, playing only while visible and the app is in front; a still frame under reduce motion. */
import { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import { SCENES, type Palette, type SceneId } from './scenes';
import { reduced } from '../ui/kit';

type Item = { play: () => void; pause: () => void };
const live = new Set<Item>();
let background = false;
/** Called by the app on native.lifecycle. */
export function setBackground(bg: boolean) {
  background = bg;
  live.forEach((x) => (bg ? x.pause() : x.play()));
}

/** Reads the theme tokens so the animation is drawn in the current palette. */
export function palette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, d: string) => {
    const x = cs.getPropertyValue(n).trim();
    return /^#[0-9a-f]{6}$/i.test(x) ? x : d;
  };
  return {
    tool: v('--tool', '#ffcc1a'), onTool: v('--on-tool', '#111111'), ink: v('--ink', '#eef0f2'), ink2: v('--ink-2', '#a8b0b9'),
    measure: v('--measure', '#3fd0ff'), panel: v('--panel', '#272c32'), grid: v('--grid', '#2b3036'), ok: v('--ok', '#4ade80'),
  };
}

export default function Lottie({ scene, loop = true, still, className, theme, label }: { scene: SceneId; loop?: boolean; still?: boolean; className?: string; theme: string; label?: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const data = SCENES[scene](palette());
    // reduce motion (the in-app toggle or the system setting) shows one still frame
    const frozen = still || reduced();
    const a = lottie.loadAnimation({ container: el, renderer: 'svg', loop, autoplay: false, animationData: data, rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: false } });
    let visible = false;
    const item: Item = {
      play: () => { if (visible && !background && !frozen) a.play(); },
      pause: () => a.pause(),
    };
    // a still frame that shows the whole idea: the end of a one-shot, the middle of a loop
    if (frozen) a.goToAndStop(loop ? Math.round(data.op * 0.45) : data.op - 1, true);
    live.add(item);
    const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) item.play(); else item.pause(); }, { threshold: 0.2 });
    io.observe(el);
    return () => { io.disconnect(); live.delete(item); a.destroy(); };
  }, [scene, loop, still, theme]);
  return <div ref={box} className={`lottie ${className ?? ''}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} data-lottie={scene} />;
}
