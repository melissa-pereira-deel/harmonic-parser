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

test('requests MIDI from setup and recovers when the selected keyboard disconnects', async ({ page }) => {
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
    window.playMockNote = () => input.onmidimessage?.({ data: new Uint8Array([0x90, 60, 110]) });
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

  await page.evaluate(() => window.playMockNote());
  await expect.poll(() => page.evaluate(() => window.__roomLab.stats().strikes)).toBe(1);
  await page.keyboard.press('r');
  await expect(page.locator('#reflection')).toHaveText('Same phrase, different bass.');

  await page.evaluate(() => window.disconnectMockKeyboard());
  await expect(page.getByText('The MIDI input disconnected.', { exact: false })).toBeVisible();
  await expect(page.locator('#reflection')).toBeEmpty();
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
