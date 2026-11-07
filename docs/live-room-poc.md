# Play the live room PoC

The room opens to the mineral veil, a field of light with no visible controls. Start with replay to see the same phrase in all three conditions. A MIDI keyboard and your usual instrument or synth are needed to hear your own playing.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/room/` in desktop Chrome, using the port Vite prints. Press **Esc** for setup or open `/room/?setup=1` directly. Keyboard navigation can also reveal the Room setup button.

| Condition | What happens |
| --- | --- |
| A · Drifting on its own | The field moves on its own while you play. |
| B · Responding to gesture | Strike, register and held notes influence the same field. |
| C · Gesture and reflection | B's field plus an occasional reflection. In silent replay the reflection is timed to the second pass. In live MIDI a facilitator can offer it with **R**. |

Choose **Play my keyboard**, then **Connect MIDI**, select an input if needed, and enter the room. Replay is silent. In replay, choose a new condition in setup to start the phrase again. With your keyboard, use the same sound and repeat a motif you enjoy under each condition. In C, use **R** at a moment when the phrase really has repeated over a different bass. Note what you play after the cue and whether it earned your attention.

## Physical rig and first session

1. Record browser and OS, refresh rate, viewport, sound route and which MIDI input is selected. Check that your instrument or DAW still sounds while the room listens.
2. Try a soft and hard strike, a pedal-held note, releasing the pedal, unplugging while a note is held, reconnecting, and leaving and returning to the tab. A disconnect should return to setup and leave replay available.
3. For the technical check, use `/room/?setup=1&lab=1` in the development server. Keep each condition foregrounded for two minutes at a documented 60 Hz. In B and C, play at least 100 note onsets and run `window.__roomLab.stats()` in the browser console before leaving the condition. Compare frame cadence across A, B and C. Compare input handler to draw-submission delay in B and C. Coalesced strikes and pending strikes are reported separately. The browser measurement excludes physical key travel and display output.
4. For the playing comparison, note the condition order, which variation you wanted to keep, whether you glanced at the screen, and what you played after any cue. On a later run, change the condition order to help separate the effect from warming up.

## Development checks

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:room
node tools/live-room-note-probe.ts
```

To use an installed Chrome instead of downloading Chromium, set `ROOM_CHROME_PATH` to its executable when running `npm run test:room`. The browser suite binds two local loopback ports. It tests the built chord page and room under the Pages-style project subpath, plus the development room with replay, a mock MIDI input and forced WebGL fallback. Playwright saves traces on failure.

The development-only lab can sample the same frame in each condition and show real parser readings from supplied chord annotations:

```js
window.__roomLab.start('C', 'chords')
window.__roomLab.sampleAt(4000).analysis
```

The annotated fixture is distinct from the melody-first replay. The parser's output stays in the lab. See the [synthetic live-note probe](../experiments/live-room-note-evidence.spike.md) for why the automatic cue still needs the player's annotated examples.

## Build record · 7 November 2026

- The agent build started from `405b62c`. Three separate work packets delivered the WebGL field, MIDI lifecycle and deterministic replay. A parser worker connected annotated replay and ran the synthetic preflight. An independent agent reviewed the assembled behavior.
- In Chrome at 960 × 640, fixed frames from the same replay made the veil's fold easier to track between the idle field, a soft strike, a hard strike and rest. The diffuse basin is available in the dev lab with `?lab=1&treatment=basin` for further comparison. A short real-time capture confirmed the reflection appears and recedes.
- The fixed chord fixture ranks A minor first at 400 ms and C major first at 4000 ms. The public room stays quiet at both points. The motif fixture's facilitated reflection lasts from 9000 ms up to 11100 ms.
- Chrome exposed native Web MIDI on loopback, but the isolated headless session denied access. Browser tests used an injected MIDI port for permission and device behavior. Unit and browser verification are separate from physical playing. The real keyboard, usual sound route, and A/B/C playing comparison are still open. Until then, facilitated reflection is the supported C experience. The parser probe's player criterion remains unmeasured.

[Backlog and acceptance gates](superpowers/plans/2026-11-07-live-room-poc.md) · [Project memory](project-memory.md)
