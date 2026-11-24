import type { ReactNode } from 'react';
import { APP } from '../app-info';

export type PolicySection = { h: string; p: string[] };
/** The privacy policy every tool shares: nothing collected, everything local. `keeps` names what this app stores. */
export function policy(keeps: string, extra: PolicySection[] = [], permission = 'Vibration only, for small taps you can feel on buttons. You can turn it off in Settings.'): PolicySection[] {
  return [
    { h: 'The short version', p: [`${APP.name} does not collect, send or share any personal data. Everything you enter stays in the app’s private storage on this phone.`] },
    { h: 'What the app keeps', p: [`${keeps} It is saved only on this device so the app remembers it between visits.`, 'You can delete it at any time in the app or with Reset in Settings. Uninstalling the app also removes it all.'] },
    { h: 'What the app does not do', p: ['It has no accounts, no ads, no analytics and no tracking. It does not ask for the internet permission, so it cannot send anything anywhere.', 'It does not use your location, camera, microphone, contacts or files.'] },
    { h: 'Permissions', p: [permission] },
    ...extra,
    { h: 'Children', p: [`${APP.name} is a general tool and is not aimed at children.`] },
    { h: 'Changes to this policy', p: ['If the policy ever changes, the new version ships inside an app update and on the store listing.'] },
  ];
}
/** About and privacy, readable offline: name, version and maker, what the app does, and the policy. */
export function AboutPage({ mark, what, sections, pills, onTop }: { mark: ReactNode; what: string; sections: PolicySection[]; pills: string[]; onTop: () => void }) {
  return (
    <div className="about-page">
      <section className="ab-hero">
        <span className="ab-mark">{mark}</span>
        <h2>{APP.name}</h2>
        <p>Version {APP.version}{APP.company ? ` · ${APP.company}` : ''}</p>
        <ul className="ab-pills">{pills.map((p) => <li key={p}>{p}</li>)}</ul>
      </section>
      <section className="ab-card">
        <h3>What it does</h3>
        <p>{what}</p>
        <p>Made by {APP.company || 'the developer'}.</p>
      </section>
      <section className="ab-card ab-policy" aria-label="Privacy policy">
        <h3>Privacy policy</h3>
        {sections.map((s) => (
          <div key={s.h} className="ab-sec"><h4>{s.h}</h4>{s.p.map((t, i) => <p key={i}>{t}</p>)}</div>
        ))}
      </section>
      <button className="ab-top" onClick={(e) => { onTop(); let el: HTMLElement | null = e.currentTarget.parentElement; while (el && el.scrollHeight <= el.clientHeight + 1) el = el.parentElement; el?.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top</button>
    </div>
  );
}
