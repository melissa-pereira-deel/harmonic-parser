import './visual/field.css';
import './room.css';
import type { LiveHarmony } from './analysis/live.ts';
import type { Condition, ReplayFixture } from './contracts.ts';
import { createMidiInput } from './input/midi.ts';
import type { MidiStatus } from './input/midi.ts';
import type { RoomMetrics } from './lab.ts';
import { chordReplay, motifReplay } from './replay/motif.ts';
import { createRoomSession } from './session.ts';
import { createRoomRenderer } from './visual/renderer.ts';
import { defaultFieldTuning, interpolateFieldTuning, readFieldTuning } from './visual/tuning.ts';
import type { FieldTuning } from './visual/tuning.ts';

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing room element: ${id}`);
  return node as T;
}

const room = element('room');
const canvas = element<HTMLCanvasElement>('field');
const setup = element('setup');
const showSetup = element<HTMLButtonElement>('show-setup');
const form = element<HTMLFormElement>('room-form');
const conditionField = element<HTMLSelectElement>('condition');
const sourceField = element<HTMLSelectElement>('source');
const midiControls = element('midi-controls');
const connect = element<HTMLButtonElement>('connect');
const port = element<HTMLSelectElement>('midi-port');
const portLabel = element('port-label');
const midiStatus = element('midi-status');
const start = element<HTMLButtonElement>('start-room');
const sourceNote = element('source-note');
const setupNotice = element('setup-notice');
const reflection = element('reflection');
const harmony = element('harmony');
const harmonyChord = element('harmony-chord');
const harmonyKey = element('harmony-key');
const harmonyKeyItem = element('harmony-key-item');
const harmonyNext = element('harmony-next');
const harmonyNextItem = element('harmony-next-item');
const params = new URLSearchParams(location.search);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const labEnabled = import.meta.env.DEV && params.has('lab');
let tuning = labEnabled ? readFieldTuning(params) : defaultFieldTuning;
let motionTransition: { from: FieldTuning; to: FieldTuning; elapsedMs: number } | null = null;
const motionTransitionMs = 150;

if (labEnabled && params.get('treatment') === 'basin') {
  canvas.dataset.treatment = 'basin';
}

const renderer = createRoomRenderer(canvas);
let session = createRoomSession('A', null);
let condition: Condition = 'A';
let source: 'midi' | 'replay' | null = null;
let fixture: ReplayFixture | null = null;
let startMs = performance.now();
let frozenMs: number | null = null;
let fieldTimeMs = 0;
let previousFrameMs: number | null = null;
let field = { impulse: 0, register: 0.5, envelope: 0, energy: 0, warmth: 0 };
let status: MidiStatus = { kind: 'idle', ports: [], selectedId: null };
let metrics: RoomMetrics | undefined;
let displayedHarmony: LiveHarmony | null = null;

const elapsed = () => performance.now() - startMs;

const midi = createMidiInput({
  now: elapsed,
  emit(event) {
    if (source !== 'midi' || document.hidden) return;
    if (event.kind === 'noteOn' && condition !== 'A') metrics?.noteOn(event.tMs);
    if (event.kind === 'reset') metrics?.clearPending();
    session.apply(event);
  },
  onStatus(next) {
    status = next;
    updateSetup();
    if (source === 'midi' && next.kind === 'disconnected') {
      openSetup('The MIDI input disconnected. Reconnect it or try replay.');
    }
  },
});

function updateSetup(): void {
  const usesMidi = sourceField.value === 'midi';
  midiControls.hidden = !usesMidi;
  connect.disabled = status.kind === 'connecting' || status.kind === 'unsupported';
  port.hidden = status.ports.length === 0;
  portLabel.hidden = port.hidden;
  const choices = status.ports.map(({ id, name }) => new Option(name, id));
  const placeholder = new Option('Choose an input', '');
  placeholder.disabled = true;
  port.replaceChildren(placeholder, ...choices);
  port.value = status.selectedId ?? '';
  if (port.selectedIndex < 0) port.selectedIndex = 0;

  const messages: Record<MidiStatus['kind'], string> = {
    idle: 'Connect to see available MIDI inputs.',
    connecting: 'Opening MIDI access…',
    ready: status.selectedId ? 'Keyboard ready.' : 'Choose the input you want to play.',
    unsupported: 'MIDI is unavailable in this browser. Try desktop Chrome or use replay.',
    denied: 'MIDI permission was denied. Check your browser settings or use replay.',
    'no-device': 'No MIDI input found. Connect your keyboard or use replay.',
    disconnected: 'The selected input disconnected. Reconnect it or choose another input.',
    unavailable: 'The MIDI input could not open. Check whether your instrument is available to the browser.',
  };
  if (midiStatus.textContent !== messages[status.kind]) midiStatus.textContent = messages[status.kind];
  start.disabled = usesMidi && (status.kind !== 'ready' || status.selectedId === null);
  sourceNote.textContent = usesMidi
    ? 'Use your usual instrument or synth for sound.'
    : 'The replay is silent.';
}

function begin(next: Condition, mode: 'midi' | 'replay' | null, replay: ReplayFixture | null): void {
  source = null;
  midi.reset();
  condition = next;
  fixture = replay;
  session = createRoomSession(next, replay, mode === 'midi' || replay === chordReplay);
  startMs = performance.now();
  frozenMs = null;
  metrics?.reset();
  reflection.textContent = '';
  showHarmony(null);
  setup.hidden = true;
  showSetup.hidden = false;
  source = mode;
  room.focus({ preventScroll: true });
}

function openSetup(notice = ''): void {
  begin('A', null, null);
  setupNotice.textContent = notice;
  setup.hidden = false;
  showSetup.hidden = true;
  updateSetup();
  conditionField.focus();
}

function showHarmony(reading: LiveHarmony | null): void {
  if (displayedHarmony === reading) return;
  displayedHarmony = reading;
  harmony.hidden = !reading;
  harmonyChord.textContent = reading?.chord ?? '';
  harmonyKey.textContent = reading?.key ?? '';
  harmonyKeyItem.hidden = !reading?.key;
  harmonyNext.textContent = reading?.next ?? '';
  harmonyNextItem.hidden = !reading?.next;
}

function draw(tMs: number, stepMs?: number) {
  const state = session.sample(tMs, reducedMotion.matches);
  const frame = state.frame;
  if (motionTransition) {
    motionTransition.elapsedMs += frame.reducedMotion ? motionTransitionMs : stepMs ?? motionTransitionMs;
    tuning = interpolateFieldTuning(motionTransition.from, motionTransition.to,
      motionTransition.elapsedMs / motionTransitionMs);
    if (tuning === motionTransition.to) motionTransition = null;
  }
  if (stepMs === undefined) {
    renderer.draw(frame, frame.reducedMotion ? 0 : tMs * tuning.speed, tuning);
  } else {
    // The scene keeps its phase when the musical session resets.
    if (!frame.reducedMotion) fieldTimeMs += stepMs * tuning.speed;
    const follow = (current: number, target: number, timeMs: number) =>
      current + (target - current) * (1 - Math.exp(-stepMs / timeMs));
    field = {
      impulse: follow(field.impulse, frame.impulse, tuning.attack),
      register: follow(field.register, frame.register, 190),
      envelope: follow(field.envelope, frame.envelope, 220),
      energy: follow(field.energy, frame.energy, 650),
      warmth: follow(field.warmth, frame.warmth, 850),
    };
    renderer.draw({ ...frame, ...field }, fieldTimeMs, tuning);
  }
  if (source && frozenMs === null) {
    metrics?.draw(tMs, elapsed(), renderer.kind === 'webgl2');
  }
  const text = state.cue?.text ?? '';
  if (reflection.textContent !== text) reflection.textContent = text;
  showHarmony(text ? null : state.harmony);
  return { ...state, renderer: renderer.kind };
}

sourceField.addEventListener('change', updateSetup);
connect.addEventListener('click', () => { void midi.connect(); });
port.addEventListener('change', () => { if (port.value) midi.select(port.value); });
showSetup.addEventListener('click', () => openSetup());
element('close-setup').addEventListener('click', () => begin('A', null, null));

form.addEventListener('submit', event => {
  event.preventDefault();
  if (start.disabled) return;
  const mode = sourceField.value === 'midi' ? 'midi' : 'replay';
  const requested = conditionField.value;
  const next = requested === 'A' || requested === 'C' ? requested : 'B';
  const replay = mode === 'midi' ? null : sourceField.value === 'chords' ? chordReplay : motifReplay;
  begin(next, mode, replay);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && setup.hidden) {
    event.preventDefault();
    openSetup();
  }
  const plainPress = !event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey;
  if (plainPress && event.key.toLowerCase() === 'r' && setup.hidden && source === 'midi') {
    session.reflect(elapsed());
  }
});

document.addEventListener('visibilitychange', () => {
  previousFrameMs = null;
  if (document.hidden) {
    midi.reset();
    session.reset();
    reflection.textContent = '';
    showHarmony(null);
    metrics?.clearPending();
  } else {
    if (source === 'replay' && frozenMs === null) startMs = performance.now();
    metrics?.resume();
  }
});

if (params.has('setup')) openSetup();
else updateSetup();

function animate(nowMs: number): void {
  const stepMs = previousFrameMs === null ? 0 : Math.min(nowMs - previousFrameMs, 50);
  previousFrameMs = nowMs;
  if (!document.hidden) {
    if (frozenMs === null) draw(elapsed(), stepMs);
    else draw(frozenMs);
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

if (labEnabled) {
  void import('./motion-panel.ts').then(({ mountMotionPanel }) => {
    mountMotionPanel(room, tuning, next => {
      motionTransition = { from: tuning, to: next, elapsedMs: 0 };
    });
  });
  void import('./lab.ts').then(({ installRoomLab, createRoomMetrics }) => {
    metrics = createRoomMetrics();
    installRoomLab({
      start(next, replay) {
        begin(next, 'replay', replay);
        frozenMs = 0;
        return draw(0);
      },
      sampleAt(tMs) {
        if (!fixture) throw new Error('Start a replay before sampling.');
        frozenMs = tMs;
        session.reset();
        return draw(tMs);
      },
      stats: metrics.stats,
    });
  });
}
