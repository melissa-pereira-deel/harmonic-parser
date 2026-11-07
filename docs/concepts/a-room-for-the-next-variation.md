# A room for the next variation

*Harmonic Parser · Concept brief · 7 November 2026*

## The moment at the keyboard

You play a few notes until a melody feels like something you want to keep. You loop it. A note arrives a little late, a rest opens up, or you take something out. Then the loop starts to feel familiar in two ways. You can hear why you love it, and you can hear that you keep coming back to the same place.

The opportunity is to make a private room for that exact moment. The page is already alive when you open it. Color drifts, light crosses the field, and texture gives it depth. Your first notes change its behavior. As you play, the room may make a difference between two passes easier to notice, or offer a way to hear the motif against a different background. The next decision still happens at the keyboard.

### A concrete example

Keep a three-note phrase. Repeat it and delay the last note. On the next pass, leave that note out and let the gap stay open. Then play the original phrase over a different low note. The first move changes when you arrive. The second leaves the phrase hanging. The third changes what the same notes seem to belong to. All three are playable by ear.

**Working hypothesis.** A visual environment can make these differences feel worth exploring. Gesture may be enough to invite another pass. A harmonic cue earns its place if it helps you hear a possibility you want to try. The three-condition study will help separate those contributions.

**Status.** The user endorsed comparing three versions of the same world. This brief explores the experience and describes a proposed study. The visual material, cue form, parser integration and implementation scope are still open.

## What the musical references offer

Across these references I hear intimacy alongside strangeness, and simple motifs that support complex changes around them. That’s my reading of the references as a set. The design transfers below are hypotheses to try at the keyboard.

**Björk and Moderat · A small gesture can carry the room.** Björk describes building the microbeats of *Vespertine* with painstaking care. Moderat describe how cutting lines from the vocal changed the character of “The Fool.” I’d give the room enough quiet for a soft strike or a missing note to change what you notice. [01, 02]

**Aphex Twin and Blonde Redhead · Let layers disagree about time.** Richard D. James describes running copies of tape collages at slightly different speeds. Kazu Makino describes repetition in which different parts seem to spin at different speeds. A note can disturb the field now while an older trace continues drifting. Their overlap can make the next pass feel different even with the same notes. [03, 04]

**Boards of Canada · Let repetition leave residue.** The duo describe layering parts by playing one tape recorder into another until the sound distorted. A visual trace could lose detail on each pass while remaining recognizable. A long rest might leave a faint imprint. Test whether that makes returning to an idea feel rewarding. [05]

**Arca and Sonic Youth · Give roughness a place to live.** On *Mutant*, Arca deliberately lets tracks flow into one another. Thurston Moore describes using prepared guitars and alternate tunings as part of Sonic Youth’s vocabulary. The transfer is to let a familiar shape acquire friction or change its texture from within. A held friction can be the part you want to keep. [06, 07]

**Warpaint, Vegyn and Headache · Change what surrounds the idea.** Theresa Wayman recalls that Warpaint’s “Shadows” began with lyrics and melody, with the music built around them later. Headache sets the cadence of a synthetic narrator against Vegyn’s music, with words by Francis Hornsby Clark. At the keyboard, try moving one bass note or leaving a little more space around the original melody. [08, 09]

## How the room could behave

### Before, during and between phrases

**Before you play.** The field has its own slow movement. It should be worth opening even on a day when you only sit with it for a minute. For the study, give all three conditions the same composition, palette, material and baseline drift.

**On contact.** A light strike displaces a small area. Another strike at a different intensity makes a difference you can recognize on repeat. A held note can draw a trace out over time. These are examples of a visual relationship you can learn by playing. Color can carry atmosphere without having to encode a key or emotion.

**Across a phrase.** The room can carry a trace while it responds to the next gesture. Dropping a note might leave a gap. Playing the phrase against a new bass note might shift the apparent ground under a familiar shape. These behaviors are sketches for what to feel. The project still needs to learn which musical changes the system can identify reliably.

**At a moment you might look up.** An occasional reading can take form inside the field and linger long enough to glance at. A rest can be part of the phrase, and pedal may keep notes sounding through it. Timing should respond to how a phrase feels and to whether you are ready to look, as far as the experience can tell. A longer pause could let the trace recede into the idle field.

### Reflection, second hearing, or invitation

A **reflection** describes something you might hear. “The low note changed” can be useful to a player who works by ear. A **second hearing** makes two plausible ways of hearing the same phrase available, perhaps through two felt centers and optional names. An **invitation** proposes an action, such as trying the phrase over a different low note. It can be welcome at a stuck moment and intrusive mid-phrase.

The first study compares conditions with and without occasional reflection. Treat invitations and explicit next-chord suggestions as separate ideas so they don’t blur what that comparison teaches. Glass, flat type and a cue made entirely of motion are still possible. The questions are whether you can find it at a glance, understand it by ear, and stay with the music when you ignore it. [10, 11]

**Nearby work.** Bloom gives its generative world a life of its own between interactions. gemina3d gives live MIDI a spatial vocabulary for musical relationships. Hookpad makes chord suggestions explicit. The question for this room is what a player can discover without leaving the act of playing by ear. [14-16]

## What the parser can contribute

The existing browser tool takes typed chord symbols and ranks 24 major and minor keys against their pitch-class distributions. It gives Roman numerals relative to a candidate key and can offer next chords from a rule table keyed by the final chord’s root and the chosen key. Its core idea is to distinguish several plausible readings from a poor fit. Its own experiments show the current thresholds are uncalibrated. [12]

**A check on the current scorer.** I ran `Am F G C` and `C F G Am` in the local checkout at `6c0d2b7`. Both gave C major 0.935 and A minor 0.830, rounded to three decimals. Both contain the same chords, so the scorer sees the same distribution. Their endings are different. A single `C` chord also cleared both current confidence checks. The scores can supply candidate tonal centers. Phrase direction, readiness to name a key, and the feeling of tension or release need additional evidence. The remote could not be verified during the review. [12]

**The gap between playing and reading.** MIDI can carry note onsets, releases, strike velocity, and controllers such as a sustain pedal when the device sends them. Velocity describes a gesture. Audio could add information about the resulting sound, including timbre and effect tails. A note stream may contain a melody, a rolled chord, or a low note left sounding under a new idea. The current parser begins with chord symbols, so a live path has to establish what musical material it is interpreting. A single-note motif can remain open to several accompaniments and still give the room plenty to respond to. [12, 13]

**Consequences for the experience.** The room can respond to a gesture while a reading is still taking shape. Strong competing interpretations may deserve room side by side. Thin evidence, a weak fit, and an intentionally open-ended phrase each give a reason for the room to keep moving without a key label. First-run setup is also part of the experience. Browser MIDI access can require permission, and an unconnected keyboard needs a recoverable path back to a quiet, ready room. [13]

## Three ways to play the same room

### A · Drifting on its own

The complete ambient world runs while you play. This asks whether being in the room changes how readily you start or how long you want to stay with a phrase.

### B · Responding to gesture

The same world responds to what you play. This asks whether the visible relationship makes you want to repeat, alter or listen more closely to the motif.

### C · Responding with occasional harmonic reflection

Keep B’s response and add a sparse reflection at a musically plausible moment. This asks whether the cue changes what you hear or try, and whether it costs attention. A human-facilitated cue could test the experience before there is a dependable live analyzer. Record its origin. Evidence from that condition would describe the cue’s value and timing, while the ability to produce it automatically would remain a separate question.

### A first session

Use your own keyboard, your usual sound, and a short motif you feel drawn to. Give each condition a short free play period and a pass with the same motif. Let yourself repeat it until you want a change. Make a note afterward of what you heard, did and looked at. Hold the setup, baseline visual motion and musical task steady. Vary the condition order across repeat sessions to reduce the effect of warming up and knowing the motif better.

**Observe.** Record how readily you begin, when you first try a deliberate variation, which changes you want to keep, and whether a glance supports or interrupts the next phrase. If a cue appears, note what you thought it meant and what you played next. Ask separately whether you liked the scene and whether it changed how you played.

**Read the result.** A can carry value on its own. B adds value if the feedback makes a musical difference you want to explore. C adds value if reflection gives you a way to hear or play the motif differently at an acceptable attention cost. A first session can clarify your preference and reveal failure cases. Repetition on other days and with other motifs can show whether the effect survives familiarity.

## What to decide after playing

- Where does the block happen in a real session, and which variation gets you moving again? Listen for timing, space, a new low note, an alternate ending, or a new layer.
- How long can a phrase remain unresolved before the room’s restraint feels like a missed connection? Distinguish a held note, a musical pause, and the end of a session.
- When you want help, do you want to notice a relationship, hear a second interpretation, or get something playable to try? Which of those needs words, and when would you want to ask for it?

The [project memory](../project-memory.md) records the confirmed direction, evidence, proposals and open questions. Add the first session as an observation there, with the motif or listening notes if you choose to retain them.

### Sources

- [01 · Björk on building the microbeats of Vespertine, Pitchfork](https://pitchfork.com/features/interview/9582-the-invisible-woman-a-conversation-with-bjork/)
- [02 · Moderat on reworking the vocal in “The Fool,” laut.de](https://laut.de/Moderat/Interviews/Da-fehlt-jetzt-noch-ein-Knall-29-03-2016-1333)
- [03 · Richard D. James on tape loops and phase, MusicRadar](https://www.musicradar.com/news/aphex-twin-interview-selected-ambient-works)
- [04 · Kazu Makino on layered repetition, The Line of Best Fit](https://www.thelineofbestfit.com/features/interviews/kazu-makino-blonde-redhead-personal-best)
- [05 · Boards of Canada on their early tape experiments, Pitchfork](https://pitchfork.com/features/interview/6151-boards-of-canada/)
- [06 · Arca on Mutant and its transitions, Pitchfork](https://pitchfork.com/features/interview/9754-arcas-warped-beauty/)
- [07 · Thurston Moore on Sonic Youth’s guitar vocabulary, Guitar World](https://www.guitarworld.com/artists/guitarists/thurston-moore-sonic-youth-sister)
- [08 · Theresa Wayman on Warpaint’s writing process, OnMilwaukee](https://onmilwaukee.com/articles/warpaintpabst)
- [09 · Vegyn on making Headache with Francis Hornsby Clark, The Quietus](https://thequietus.com/interviews/vegyn-interview/)
- [10 · Hunt, Wanderley and Paradis on instrument mapping, A NIME Reader](https://mcd.stanford.edu/publish/files/2017-nime-reader.pdf)
- [11 · Weiser and Brown, The Coming Age of Calm Technology](https://calmtech.com/papers/coming-age-calm-technology)
- 12 · Repository [scorer](../../src/readings.ts#L247), [chord parser](../../src/chords.ts#L315), [suggestion rules](../../src/suggest.ts#L150) and [confidence experiment](../../experiments/confidence-thresholds.spike.md)
- [13 · W3C Web MIDI API](https://www.w3.org/TR/webmidi/)
- [14 · Brian Eno and Peter Chilvers, Bloom](https://generativemusic.com/bloom.html)
- [15 · gemina3d](https://gemina3d.com/)
- [16 · Hookpad user guide](https://www.hooktheory.com/support/hookpad)
