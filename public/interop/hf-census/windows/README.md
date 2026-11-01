# Dated Hub census windows

This directory is the **history** of the daily Hugging Face Hub census.

The rolling register one level up (`public/interop/hf-census/`) holds the
**latest** window. The census-delta workflow overwrites five fixed paths on
every run, so each window replaces the one before it. A window that was never
merged therefore existed **only in its pull request branch** — and closing
those branches would have deleted eleven dated observations that are recorded
nowhere else.

Each subdirectory here is one such window, copied byte-for-byte from the
branch that produced it. `INDEX.json` lists every one with its window, its
counts, the PR that carried it, and the branch it came from.

## What a window is

A **count of discovered Hub listings** over a six-hour overlapping window.

| Field | What it means |
| --- | --- |
| `n` | unique Hub listing ids actually fetched in the window |
| `n_measured` | **always 0** |
| `status_all` | **always UNMEASURED** |
| `listing_state_all` | always DISCOVERED |

A listing is **DISCOVERED**, not measured. `n` is not a grade, not a rank, not
a certificate, and **not a cumulative total** — consecutive windows overlap
by design, so the numbers are not meant to be summed. `n_measured` stays 0
because MEASURED is minted only when the signer signs a card; see
`public/interop/hf-census/README.md` for the register format.

## The files in a window directory

| File | What it was |
| --- | --- |
| `SUMMARY.json` | the window's counts and its `window_start` / `window_end` |
| `axis-sources.json` | which listings could source each of the 22 axes |
| `org-register.json` | who runs what: org `n` + Hub card links |
| `hub-census-delta.json` | the signed-shape delta summary for the window |
| `delta.SUMMARY.json` | the same summary as the workflow wrote it |

The two summary files are the same artefact at two published paths; both are
kept so the window can be read exactly as the workflow wrote it.

## Why these windows are not merged

The rolling register in `public/interop/hf-census/` had already advanced past
every one of them. Merging any of them would have published an **older**
`n` over a newer one — the count would have gone backwards in the public
record while looking like a fresh measurement. They are archived here instead,
and their pull requests are closed as superseded.

## Reproducing

```bash
python3 scripts/census/archive_windows.py --plan     # print the windows
python3 scripts/census/archive_windows.py --apply    # copy them in
python3 scripts/census/archive_windows.test.py       # 5 tests
```

The archiver reads each branch **inside its own iteration**. `git fetch`
overwrites `FETCH_HEAD` on every fetch, so a version that read it after the
loop filed every window under the last branch's bytes. The regression test
for that is in the test file.

CSOAI measures. This is a record of what was counted and when. It is not a
certification, and it grades nothing.
