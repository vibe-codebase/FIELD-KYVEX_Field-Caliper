# Field Caliper

By **FIELD KYVEX** · package `com.fieldkyvex.fieldcaliper` · Expo owner `mini55`.

Your phone as a ruler, protractor and spirit level, plus a ring sizer. Fully offline, drawn like a drafting table: a cutting-mat grid in true millimetres, safety-yellow tools and a steel-rule tab bar.

## Screens
1. **Ruler.** A yellow ruler runs down the left edge in mm/cm or inches to 1/16. Drag cursors A and B (touch anywhere: the nearer cursor follows) and the span reads out live, for example "42.5 mm · 1 11/16 in · 4.25 cm", with a detent click at every whole cm or inch. Hold freezes the reading. For things longer than the screen, Add puts the span on a running total, part by part, with Undo.
2. **Protractor.** A half or full circle protractor with two draggable arms. Shows the angle to 0.1°, its supplement and the reflex angle. Snap 1° locks the arms to whole degrees.
3. **Level.** A spirit level from the phone's tilt sensor: a bullseye when the phone lies flat, a tube when it stands on any of its four edges (Auto, or lock Flat or Edge). The bubble is smoothed, turns green within ±0.5° and chimes at 0.0°. Hold freezes it; Zero sets the current surface as level (stored, reset in Settings). Without a sensor it says so plainly.
4. **Ring.** Lay a ring on a circle and size it with the slider and ±0.1 mm buttons, or type the length of string that went round a finger (mm, cm or in). Gives US/CA, UK/AU letters, EU/ISO, JP/CN and Indian sizes.
5. **Settings.** Calibration (bank card or any known length, with the current px/mm), metric or imperial, themes (Workshop, Blueprint, Paper), sounds, vibration, reduce motion, reset level zero, the welcome tour, and reset everything (with a confirm card).

First launch shows a three-card welcome tour with its own Lottie animations, then offers calibration. Every screen has a `?` help sheet. Android back closes the top sheet, then leaves Settings, then returns to the Ruler, then asks before leaving the app.

## Calibration
CSS pixels are not millimetres. Until calibrated, Field Caliper uses Android's 160 px per inch and says "Estimated". Calibrating matches a line to the short side of any ISO/IEC 7810 bank or ID card (53.98 mm) laid across the screen, or to any object of a typed length. Results outside 3–12 px/mm (impossible for a phone screen) are refused with a reason.

## How correctness is proven
- `web/src/lib/caliper.test.ts`, 35 Vitest tests: px↔mm with the 160 dpi estimate and card calibration, bounds on absurd calibrations, inch fractions to the nearest 1/16 (reduced, negative, huge), span readouts, ruler tick layout, detent boundaries, slide totals, protractor angles across the 0/360 seam with supplement, reflex, snapping and half-circle clamping, level maths (beta/gamma to the up vector, flat vs edge with a dead band, per-axis tilt, all four edges, a rate-independent low-pass filter, offsets), ring sizes against chart rows (US 7 ≈ 17.3 mm = UK N = EU 54 = JP 14 = IN 14, and more), circumference parsing, save parsing (corrupt JSON, wrong types, too-new version, absurd calibration, oversized input), and validation of every generated Lottie in two palettes.
- `web/tools/flows.mjs`, 10 Playwright user journeys (114 checks) against the built app, listed below.
- `web/tools/shots.mjs`: every screen, sheet and state in all three themes at 390×844, 360×640 and 300×650, failing on page errors, remote requests, overflow or an unpainted Lottie.

## Verified
| Feature | Proven by |
| --- | --- |
| Welcome tour shows once, Lotties paint, Next / Start | flow "first launch" |
| Calibration prompt once, Not now remembered | flow "first launch" |
| Ruler drag readout (30.0 mm), inches (1 3/16), Hold freezes, Add / Undo / Clear total, persistence | flow "ruler" |
| Known-length and bank-card calibration change px/mm exactly; ruler tick spacing follows; impossible length explained; Use estimate | flow "calibration", tests "calibration and conversion" |
| Protractor arms, supplement and reflex, snap 1°, full circle, persistence | flow "protractor", tests "protractor" |
| Level no-sensor state, live reading, Zero with Undo, Hold, auto edge mode, Flat lock, Settings reset of zero | flow "level", tests "level" |
| Ring sizes from the circle and from a finger length, 0.1 mm steps, slider limit, inline validation, cm input, persistence | flow "ring", tests "ring sizes" |
| Themes (data-theme, theme-color, system bar message), units, sound, vibration on/off (haptics sent or not), reduce motion, tour reopen, reset with confirm and cancel | flow "settings" |
| Help sheet on every screen, close button and drag-down dismiss | flow "help sheets" |
| Android back: sheet, calibration, confirm, settings, tab, exit; save on background | flow "android back button" |
| Corrupt or hostile saves load as defaults | flow "corrupt save", tests "save parsing" |
| Lottie JSON valid (keys, op > ip, finite keys, colours 0–1, seamless loops) | tests "lottie animations" |

Fonts are Red Hat Display and Red Hat Mono, bundled with `@fontsource`. The only other runtime dependency is `lottie-web` 5.13.0 (light SVG player); every animation is generated in `web/src/lottie/`.

## Identity, About and privacy
- The app name, version and company come from `app.json` (`expo.name`, `expo.version`, `expo.extra.company`). The header, welcome tour, About page, confirm cards and store art all read them, so a rename needs no code change.
- Settings → About and privacy shows the name, version and maker, and the full privacy policy, readable offline.
- Android back on the first screen asks before leaving the app.
- The welcome tour, empty states and celebrations are Lottie scenes generated in code from the theme palette (`web/src/lottie/`). Reduce motion swaps them for still frames.
