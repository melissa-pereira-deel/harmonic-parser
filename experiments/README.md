# experiments/

This directory exists before anything in it does, and that is deliberate.

`project_root()` in tiny-model-lab's harness walks up from the working
directory looking for an `experiments/` directory, and uses the first one it
finds as the place `runs/`, `champion/` and the ledger belong. Without it, a
`pip install`ed harness writes your run history into site-packages. So this
directory is the marker that says *this repo is mine*, and it earns its place
while empty.

## What lives here

Three kinds of committed file, the same three as in tiny-model-lab:

- `<slug>.yaml` — a contract. **There are none yet**, and there should not be
  until `src/readings.ts` grows a `'model'` source. A contract authorises
  training; nothing here trains anything.
- `<slug>-refused.md` — a written refusal, when triage decides a task belongs
  on a lower rung of the ladder.
- `<slug>.spike.md` — a spike record: one question, one threshold, one named
  consequence, a budget in minutes, and a finding. Check them with
  `python -m harness spikes`.

Two spikes are answered here already, and both said no. Read them before
trusting anything this page says about its own confidence.

## Setting it up

```bash
pip install -r tools/requirements.txt
python -m harness init
rm experiments/experiment.yaml
```

That `rm` is a workaround, not a preference. `harness init` copies a blank
`experiment.yaml` here, and the training guard
(`.claude/hooks/guard-experiment.sh` in tiny-model-lab) only checks that *some*
`experiments/*.yaml` exists — it never reads the file. So a freshly scaffolded
project has training unlocked by a file that exists to be invalid. Filed
against tiny-model-lab; deleting the file is the honest state until it is
fixed.

Spike records are `.md`, so they unlock nothing. That is tested rather than
assumed, in `tests/test_guard_hook.py::test_a_spike_record_does_not_unlock_training`.
