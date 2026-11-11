import { expect, test } from '@playwright/test';

async function openLab(page, suffix = '') {
  await page.goto(`/room/?lab=1${suffix}`);
  await page.waitForFunction(() => Boolean(window.__roomLab));
}

test('serves both built entries under a project subpath without the lab', async ({ page }) => {
  const project = 'http://127.0.0.1:4318/harmonic-parser/';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(project);
  await expect(page.locator('#progression')).toBeVisible();

  await page.goto(`${project}room/?lab=1`);
  await expect(page.getByRole('main', { name: 'Live playing room' })).toBeVisible();
  await expect(page.locator('#field')).toHaveAttribute('data-renderer', /^(webgl2|css)$/);
  await expect(page.getByRole('heading', { name: 'Live room' })).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('The room')).toBeFocused();
  await page.getByRole('button', { name: 'Enter room' }).click();
  await expect(page.getByRole('heading', { name: 'Live room' })).toBeHidden();
  await expect(page.locator('.motion-panel')).toHaveCount(0);
  expect(await page.evaluate(() => window.__roomLab)).toBeUndefined();
  expect(errors).toEqual([]);
});

test('replays A, B and C with identical art and an independent cue in C', async ({ page }) => {
  await openLab(page);

  const samples = await page.evaluate(() => {
    const snapshots = {};
    for (const condition of ['A', 'B', 'C']) {
      window.__roomLab.start(condition);
      snapshots[condition] = {
        beforeCue: window.__roomLab.sampleAt(2670),
        cueWindow: window.__roomLab.sampleAt(9000),
      };
    }
    return snapshots;
  });

  expect(samples.A.beforeCue.frame.impulse).toBe(0);
  expect(samples.A.beforeCue.frame.envelope).toBe(0);
  expect(samples.B.beforeCue.frame.impulse).toBeGreaterThan(0);
  expect(samples.B.beforeCue.frame).toEqual(samples.C.beforeCue.frame);
  expect(samples.B.cueWindow.frame).toEqual(samples.C.cueWindow.frame);
  expect(samples.A.cueWindow.cue).toBeNull();
  expect(samples.B.cueWindow.cue).toBeNull();
  expect(samples.C.cueWindow.cue.origin).toBe('facilitated');
  await expect(page.locator('#reflection')).toHaveText('Same phrase, different bass.');

  await page.evaluate(() => window.__roomLab.sampleAt(11100));
  await expect(page.locator('#reflection')).toBeEmpty();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('The room')).toBeFocused();
});

test('exposes real annotated parser rankings while keeping the room quiet', async ({ page }) => {
  await openLab(page);

  const result = await page.evaluate(() => {
    window.__roomLab.start('C', 'chords');
    return {
      before: window.__roomLab.sampleAt(399),
      one: window.__roomLab.sampleAt(400),
      last: window.__roomLab.sampleAt(4000),
    };
  });
  expect(result.before.analysis.candidates).toEqual([]);
  expect(result.one.analysis.quietReason).toMatch(/insufficient/);
  expect(result.last.analysis.origin).toBe('annotated-replay');
  expect(result.last.analysis.span).toEqual({ startMs: 400, endMs: 4000 });
  expect(result.last.analysis.candidates[0].name).toBe('C major');
  expect(result.last.analysis.candidates[0].score).toBeCloseTo(0.935, 3);
  await expect(page.locator('#reflection')).toBeEmpty();
});

test('keeps MIDI playing through live motion changes and recovers on disconnect', async ({ page }) => {
  await page.addInitScript(() => {
    const input = {
      id: 'keyboard',
      name: 'Mock keyboard',
      state: 'connected',
      onmidimessage: null,
      async open() {},
      async close() {},
    };
    const access = { inputs: new Map([[input.id, input]]), onstatechange: null };
    window.mockRequests = 0;
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async ({ sysex }) => {
        if (sysex) throw new Error('Unexpected SysEx request');
        window.mockRequests += 1;
        return access;
      },
    });
    let held = [];
    window.playMockChord = notes => {
      for (const note of held) input.onmidimessage?.({ data: new Uint8Array([0x80, note, 0]) });
      for (const note of notes) input.onmidimessage?.({ data: new Uint8Array([0x90, note, 110]) });
      held = notes;
    };
    window.disconnectMockKeyboard = () => {
      input.state = 'disconnected';
      access.onstatechange?.();
    };
  });

  await openLab(page, '&setup=1');
  await page.getByLabel('The room').selectOption('C');
  await page.getByLabel('Input', { exact: true }).selectOption('midi');
  expect(await page.evaluate(() => window.mockRequests)).toBe(0);
  await expect(page.getByRole('button', { name: 'Enter room' })).toBeDisabled();
  await page.getByRole('button', { name: 'Connect MIDI' }).click();
  await expect(page.getByText('Keyboard ready.')).toBeVisible();
  expect(await page.evaluate(() => window.mockRequests)).toBe(1);
  await page.getByRole('button', { name: 'Enter room' }).click();

  await page.evaluate(() => window.playMockChord([60]));
  await expect.poll(() => page.evaluate(() => window.__roomLab.stats().strikes)).toBe(1);
  await expect(page.locator('#harmony')).toBeHidden();
  await page.evaluate(() => window.playMockChord([60, 64, 67]));
  await expect(page.locator('#harmony-chord')).toHaveText('C');
  await expect(page.locator('#harmony-key-item')).toBeHidden();

  const readUniform = name => page.evaluate(name => {
    const gl = document.querySelector('#field').getContext('webgl2');
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    return gl.getUniform(program, gl.getUniformLocation(program, name));
  }, name);
  const phaseBefore = await readUniform('time');
  await page.getByText('Motion', { exact: true }).click();
  const current = page.getByRole('button', { name: 'Current' });
  const gentle = page.getByRole('button', { name: 'Gentle' });
  await expect(current).toHaveAttribute('aria-pressed', 'true');
  await gentle.click();
  await expect(gentle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('slider', { name: 'Strike attack' })).toHaveValue('110');
  await expect.poll(() => readUniform('strike')).toBe(0.5);
  expect(await readUniform('time')).toBeGreaterThan(phaseBefore);
  await expect(page.locator('#harmony-chord')).toHaveText('C');

  await page.getByRole('slider', { name: 'Warp' }).press('Home');
  await expect.poll(() => readUniform('warp')).toBe(0);
  await page.getByRole('slider', { name: 'Detail' }).press('End');
  await expect.poll(() => readUniform('detail')).toBe(1);
  await page.getByRole('slider', { name: 'Strike strength' }).press('Home');
  await expect.poll(() => readUniform('strike')).toBe(0);
  await page.getByRole('slider', { name: 'Speed' }).press('Home');
  await expect.poll(async () => {
    const before = await readUniform('time');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    return await readUniform('time') - before;
  }).toBe(0);
  await expect(gentle).toHaveAttribute('aria-pressed', 'false');
  const pausedPhase = await readUniform('time');
  await current.click();
  await expect.poll(() => readUniform('time')).toBeGreaterThan(pausedPhase);
  await expect.poll(() => readUniform('strike')).toBe(1);
  expect(await page.evaluate(() => window.mockRequests)).toBe(1);
  expect(await page.evaluate(() => window.__roomLab.stats().strikes)).toBe(4);

  await page.evaluate(() => window.playMockChord([53, 57, 60]));
  await expect(page.locator('#harmony-chord')).toHaveText('F');
  await page.evaluate(() => window.playMockChord([55, 59, 62]));
  await expect(page.locator('#harmony-chord')).toHaveText('G');
  await expect(page.locator('#harmony-key')).toHaveText('C major');
  await expect(page.locator('#harmony-next')).toHaveText('C');
  await page.keyboard.press('r');
  await expect(page.locator('#reflection')).toHaveText('Same phrase, different bass.');
  await expect(page.locator('#harmony')).toBeHidden();

  await page.evaluate(() => window.disconnectMockKeyboard());
  await expect(page.getByText('The MIDI input disconnected.', { exact: false })).toBeVisible();
  await expect(page.locator('#reflection')).toBeEmpty();
  await expect(page.locator('#harmony')).toBeHidden();
  await page.getByLabel('Input', { exact: true }).selectOption('replay');
  await expect(page.getByRole('button', { name: 'Enter room' })).toBeEnabled();
});

test('leaves replay available after MIDI permission denial', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async () => { throw new DOMException('Denied', 'NotAllowedError'); },
    });
  });

  await page.goto('/room/?setup=1');
  await page.getByLabel('Input', { exact: true }).selectOption('midi');
  await page.getByRole('button', { name: 'Connect MIDI' }).click();
  await expect(page.getByText('MIDI permission was denied.', { exact: false })).toBeVisible();
  await page.getByLabel('Input', { exact: true }).selectOption('replay');
  await page.getByRole('button', { name: 'Enter room' }).click();
  await expect(page.getByRole('heading', { name: 'Live room' })).toBeHidden();
});

test('keeps a quiet fallback when WebGL is unavailable and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, options) {
      return kind === 'webgl2' ? null : getContext.call(this, kind, options);
    };
  });
  await openLab(page);
  const sample = await page.evaluate(() => {
    window.__roomLab.start('B');
    return window.__roomLab.sampleAt(2670);
  });
  expect(sample.frame.reducedMotion).toBe(true);
  expect(sample.renderer).toBe('css');
  await expect(page.locator('#field')).toBeHidden();
  await expect(page.locator('#room')).toHaveCSS('background-image', /gradient/);
});

test('the idle field evolves smoothly and holds still with reduced motion', async ({ page }) => {
  async function measureMotion() {
    return page.evaluate(() => {
      const canvas = document.querySelector('#field');
      const gl = canvas.getContext('webgl2');
      const { width, height } = canvas;

      function sample(tMs) {
        const state = window.__roomLab.sampleAt(tMs);
        if (state.frame.impulse || state.frame.envelope) throw new Error('Expected the idle field');
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
      }

      function meanChange(first, second) {
        let total = 0;
        let channels = 0;
        for (let y = 8; y < height; y += 16) {
          for (let x = 8; x < width; x += 16) {
            const offset = (y * width + x) * 4;
            for (let channel = 0; channel < 3; channel++) {
              total += Math.abs(first[offset + channel] - second[offset + channel]);
              channels++;
            }
          }
        }
        return total / channels;
      }

      window.__roomLab.start('A');
      const initial = sample(0);
      return {
        near: meanChange(initial, sample(100)),
        later: meanChange(initial, sample(2000)),
      };
    });
  }

  await openLab(page);
  await expect(page.locator('#field')).toHaveAttribute('data-renderer', 'webgl2');
  const motion = await measureMotion();
  expect(motion.later).toBeGreaterThan(5);
  expect(motion.near).toBeLessThan(2.5);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await measureMotion()).toEqual({ near: 0, later: 0 });
});

test('the field keeps drifting when a playing session starts or returns to setup', async ({ page }) => {
  await page.addInitScript(() => {
    const gl = WebGL2RenderingContext.prototype;
    const getLocation = gl.getUniformLocation;
    const setFloat = gl.uniform1f;
    let clock;
    window.fieldPhases = [];
    gl.getUniformLocation = function (program, name) {
      const location = getLocation.call(this, program, name);
      if (name === 'time') clock = location;
      return location;
    };
    gl.uniform1f = function (location, value) {
      if (location === clock) window.fieldPhases.push(value);
      return setFloat.call(this, location, value);
    };
  });
  await page.goto('/room/?setup=1');
  await page.waitForFunction(() => window.fieldPhases.at(-1) > 0.25);
  await page.getByRole('button', { name: 'Enter room' }).click();
  const during = await page.evaluate(() => window.fieldPhases.at(-1));
  await page.waitForFunction(phase => window.fieldPhases.at(-1) > phase + 0.1, during);
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('The room')).toBeFocused();
  const setup = await page.evaluate(() => window.fieldPhases.at(-1));
  await page.waitForFunction(phase => window.fieldPhases.at(-1) > phase + 0.1, setup);
  const phases = await page.evaluate(() => window.fieldPhases);
  expect(phases.every((phase, index) => index === 0 || phase >= phases[index - 1])).toBe(true);
});

test('the motion lab applies the preset and independent overrides', async ({ page }) => {
  await openLab(page, '&motion=gentle&speed=0&detail=0.6');
  const tuning = await page.evaluate(() => {
    window.__roomLab.start('A');
    window.__roomLab.sampleAt(5100);
    const gl = document.querySelector('#field').getContext('webgl2');
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    const uniform = name => gl.getUniform(program, gl.getUniformLocation(program, name));
    return { time: uniform('time'), warp: uniform('warp'), strike: uniform('strike'), detail: uniform('detail') };
  });
  expect(tuning.time).toBe(0);
  expect(tuning.warp).toBeCloseTo(0.425);
  expect(tuning.strike).toBe(0.5);
  expect(tuning.detail).toBeCloseTo(0.6);
});

test('renders WebGL, resizes and recovers from context loss', async ({ page }) => {
  await openLab(page);
  const canvas = page.locator('#field');
  await expect(canvas).toHaveAttribute('data-renderer', 'webgl2');
  await page.setViewportSize({ width: 720, height: 480 });
  await expect(canvas).toHaveAttribute('width', '720');
  await expect(canvas).toHaveAttribute('height', '480');

  const canLoseContext = await page.evaluate(() => {
    const extension = document.querySelector('#field').getContext('webgl2').getExtension('WEBGL_lose_context');
    if (!extension) return false;
    window.roomContextControl = extension;
    extension.loseContext();
    return true;
  });
  expect(canLoseContext).toBe(true);
  await expect(canvas).toHaveAttribute('data-renderer', 'css');
  await page.evaluate(() => window.roomContextControl.restoreContext());
  await expect(canvas).toHaveAttribute('data-renderer', 'webgl2');
});
