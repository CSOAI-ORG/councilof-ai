# CSOAI card conformance corpus

A standalone, versioned test corpus for the Council of AI signed **measurement
card** format. It exists so the record format — not any one implementation — is
the thing a verifier trusts. An independent party can download this directory,
run one command, and check itself against the same fixtures the reference ships.

The corpus imports no CSOAI code and needs nothing but the Python standard
library, so conforming to it does not mean conforming to Council of AI; it means
conforming to the published fixtures. Fixtures are **derived from the live signed
card_index** (councilof.ai/signed/card_index.json), not invented.

## Suites
- **card_v0** — is one card entry well-formed? (64-hex content hash, axis, ISO-8601
   timestamp, `signed:true`, kid). 1 positive from a live entry + 5 negatives.
- **card_set_v0** — across a set: how many conform, and where are the gaps
  (a duplicate content-hash, a declared-vs-actual count mismatch).

Each suite carries fixtures, an expected verdict per case, and an independent
checker (`_check_independent.py`) written from the schema alone.

## Running it
```
cd corpus
python run.py            # run both suites; exit 0 iff all cases match
python run.py --verify   # verify corpus bytes against MANIFEST.json
```
Reference result at publication: card_v0 6/6, card_set_v0 3/3, MANIFEST OK
(corpusDigest sha256:9be3d3f1…). A result that DISAGREES with the reference is
as welcome as one that agrees — file it (see below), with the reason.

## File a row
Ran it? Publish your result on a public, linkable surface and open an issue on
CSOAI-ORG/councilof-ai titled `CCC: <kind> by <you>`, stating your run kind
(reproduction of these checkers / independent implementation from the schema),
your commit, and the counts. There is no blacklist. Council of AI's own boards
are the subject here — this is the reciprocal of the runs we file against others.
