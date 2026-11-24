import { AboutPage, policy } from '../ui/AboutPage';
import { Mark } from '../ui/icons';
import { useApp } from '../ui/kit';

/** About and privacy: name, version and maker from app.json, and the policy, readable offline. */
export default function About() {
  const { tap } = useApp();
  return (
    <div className="page-scroll about-scroll">
      <AboutPage mark={<Mark size={76} />} onTop={() => tap()}
        pills={['No data collected', 'Works offline', 'No ads']}
        what="A ruler you can calibrate to your screen, a protractor, a spirit level and a ring sizer. Readings are as accurate as your calibration; for anything critical, check with a physical tool."
        sections={policy('Your calibration, level zero, ruler totals and settings.', [], 'Vibration only, for a tap when the level reads true. You can turn it off in Settings. The spirit level reads the phone’s motion sensor on the phone itself; nothing is recorded or sent.')} />
    </div>
  );
}
