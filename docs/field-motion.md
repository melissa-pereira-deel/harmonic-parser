# How the live room field moves

The room draws a new image from a mathematical field on each browser frame. Two independent inputs drive it. The **scene clock** moves the field through space, and the **playing session** sends gestures and phrase cues that change its shape and color. Each can be isolated in the development room.

## From pixels to motion

1. **Shape.** The shader evaluates two layers of 3D value noise at each pixel. Think of a plane moving through a volume filled with smooth variations. The coarse layer shapes broad clouds. The finer layer adds local variation. The two move in different directions, with the depth component doing most of the work of changing their shapes. The interpolation is smooth across the noise cells. [Renderer](../src/room/visual/renderer.ts) · [Ken Perlin on quintic interpolation](https://www.cs.cmu.edu/~jkh/462_s07/paper445.pdf)
2. **Fold and light.** The shader bends a broad band with the mixed noise and draws a narrow highlight along one contour of that band. The same noise also tints the body. The band and highlight are recreated from the field on each frame.
3. **Touch.** The most recent MIDI strike supplies velocity and register. Velocity adds a local bump and light pulse. Register moves its center, and held notes add sustained pressure. The screen eases toward these targets on each frame.
4. **Phrase.** Attack density and velocity feed a slower violet shift. A long enough gap in the recent rhythm or a recognized harmonic resolution feeds an amber shift. These change the material colors across the field over several seconds. [Session](../src/room/session.ts) · [Palette analysis](../src/room/analysis/mood.ts)
5. **Presentation.** The browser chooses when to draw. The scene clock is independent of replay and advances by at most 50 ms per draw. If the WebGL context drops, the room switches to its static CSS image until recovery. A frame gap or a fallback switch can produce a visible jump even when the shader is mathematically continuous. [Animation loop](../src/room/main.ts) · [Khronos context loss specification](https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/)

## What the Chrome probes reproduced

**The fold can split on its own.** We sampled 601 idle states across one minute in Chrome at 480 × 320. At the current warp of `0.85`, 153 snapshots had at least one sampled column where the bright contour crossed more than once. The first was at 2.9 s. At 5.1 s, the widest split crossed some columns three times. With warp at `0.425`, the same scan found no splits. This explains how the highlight can appear to divide, reverse or rejoin while the underlying noise remains continuous.

**A hard strike can shift a large part of the image in one frame.** The current 45 ms easing moves about 31% of the distance to a new impulse target in a 16.7 ms frame and 67% in a 50 ms frame. That impulse both pushes the fold and adds light. A controlled Chrome probe sent one maximum-velocity MIDI note at the same scene phase. The table measures the 99th percentile of absolute RGB change per sampled pixel, averaged across each pixel's three channels, on a 0–255 scale. The 50 ms frame was simulated.

| Condition | First frame after the strike at 16.7 ms | First frame after the strike at 50 ms |
| --- | ---: | ---: |
| Current | 19.0 | 34.0 |
| Gentle | 6.0 | 14.3 |

At steady 60 Hz, the largest per-frame 99th percentile in the idle scan was 1.0. The probes reproduce two ways the image can move abruptly. Matching either to the specific flick you saw requires a check on your browser and KeyLab.

## Controls to try

Enter the room with `lab=1` on the development server and open **Motion** in the top-right corner. Switch between **Current** and **Gentle** or adjust the sliders while playing. **Gentle** lowers warp and strike displacement and lengthens the attack. The controls ease toward the new values while keeping the scene's phase and the MIDI session. Click **Motion** again to collapse the panel.

The table also lists the URL parameters for setting the initial values. Edge width and direct light are available through the URL. Selecting a preset restores its full set of values.

| What you want to control | Parameter | Current | Gentle | Lab range and visible effect |
| --- | --- | ---: | ---: | --- |
| How fast the field evolves | `speed` | 1 | 1 | 0–2×. At 0 the noise phase holds still and the keys can still move and tint the field. |
| How far the fold bends | `warp` | 0.85 | 0.425 | 0–1. Higher values make deeper curves and allow the contour to split. |
| How much fine noise contributes | `detail` | 0.28 | 0.28 | 0–1. Higher values favor smaller features in the fold and body tint. |
| How broad the bright edge is | `edgeWidth` | 1 | 1 | 0.5–3×. Higher values spread the highlight across a wider band. |
| How far playing pushes the fold | `strike` | 1 | 0.5 | 0–1.5×. This scales displacement from strikes and held notes. |
| How much playing brightens the field | `light` | 1 | 1 | 0–1.5×. This scales the direct light pulse from strikes and held notes. |
| How quickly the initial pulse rises | `attack` | 45 ms | 110 ms | 25–250 ms. Higher values soften the onset and spread its change over more frames. |

Two choices sit behind the idea of a **chaos threshold**. Warp and detail set how irregular the field looks. If the design calls for a single uninterrupted crest, that is a geometric constraint. At each screen column, the fold value must increase as you move up through it. The current noise has a worst-case slope bound that keeps the idle fold increasing for warp below about `0.24` at the default detail mix. A higher warp may work for many scenes, as it did at `0.425` in this sample. A future design could enforce the slope constraint while keeping stronger color texture and bend. [Tuning values](../src/room/visual/tuning.ts)

## Try the same playing twice

1. Watch **A** at rest in Current and Gentle with Reduced Motion off. Check whether the bright band ever appears to divide or fold back on itself.
2. In **B**, connect **Arturia KeyLab Essential 49 MIDI In** and play one hard note, then repeat a short motif. Compare how the strike feels in each treatment and whether the slower response still feels attached to your hand.
3. If you see a jump in both, set **Speed** to zero in the panel to hold the noise phase still. A jump that follows a note in this view implicates the playing response. A full-screen flash or pause at rest points toward frame pacing, resizing or a renderer switch. Note whether a key was pressed, what part of the image moved, and whether the tab or window had just changed.

[Current motion](http://127.0.0.1:4320/room/?setup=1&lab=1) · [Gentle motion](http://127.0.0.1:4320/room/?setup=1&lab=1&motion=gentle) · [Hold the noise phase still](http://127.0.0.1:4320/room/?setup=1&lab=1&speed=0) · [KeyLab setup](live-room-poc.md#test-the-gradient-with-a-keylab)
