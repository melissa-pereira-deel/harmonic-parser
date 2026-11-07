# ChoCo licence audit, per partition

Refs #14. Read on 2026-11-07.

**Not legal advice. The include/exclude decision belongs to the owner.** This
document records what each source says and gives no verdict. It lists
commercial and non-commercial status side by side, so the decision can be made
for either use.

## Why

ChoCo's README licenses the corpus as CC BY 4.0, except three partitions
(Chordify Annotator Subjectivity, Mozart Piano Sonata, JAAH) that are
CC BY-NC-SA 4.0. That is ChoCo's claim about its aggregation. ChoCo
redistributes eighteen annotation sets made by other people, and each of them
was published under its own terms or under none. So every partition below has
two licence columns, upstream and ChoCo, and they are never merged.

## Method

- **Partition list:** ChoCo's README overview table, its `LICENSE.md`, and the
  `partitions/` directory of
  [smashub/choco](https://github.com/smashub/choco). All three agree on
  eighteen partitions.
- **ChoCo's own licence claims:** the README and `LICENSE.md`; Table 8 of the
  paper (de Berardinis et al., *Scientific Data* 10:641, 2023,
  [PMC10511441](https://pmc.ncbi.nlm.nih.gov/articles/PMC10511441/)), which
  gives an "original licence" and a "ChoCo licence" for each subset; and
  ChoCo's metadata notes at
  [smashub.github.io/docs/choco/metadata_license](https://smashub.github.io/docs/choco/metadata_license).
- **Upstream:** for each partition, the original dataset's own landing page,
  repository README or LICENSE file, or Zenodo record. GitHub sources were read
  with `gh api`; other pages with a web fetch.
- **Nothing was downloaded.** No archive, data file, JAMS, LAB or database was
  fetched. Only licence pages, READMEs, LICENSE files, landing pages, format
  documentation and papers were read.
- **Conventions.** Where upstream states no licence, the cell says *none
  stated (all rights reserved by default)*. Where a source could not be
  reached or found, it says *not verified* and why. Annotation counts are
  ChoCo's, from its README table. A `+` means ChoCo gives a lower bound.

Throughout, "OK" means *the stated licence grants this use*. "Unclear" means
no licence grants it, or the sources conflict. ChoCo's paper says the authors
of the unlicensed collections were contacted and confirmed CC BY 4.0 was
compatible. Those confirmations are not published, so they are recorded here
as a ChoCo claim, not as an upstream licence.

## The table

Each licence cell was read on 2026-11-07. In the two "OK?" columns, **up** is
the status under the upstream licence and **ChoCo** is the status under
ChoCo's stated licence.

| partition | upstream source (URL) | upstream licence as stated (date read) | ChoCo's stated licence | commercial use OK? (yes / no / unclear) | non-commercial use OK? (yes / no / unclear) | attribution / share-alike obligations | annotation count (as stated by ChoCo, with source) | genre | tonality-label vocabulary |
|---|---|---|---|---|---|---|---|---|---|
| Isophonics | [isophonics.net/datasets](http://isophonics.net/datasets), [reference-annotations](http://isophonics.net/content/reference-annotations) | None stated (all rights reserved by default). Neither page carries a licence for the chord or key annotations; the only licence on the datasets page is for an unrelated impulse-response set. (2026-11-07) | CC BY 4.0. Table 8: original "Not specified". | up: unclear · ChoCo: yes | up: unclear · ChoCo: yes | Upstream: none stated. ChoCo: CC BY attribution. | 300 (ChoCo README) | pop, rock | Key `.lab` files with a key label per region. The vocabulary is not documented on the pages read. |
| JAAH | [zenodo.org/records/1290737](https://zenodo.org/records/1290737), [github.com/MTG/JAAH](https://github.com/MTG/JAAH), [mtg.github.io/JAAH](https://mtg.github.io/JAAH/) | CC BY-NC-SA 4.0, on the Zenodo record (v0.1). The GitHub repo has no licence file, and the docs site has only a copyright line. (2026-11-07) | CC BY-NC-SA 4.0 (README exception). Table 8: original CC BY-NC-SA 4.0. | up: no · ChoCo: no | up: yes · ChoCo: yes | Attribution, non-commercial, share-alike. | 113 (ChoCo README) | jazz | Not documented on the docs page read. It labels chord qualities, not keys. |
| Schubert-Winterreise | [zenodo.org/records/3968388](https://zenodo.org/records/3968388) (v2.1, 2024) | CC BY 3.0 Unported. One audio performance must not be redistributed in modified form; that restriction is on audio, which ChoCo does not ship. (2026-11-07) | CC BY 4.0. Table 8: original CC BY 3.0. | up: yes · ChoCo: yes | up: yes · ChoCo: yes | Attribution (CC BY 3.0 upstream, 4.0 in ChoCo). | 25 score + 25×9 audio = 250 (ChoCo README) | classical | Global and local keys, with local keys from three annotators. The vocabulary is not stated on the Zenodo record. |
| Billboard | [ddmal.ca … McGill Billboard Project](https://ddmal.ca/research/The_McGill_Billboard_Project_(Chord_Analysis_Dataset)/) (the `ddmal.music.mcgill.ca` URL in older citations returns 404) | CC0: "made them available legally under a CC0 license". It asks for a scholarly citation. (2026-11-07) | CC BY 4.0. Table 8: original CC0. | up: yes · ChoCo: yes | up: yes · ChoCo: yes | Upstream: none required, citation requested. ChoCo: CC BY attribution. | 890 (740) (ChoCo README) | pop | Tonic only, no mode. The header carries `# tonic:` (or `?`), and later tonic comments mark changes. |
| Chordify Annotator Subjectivity (CASD) | [github.com/chordify/CASD](https://github.com/chordify/CASD) (`readme.md`, `LICENSE.md`) | CC BY-NC-SA 4.0 (README and LICENSE.md). (2026-11-07) | CC BY-NC-SA 4.0 (README exception). Table 8: original CC BY-NC-SA 4.0. | up: no · ChoCo: no | up: yes · ChoCo: yes | Attribution, non-commercial, share-alike. | 50×4 = 200 (ChoCo README) | pop | No local keys of its own. The ChoCo paper says keys were taken from Billboard, which gives tonic only. |
| Robbie Williams | [ispl.deib.polimi.it/tools](https://ispl.deib.polimi.it/tools/) | None stated (all rights reserved by default). The page only asks for a citation of di Giorgi et al. 2013. (2026-11-07) | CC BY 4.0. Table 8: original "Not specified". | up: unclear · ChoCo: yes | up: unclear · ChoCo: yes | Upstream: citation requested. ChoCo: CC BY attribution. | 61 (ChoCo README) | pop | Keys are annotated. The vocabulary is not documented. The cited paper's title ("diatonic modal harmony") suggests modes, but that is not confirmed. |
| The Real Book | Not verified. No upstream distribution page was found. ChoCo cites Mauch et al., ISMIR 2007, which is a paper and not a data release. | Not verified: no upstream release found. (2026-11-07) | CC BY 4.0. Table 8: original "Not specified". | up: unclear · ChoCo: yes | up: unclear · ChoCo: yes | Upstream unknown. ChoCo: CC BY attribution. | 2,486 (ChoCo README) | jazz | Not documented. ChoCo's metadata notes say metadata was parsed from file names. |
| Uspop 2002 | [github.com/tmc323/Chord-Annotations](https://github.com/tmc323/Chord-Annotations) (MARL, NYU) | None stated (all rights reserved by default). There is no licence file and the README has no licence. (2026-11-07) | CC BY 4.0. Table 8: original "Not specified". | up: unclear · ChoCo: yes | up: unclear · ChoCo: yes | Upstream: none stated. ChoCo: CC BY attribution. | 195 (ChoCo README) | pop | None. The upstream set is chord-only, and the ChoCo paper reports no key validation for it. |
| RWC-Pop | [github.com/tmc323/Chord-Annotations](https://github.com/tmc323/Chord-Annotations). ChoCo's raw file names match this repo. | None stated (all rights reserved by default). The RWC Music Database's own terms cover the audio and were not read. (2026-11-07) | CC BY 4.0. Table 8: original "Not specified". | up: unclear · ChoCo: yes | up: unclear · ChoCo: yes | Upstream: none stated. ChoCo: CC BY attribution. | 100 (ChoCo README) | pop | None. Chord-only, as for Uspop 2002. |
| Weimar Jazz Database | [jazzomat.hfm-weimar.de/download](https://jazzomat.hfm-weimar.de/download/download.html), [glossary](https://jazzomat.hfm-weimar.de/dbformat/glossary.html) | ODbL 1.0: "released under the Open Data Commons Open DataBase License (ODbL)". (2026-11-07) | CC BY 4.0. Table 8: original ODbL. | up: yes, under ODbL terms · ChoCo: yes | up: yes, under ODbL terms · ChoCo: yes | Upstream: attribution, and **share-alike for derived databases** (ODbL), plus a notice on produced works. ChoCo: CC BY attribution only. | 456 (ChoCo README) | jazz | **Modes.** `<NOTE>[-<MODE>]` with maj, min, ion, dor, phr, lyd, mix, aeol, lok, or a bare tonal centre. There is also a separate tonality type (functional, modal, blues, jazz-blues, colour, free). |
| Wikifonia | Not verified. wikifonia.org was discontinued in December 2013. Secondary source: [Wikipedia: Wikifonia](https://en.wikipedia.org/wiki/Wikifonia). | Not verified: the site is gone. The secondary source says its music was licensed through Musicopy and the site closed when it could no longer get copyright licences. (2026-11-07) | CC BY 4.0. Table 8: original "public domain". | up: unclear · ChoCo: yes | up: unclear · ChoCo: yes | Upstream unknown. ChoCo: CC BY attribution. | 6,500+ (ChoCo README) | various | MusicXML key signatures. The vocabulary is not documented, and ChoCo's notes report problems parsing key signatures. |
| iReal Pro | [irealpro.com/main-playlists](https://www.irealpro.com/main-playlists), [forums.irealpro.com/help/terms](https://forums.irealpro.com/help/terms/), [file format](https://www.irealpro.com/ireal-pro-file-format) | None stated (all rights reserved by default). The playlists page has no licence. The forum terms say posters "retain copyright" and grant a licence to the site operator only, not to third parties. (2026-11-07) | CC BY 4.0. Table 8: original "public domain". | up: unclear · ChoCo: yes | up: unclear · ChoCo: yes | Upstream: none granted to third parties. ChoCo: CC BY attribution. | 2,000+ (ChoCo README) | various | Major/minor only. The format lists 24 keys, with a `-` suffix for minor. |
| Band-in-a-Box | Not verified. There is no public upstream: ChoCo's [raw README](https://github.com/smashub/choco/blob/main/partitions/biab-internet-corpus/raw/README.md) says to contact Bas de Haas for access. | Not verified: not publicly hosted. ChoCo's raw README says the files "cannot be re-distributed … due to copyright and licensing". ChoCo's metadata notes say the upstream readme "forbids commercial use". (2026-11-07) | CC BY 4.0. Table 8: original "Not specified". | up: no, as reported by ChoCo and not verified · ChoCo: yes | up: unclear · ChoCo: yes | Upstream unknown. ChoCo: CC BY attribution. | 5,000+ (ChoCo README) | various | Not verified. |
| When in Rome | [github.com/MarkGotham/When-in-Rome](https://github.com/MarkGotham/When-in-Rome) (README "Licence", `syntax.md`) | CC BY-SA 4.0 for new content, analyses and conversions. Analyses that came from elsewhere are under their original licences, which "vary". (2026-11-07) | CC BY 4.0. Table 8: original CC BY-SA 3.0. | up: unclear (original content yes under BY-SA; imported analyses vary) · ChoCo: yes | up: unclear (same split) · ChoCo: yes | Upstream: attribution and **share-alike**, plus the terms of each imported source. ChoCo: CC BY attribution only. | 450 (ChoCo README) | classical | Major/minor only. RomanText keys are case-coded: `G:` is major, `d:` is minor. No modes are mentioned. |
| Rock Corpus | [rockcorpus.midside.com](http://rockcorpus.midside.com/), [harmonic analyses](http://rockcorpus.midside.com/harmonic_analyses.html) | CC BY 4.0: "can be used under the terms of the CC BY 4.0 License". (2026-11-07) | CC BY 4.0. Table 8: original CC BY 4.0. | up: yes · ChoCo: yes | up: yes · ChoCo: yes | Attribution. | 200 (ChoCo README) | rock | Tonic only: "Major/minor distinctions are not recognized." |
| Mozart Piano Sonata | [github.com/DCMLab/mozart_piano_sonatas](https://github.com/DCMLab/mozart_piano_sonatas) (README, LICENSE) | CC BY-NC-SA 4.0 (README and LICENSE). (2026-11-07) | CC BY-NC-SA 4.0 (README exception). Table 8: original CC BY-NC-SA 4.0. | up: no · ChoCo: no | up: yes · ChoCo: yes | Attribution, non-commercial, share-alike. | 54 (18) (ChoCo README) | classical | Major/minor only. The global key is a note name whose case gives the mode (`Ab` major, `g#` minor). Local keys are Roman numerals with a minor flag. |
| Jazz Corpus | [jazzparser.granroth-wilding.co.uk/JazzCorpus.html](https://jazzparser.granroth-wilding.co.uk/JazzCorpus.html) | None stated (all rights reserved by default). Neither the corpus page nor the JazzParser home page has a licence. (2026-11-07) | CC BY 4.0. Table 8: original "Not specified". | up: unclear · ChoCo: yes | up: unclear · ChoCo: yes | Upstream: none stated. ChoCo: CC BY attribution. | 76 (ChoCo README) | jazz | One key per song, given as "e.g. C major". The full vocabulary is not stated. |
| Nottingham | [ifdo.ca/~seymour/nottingham](https://ifdo.ca/~seymour/nottingham/nottingham.html), [abc.sourceforge.net/NMD](https://abc.sourceforge.net/NMD/) | None stated (all rights reserved by default). The NMD page says rights in the original NMD-format collection "reside with Mick Peat", in its Ashover entry. (2026-11-07) | CC BY 4.0. Table 8: original "Not specified". | up: unclear · ChoCo: yes | up: unclear · ChoCo: yes | Upstream: none stated. ChoCo: CC BY attribution. | 1,000+ (ChoCo README) | folk | ABC tunes with a key field. The vocabulary is not documented on the pages read. |

## Summary counts

Annotation totals add ChoCo's README figures. The `+` lower bounds are counted
at their stated value, and the first figure is used where ChoCo gives two
(Billboard 890, Mozart 54, Schubert 25 + 225). Across all eighteen partitions
that comes to **20,331+**, against the 20,530 chord annotations ChoCo states
overall.

**Commercial use.** Partitions are counted by the status in that column.

| status | upstream column | ChoCo column |
|---|---|---|
| commercial use OK | 4 partitions, 1,796 annotations (Schubert-Winterreise, Billboard, Weimar under ODbL, Rock Corpus) | 15 partitions, 19,964+ annotations |
| commercial use not OK | 4 partitions, 5,367+ annotations (JAAH, CASD, Mozart; Band-in-a-Box as reported by ChoCo, not verified) | 3 partitions, 367 annotations (JAAH, CASD, Mozart) |
| unclear | 10 partitions, 13,168+ annotations | 0 |

**Grouped by licence position.** This is the split issue #14 asked for. Band-in-a-Box goes under *unclear* here, because its non-commercial status is also unknown.

| group | upstream column | ChoCo column |
|---|---|---|
| commercial-OK (and non-commercial OK) | 4 partitions, 1,796 | 15 partitions, 19,964+ |
| non-commercial-only | 3 partitions, 367 (JAAH, CASD, Mozart) | 3 partitions, 367 (same three) |
| unclear | 11 partitions, 18,168+ (Isophonics, Robbie Williams, Real Book, Uspop 2002, RWC-Pop, Wikifonia, iReal Pro, Band-in-a-Box, When in Rome, Jazz Corpus, Nottingham) | 0 |

The headline: under ChoCo's column, 98% of the annotations are commercial-OK.
Under the upstream column, 9% are. Almost all of the difference is partitions
whose upstream states no licence, or could not be read.

## Disagreements and gaps

- **Weimar Jazz Database.** Upstream is ODbL, which requires share-alike for
  derived databases. ChoCo relicenses it as CC BY 4.0, which has no
  share-alike. Table 8 records ODbL as the original licence and does not say
  how the change was cleared.
- **When in Rome.** Upstream is now CC BY-SA 4.0 for its own content, and
  imported analyses keep their original licences, which "vary". ChoCo's
  Table 8 gives the original as CC BY-SA 3.0 and relicenses it as CC BY 4.0,
  which drops share-alike.
- **iReal Pro.** ChoCo's Table 8 says "public domain". The forum terms say
  posters retain copyright and license only the site operator. No public-domain
  dedication was found upstream.
- **Wikifonia.** ChoCo's Table 8 says "public domain". The secondary source
  says Wikifonia licensed copyrighted music through Musicopy and closed when
  those licences ran out. Upstream not verified, because the site is gone.
- **Band-in-a-Box.** ChoCo contradicts itself. Its README licenses the
  partition as CC BY 4.0, its raw-folder README says the files cannot be
  redistributed "due to copyright and licensing", and its metadata notes say
  the upstream readme "forbids commercial use". The upstream itself is not
  public and was not verified.
- **Billboard.** CC0 upstream, CC BY 4.0 in ChoCo. This is a disagreement, but
  ChoCo's version is the stricter one, so it adds an attribution duty rather
  than removing a restriction.
- **Schubert-Winterreise.** CC BY 3.0 upstream, CC BY 4.0 in ChoCo. A version
  change only.
- **The eight "Not specified" partitions.** These are Isophonics, Robbie
  Williams, Real Book, Uspop 2002, RWC-Pop, Band-in-a-Box, Jazz Corpus and
  Nottingham. ChoCo's paper says their authors confirmed CC BY 4.0 was
  compatible, but no confirmation is published. The paper's text says 7
  collections, while Table 8 lists 8.
- **The Real Book has no upstream release.** The citation is a 2007 paper.
  ChoCo's metadata notes say the Jazz Corpus is derived from the Real Book.
  ChoCo's raw Real Book file names end `.Mgu.xlab`, a Band-in-a-Box extension,
  which may mean the two partitions share provenance. That is an observation
  from file names only.
- **Overlap.** CASD annotates 50 Billboard songs, and Jazz Corpus derives from
  Real Book. Including one partition of a pair while excluding the other does
  not fully separate the material.
- **Not read:** the RWC Music Database's own terms (which cover audio), the
  JAAH ISMIR 2018 paper (whose CC BY 4.0 notice is for the paper, not the
  data), and any terms of the underlying compositions. Whether the chord
  sequences of copyrighted songs carry rights of their own is outside this
  audit.
- **ChoCo's counts do not reconcile.** The README says 20,080 JAMS files and
  the paper says 20,086. The partition table, taking lower bounds, sums to
  20,331+ against 20,530 stated chord annotations.

## Deferred until the owner's verdict

None of these can be measured until the included set is chosen. Each needs
the data, and this audit downloaded none.

- **Genre mix of the included set**, measured rather than inherited from
  ChoCo's genre column. Excluding the non-commercial or unclear partitions
  removes most of the jazz and classical material.
- **Key distribution** of the included set: tonics, and modes where they
  exist. The vocabulary column above shows that only Weimar documents modes.
  Billboard and Rock Corpus record tonic only, and Uspop 2002 and RWC-Pop
  have no keys. A modal-ranking track would need to know which partitions can
  feed it.
- **Traffic on scale degrees 1 and 6** (see #13): the share of chord-to-chord
  moves whose last chord sits on `bII` or the tritone, where `suggest()` has
  no rule.
- **Share of Harte chords outside the 17 qualities `src/chords.ts`
  supports**: maj, min, dim, aug, sus2, sus4, dom7, maj7, min7, min7b5, dim7,
  maj6, min6, add9, dom9, min9, dom7sus4. This decides how much a Harte parser
  would have to map, drop or reject.
