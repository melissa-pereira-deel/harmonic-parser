# experiments/

This directory exists before anything in it does, and that is deliberate.

`project_root()` in tiny-model-lab's harness walks up from the working
directory looking for an `experiments/` directory, and uses the first one it
finds as the place `runs/`, `champion/` and the ledger belong. Without it, a
`pip install`ed harness writes your run history into site-packages. So this
directory is the marker that says *this repo is mine*, and it earns its place
while empty.

## What lives here

Three kinds of committed file, the same three as in tiny-model-lab. `harness
init` also drops `experiment.yaml.template` here, which is none of them and is
gitignored — see below.

- `<slug>.yaml` — a contract. **There are none yet**, and there should not be
  until `src/readings.ts` grows a `'model'` source. A contract authorises
  training; nothing here trains anything.
- `<slug>-refused.md` — a written refusal, when triage decides a task belongs
  on a lower rung of the ladder.
- `<slug>.spike.md` — a spike record: one question, one threshold, one named
  consequence, a budget in minutes, and a finding. Check them with
  `python -m harness spikes`.

Four spikes are answered here already. Two of them stopped something: the
confidence thresholds cannot be calibrated from the data that exists, and a
third of the suggestion baseline's contexts turn out to be decided by
`localeCompare` rather than by music. The other two changed a decision rather
than ending one — a debounce that was about to be added would have cost the
`instant` band, and music21's slash-bass rule is about the exact spelled name
rather than the letter. Read them before trusting anything this page says about
its own confidence.

## Setting it up

```bash
pip install -r tools/requirements.txt
python -m harness init
```

There used to be a third line here — `rm experiments/experiment.yaml` — and the
reason is worth keeping visible. `init` copied a blank contract in under that
name, and the training guard (`.claude/hooks/guard-experiment.sh` in
tiny-model-lab) only checks that *some* `experiments/*.yaml` exists; it never
reads the file. So a freshly scaffolded project had training unlocked by a file
that exists in order to be invalid, and deleting it was the honest state.

Fixed in [tiny-model-lab#21](https://github.com/melissa-pereira-deel/tiny-model-lab/issues/21).
`init` writes `experiments/experiment.yaml.template` now, which that glob does
not see, so this directory stays locked and there is nothing to delete. The
template is the blank form to copy when `src/readings.ts` grows a `'model'`
source. It is gitignored until then: it is tiny-model-lab's file, `init`
rewrites it on demand, and a vendored copy would drift from the original.

Spike records are `.md`, so they unlock nothing either. Both properties are
tested rather than assumed, in tiny-model-lab's `tests/test_guard_hook.py` —
`test_a_spike_record_does_not_unlock_training` and
`test_scaffolding_a_project_does_not_unlock_training`.
