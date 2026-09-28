# DRAFT correction: the Hugging Face download figure counted datasets our own services read

Status: **DRAFT, HELD. Not published.** This draft changes nothing on councilof.ai or Hugging Face,
and it is not in `functions/api/corrections.ts`. It is meant to land together with the `/api/momentum`
split on branch `lane/card-producers-20260928`. The ledger entry below is ready to add to the ledger
at that point. Its id is assigned when it lands.

Owner ask: approve adding the entry to the corrections ledger in the same deploy as the split.

## What was published

`/interop/momentum-snapshot.json`, the build snapshot baked into the prerendered pages, has
`generated_at` 2026-09-28T08:52:51.882Z. It carries this figure:

- `hf_downloads_30d`, value **99,903**
- label: "dataset downloads on Hugging Face, last 30 days"
- as of: 2026-09-28T08:52:43.762Z

The home number strip, the site footer, /about and /tools all show that figure. The same figure,
read live from `GET /api/momentum` at 2026-09-28T14:06:12Z, was 86,527.

## What was wrong

The figure is a sum of Hugging Face's rolling 30-day download counts across every public csoai/*
dataset. Some of those datasets are read by our own code:

- **Pages functions** read six of them while answering requests:
  - `csoai/gspc-hub-cards`
  - `csoai/x402-bazaar-conformance`
  - `csoai/evidence-index`
  - `csoai/distribution-footprint`
  - `csoai/cross-ledger-supply`
  - `csoai/a2a-card-census`
- **Our jobs** read three as their working state:
  - `csoai/hub-queue`
  - `csoai/fleet-status`
  - `csoai/gspc-boards`

Hugging Face counts one download per IP address, repository and five-minute window, for GET or HEAD
(https://huggingface.co/docs/hub/datasets-download-stats), so our own reads are counted.

The rules line said that download counts include mirrors and automated traffic and are not people.
Even so, the figure put our own reads and everyone else's into one number, under a label that reads
as reach.

## What we can and cannot say about 99,903

- **How much of 99,903 was our own reads is UNMEASURED.** The split was not recorded when the figure
  was read, and Hugging Face's public API gives only today's rolling count, not the count at 08:52Z.
  No split of 99,903 is given here.
- At a later read, 2026-09-28T15:02:01Z, 130 public datasets were listed:
  - 40,559 downloads were on the nine datasets above;
  - 45,968 were on the other 121.

  Some of those 45,968 are also our own. Our publish, grading and mirroring jobs read some of the
  other datasets, and that share cannot be separated from Hugging Face's count. It is UNMEASURED.
- The total fell between the two reads because some datasets were made private on 28 September.
  - `csoai/councilof-ai-mirror` is one of them. Our corrections-watch job reads it, and its count is
    no longer publicly readable.
  - The other 30-day count is not a count of people, users or customers.

## What changed

- `GET /api/momentum` no longer publishes one Hugging Face download figure. It publishes two, and
  they are never added:
  - `hf_downloads_30d_self_read`: the datasets named in the payload's `hf_self_read` list, each with
    the files that read it;
  - `hf_downloads_30d_other`: every other public dataset. It carries
    `unmeasured: [{field: "self_share", state: "UNMEASURED"}]` with its reason.
- The home strip, footer and /tools show the second figure. /about shows both.
- `functions/api/momentum-selfread.test.ts` holds the list to the code, in both directions:
  - a Pages function that reads a dataset not on the list makes the test fail;
  - so does a list entry that no code reads.
- `HEAD /api/momentum` now answers like the GET (it answered the `/api` catch-all 404 before).

## Ledger entry (to add when the split lands)

```json
{
  "id": "C-2026-0928-NN",
  "date": "2026-09-28",
  "detected_at": "2026-09-28",
  "detected_by": "internal review",
  "published_at": "UNRECORDED",
  "timing_evidence": [
    "The build snapshot /interop/momentum-snapshot.json (generated_at 2026-09-28T08:52:51.882Z) carries hf_downloads_30d = 99903",
    "published_at is UNRECORDED: the deploy that first serves the split and this entry had not happened when the entry was written"
  ],
  "what_was_wrong": "The momentum figure 'dataset downloads on Hugging Face, last 30 days' (99,903 in the build snapshot of 2026-09-28T08:52Z; 86,527 read live at 14:06Z) was a sum over every public csoai/* dataset. It included nine datasets our own code reads. Pages functions read six of them while answering requests: gspc-hub-cards, x402-bazaar-conformance, evidence-index, distribution-footprint, cross-ledger-supply and a2a-card-census. Our jobs read three as their working state: hub-queue, fleet-status and gspc-boards. Hugging Face counts one download per IP address, repository and five minutes, so our own reads were counted. A rules line said downloads include automated traffic and are not people, but the number still put our own reads and everyone else's together under a label that reads as reach.",
  "how_caught": "An internal review of the Hugging Face dataset cards on 28 September listed which datasets our own code reads at request time or as job state, and found that the momentum figure did not separate them.",
  "status": "CORRECTED - two figures that are never added: downloads of the datasets our own services read (named in hf_self_read with their readers) and downloads of all other public datasets, with our own share inside the second marked UNMEASURED",
  "reached_the_public": true,
  "what_changed": "GET /api/momentum publishes hf_downloads_30d_self_read and hf_downloads_30d_other in place of hf_downloads_30d. The two are never added. The payload names the self-read datasets and the files that read them (hf_self_read), and functions/api/momentum-selfread.test.ts holds that list to the code in both directions. hf_downloads_30d_other carries unmeasured: self_share, because the public API gives no downloader identity and our publish, grading and mirroring jobs also read some of those datasets. The share of 99,903 that was our own is UNMEASURED: the split was not recorded at the time and cannot be read back. At 2026-09-28T15:02:01Z, 40,559 downloads were on the nine self-read datasets and 45,968 on the other 121 public datasets. The home strip, the footer and /tools show the second figure; /about shows both. How to re-check: GET https://huggingface.co/api/datasets?author=csoai&expand[]=downloads and sum downloads over the ids in hf_self_read and over the rest.",
  "evidence": [
    "https://councilof.ai/interop/momentum-snapshot.json (generated_at 2026-09-28T08:52:51.882Z, hf_downloads_30d 99903)",
    "https://councilof.ai/api/momentum (hf_self_read, hf_downloads_30d_self_read, hf_downloads_30d_other)",
    "https://huggingface.co/docs/hub/datasets-download-stats (how Hugging Face counts a dataset download)",
    "functions/api/_momentum.ts SELF_READ_DATASETS and functions/api/momentum-selfread.test.ts"
  ]
}
```
