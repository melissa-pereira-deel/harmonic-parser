# Play the live room PoC

The room opens to an animated field of light. Use Node.js 24 and desktop Chrome for the steps below.

```sh
npm ci
npm run dev
```

Open [room setup](http://localhost:5173/room/?setup=1) using the port Vite prints. Press **Esc** to return to setup from the room.

1. Choose **C · Gesture and harmony**, select **Replay a chord progression**, and click **Enter room**. The replay is silent. Watch **Chord** change through **Am → F → G → C**. The last chord should show **Possible key C major** and **Try next F**. The readout clears after the phrase.
2. For live playing, press **Esc**, select **Play my keyboard**, and click **Connect MIDI**. Select **Arturia KeyLab Essential 49 MIDI In**, or the equivalent playing port for your controller. Click **Enter room** and use your usual instrument or synth for sound.
3. Hold **C–E–G**, then **F–A–C**, then **G–B–D**. Hold each group together briefly. You should see **C → F → G**. On **G**, expect **Possible key C major** and **Try next C**.

| Condition | What happens |
| --- | --- |
| A · Drifting on its own | The field moves on its own while you play. |
| B · Responding to gesture | Strike, register and held notes influence the same field. |
| C · Gesture and harmony | B's field plus a small harmony readout for live MIDI and the chord replay. The original phrase replay still offers its timed reflection. |

The readout names familiar voicings, including inversions. A short run of single notes can leave the readout quiet. The key and suggestion are provisional readings of the recent progression.

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

The annotated fixture is distinct from the melody-first replay. The lab still exposes rankings from its supplied annotations. The visible harmony readout uses the MIDI note events in that fixture. See the [synthetic live-note probe](../experiments/live-room-note-evidence.spike.md) for why the experimental readout waits for recognizable chords.

## Build record · 7 November 2026

- The agent build started from `405b62c`. Three separate work packets delivered the WebGL field, MIDI lifecycle and deterministic replay. A parser worker connected annotated replay and ran the synthetic preflight. An independent agent reviewed the assembled behavior.
- In Chrome at 960 × 640, fixed frames from the same replay made the veil's fold easier to track between the idle field, a soft strike, a hard strike and rest. The diffuse basin is available in the dev lab with `?lab=1&treatment=basin` for further comparison. A short real-time capture confirmed the reflection appears and recedes.
- The fixed chord fixture ranks A minor first at 400 ms and C major first at 4000 ms. These readings were initially visible in the lab. The motif fixture's facilitated reflection lasts from 9000 ms up to 11100 ms.
- Browser tests used a simulated MIDI port for permission and device behavior. The player later confirmed that the KeyLab drives the field. The harmony readout and sound route are ready for the physical playing check.

[Design system](design-system.md) · [Backlog and acceptance gates](superpowers/plans/2026-11-07-live-room-poc.md) · [Project memory](project-memory.md)
