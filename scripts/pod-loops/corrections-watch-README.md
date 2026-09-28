# corrections-watch

A daily re-check of the pages listed in `../corrections-that-did-not-travel-2026-09-17-v0.2.json`:
fifteen places where an organisation publicly corrected a published number and the superseded
number was still being served on 2026-09-17. On that day the page owners were told (see
`../corrections-that-did-not-travel-2026-09-22-v0.3.json`). This folder turns "still stale" into a
measured quantity: how many days, per page, since notification.

## What a reader sees

- `YYYY-MM-DD.json` — one file per run day. Never edited after the day; a re-run on the same day
  overwrites that day's file with the later fetch.
- `latest.json` — a byte-identical copy of the most recent dated file.
- `README.md` — this note.

Each file carries, per row (15 rows, the whole population of v0.2, read from the mirror at run time):

| field | meaning |
|---|---|
| `page` | the URL as cited in v0.2, re-fetched with a desktop-browser User-Agent |
| `fetched_at`, `http_status`, `final_url`, `content_length`, `last_modified`, `etag`, `body_sha256` | what the server answered, verbatim |
| `stale_probe` / `stale_fragments` / `stale_string_present` | the exact superseded string(s) looked for, each fragment's presence, and true only if **all** are present |
| `corrected_probe` / `corrected_fragments` / `corrected_string_present` | the corrected string(s); `null` where no corrected string can exist on that page (a withdrawal, a ranking flip) with the reason spelled out |
| `state` | `STALE_STILL_SERVED`, `BOTH_PRESENT`, `STALE_ABSENT`, `CORRECTED_VALUE_SERVED_STALE_ABSENT`, `STALE_ABSENT_CORRECTED_ABSENT`, or `UNCHECKABLE` |
| `notification_2026_09_17` | `DELIVERED`, `BOUNCED` or `NOT_NOTIFIED` for the owner of that page, carried from v0.3 |
| `days_stale_since_notification` | run date minus 2026-09-17, populated **only** where the stale string is present and the notification was delivered; otherwise `null` with a reason |
| `days_since_v02_observation` | run date minus 2026-09-17, for every row |

`hf_drop_3shot.total_hits` is the Hugging Face full-text hit count for `"DROP (3-shot)"` as the
served search page reported it at fetch time (1,332 on 17 Sep, 1,334 on 22 Sep).

`totals` spells out every denominator: 15 rows in v0.2; how many were served 200 and measured;
how many were UNCHECKABLE; of the pages whose owner was notified, how many still serve the stale
string. UNCHECKABLE rows are excluded from every numerator and every denominator that counts
presence. No rate is given without its `of`.

## Controls

Every run starts by proving the presence predicate can fail and can pass on the same code path
the rows use: a nonsense token must be absent from a known page and a known string must be
present; the same pair again on the PDF-extraction path using the first PDF served in the run.
If either misbehaves the run aborts and writes nothing. The observed control values are in
`controls`.

## The boundary

This is measurement, not certification. A row records what the bytes at a URL contained at
`fetched_at`, from one network location, once a day. It does not say why the page reads as it
does, does not attribute intent, and does not say anyone did anything wrong. Every corrector in
v0.2 did the hard part first: it found an error in its own work and said so in public.

Known limits, also carried inside every file: a substring in raw bytes is not the same as what a
human sees (hidden markup counts, JavaScript-drawn text does not); short fragments can match
unrelated text, which is why each fragment is reported separately; pypdf can split or join tokens;
a CDN, geo or login variant may serve different bytes elsewhere; this loop cannot see a reply to a
notification. Fifteen rows is the whole population, not a sample, and nothing here generalises
beyond these fifteen pages.

`signed: false`. The board signer runs as OIDC inside GitHub Actions, disabled account-wide. The
files are produced on a RunPod pod by `/workspace/lanes/loops/corrections-watch.py` and uploaded
with `huggingface_hub`; no GitHub is in the loop. v0.2 and v0.3 are read, never written.
