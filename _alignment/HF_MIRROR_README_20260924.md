---
license: cc-by-4.0
---

# Council of AI — public evidence mirror

[councilof.ai](https://councilof.ai/) is the authoritative public site. This Hugging Face dataset keeps a second copy of selected public evidence so a reader can fetch and compare exact bytes from another host. A mirror listing is not an endorsement, a measurement, or a customer-use signal.

The [latest signed-card root pointer](interop__card-root-latest.json) names its dated root, SHA-256 digest, measurement time, and active-leaf count. Check that pointer's date and fetch the named root. Individual signed card URLs in a root may remain on the authoritative site even when those card files are not copied into this dataset.

On **24 September 2026 at 14:38:24 UTC**, the guarded fan-out checked **595 selected artifacts** from RunPod source commit `6112df273de808f4b7d9e257cc63137770dc131b`. Those 595 files passed anonymous Hugging Face byte readback against their selected SHA-256 digests. The dated [fan-out manifest](MIRROR-FANOUT-20260924T143824Z.json) records each selected path, origin URL, digest, and per-surface result. It is a snapshot of that run, **not** an inventory of every historical file in this dataset or proof that every file is still current.

The older `MIRROR-MANIFEST.json` is a 12-file snapshot from 09:18 UTC on 24 September. It is retained as a historical record and does not describe the 595-file fan-out. If this dataset and the origin disagree, treat the mirror as stale and use the origin's dated evidence and correction record.

CSOAI publishes measurements, not certification. A valid signature proves which bytes were signed by the named key; it does not prove that a measurement is correct or that a Bitcoin attestation has been independently confirmed.
