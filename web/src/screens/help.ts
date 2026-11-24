import { APP } from '../app-info';
import type { Page } from '../ui/kit';

/** The short help sheet behind each screen's ? button. */
export const HELP: Record<Page, { title: string; steps: string[] }> = {
  ruler: {
    title: 'Using the ruler',
    steps: [
      'Lay the object along the yellow ruler on the left, one end on cursor A.',
      'Drag cursor B to the other end. Touch anywhere in the grid: the nearer cursor follows your finger, clicking at every cm or inch.',
      'Hold freezes the reading so you can lift the object and read it.',
      'Longer than the screen? Measure a part, tap Add, move the phone on so A sits where B was, and measure again. The total adds up.',
      'The badge says Estimated until you calibrate. Tap it to calibrate with a bank card.',
    ],
  },
  protractor: {
    title: 'Using the protractor',
    steps: [
      'Lay the object on the screen with its corner on the yellow dot at the centre of the scale.',
      'Drag arm A along one edge and arm B along the other. Touch anywhere: the nearer arm follows.',
      'The big number is the angle between the arms. The supplement (180° minus it) and the reflex angle sit beside it.',
      'Snap 1° locks the arms to whole degrees. Full turns the half circle into a full 360° dial.',
      'For a wall or table edge, hold the phone’s bottom edge flat against one side and turn arm B to match the other.',
    ],
  },
  level: {
    title: 'Using the level',
    steps: [
      'Lay the phone flat for the bullseye, or stand it on an edge for the tube. Auto switches by itself; Flat and Edge lock one mode.',
      'The bubble floats to the high side, just like a real spirit level. The reading turns green within ±0.5°.',
      'Hold freezes the reading. Zero sets the current surface as level, handy when a phone case or camera bump tilts it; reset it in Settings.',
      'Keep the phone still for a second: readings are smoothed for a steady bubble.',
    ],
  },
  ring: {
    title: 'Finding a ring size',
    steps: [
      'Ring on screen: lay a ring that fits flat on the circle. Use the slider and the − and + buttons until the yellow line just touches its inside edge.',
      'Finger: wrap a strip of paper round the base of the finger, mark it, measure it on the Ruler tab and type the length.',
      'Sizes appear for the US and Canada, the UK and Australia, the EU (ISO, the inside circumference in mm), Japan and China, and India.',
      'Calibrate first for the ring circle to be exact. Between sizes, pick the larger one, as knuckles do not shrink.',
    ],
  },
  about: { title: 'About', steps: ['This page shows the version and who made the app.', 'The privacy policy explains what the app keeps: only what you enter, and only on this phone.'] },
  settings: {
    title: 'Settings',
    steps: [
      'Calibration sets the true size of your screen. Redo it if readings look off or after changing display size in Android settings.',
      'Units switches every screen between millimetres and inches.',
      'Sounds and Vibration control the detent clicks and the level chime.',
      `Reset level zero forgets the surface you zeroed on. Reset everything starts ${APP.name} from new.`,
    ],
  },
};
