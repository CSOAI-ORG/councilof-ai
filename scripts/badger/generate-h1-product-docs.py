#!/usr/bin/env python3
"""generate-h1-product-docs.py — H1: prove each x402 SKU by bytes, write docs/product/<sku>.md.

RULES (override habit):
- Admit the caller plan and durable budget BEFORE probes. Write the nine observation
  documents and index only after all planned callers return valid HTTP observations.
  Unavailable/malformed observations preserve old product files; no paid result is inferred.
- Every number is DERIVED at run time from a live probe (bytes, sha256, counts).
- "signed" is only ever said about Ed25519-under-did:web verified cards; nothing
  else. Preview cards are labeled preview/unsigned explicitly when the API says so.
- ADVERTISE a SKU whose door either answers 200 with real bytes OR issues a PARSEABLE
  402 CARRYING accepts[]. Governor ruling, 06 Sep 2026: "a door that delivers its free
  preview inside the 402 body is still a door — the 402 is where the rail explains
  itself." The previous rule keyed on HTTP 200 and therefore excluded request-attestation
  permanently, however good its preview became — while the published offer column mapped
  95 of the 394 conformant Bazaar hosts to exactly that SKU. Only a door whose 402 does
  NOT parse into payment options is withheld, because a buyer cannot act on it.
"""

from __future__ import annotations

import hashlib
import fcntl
import os
import tempfile
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve()
OUT = ROOT.parents[2] / "docs" / "product"

BASE = "https://councilof.ai"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def x402_shape(body: bytes) -> dict:
    """Is this body a parseable x402 challenge carrying accepts[]?

    GOVERNOR RULING, 06 Sep 2026: "a door that delivers its free preview INSIDE the 402 body is
    still a door — the 402 is where the rail explains itself." So the test for whether a SKU can
    be advertised is whether the door ISSUES A PARSEABLE 402 WITH accepts[], not whether it
    answers 200. Parsed from the full body: the sample kept for the doc is truncated at 600 bytes
    and accepts[] can sit past that, so reading the sample would have re-created the same class of
    false negative this ruling exists to end.
    """
    try:
        d = json.loads(body)
    except Exception:
        return {"parseable": False, "accepts": 0, "version": None}
    if not isinstance(d, dict):
        return {"parseable": False, "accepts": 0, "version": None}
    accepts = d.get("accepts")
    csoai = d.get("csoai")
    preview = csoai.get("preview") if isinstance(csoai, dict) else None
    return {
        "parseable": True,
        "accepts": len(accepts) if isinstance(accepts, list) else 0,
        "version": d.get("x402Version"),
        "has_csoai_preview": isinstance(preview, dict),
    }


def probe(url: str, timeout: int = 20) -> dict:
    """Return {status, bytes, sha256, sample, error} for a URL."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            return {
                "url": url,
                "status": r.status,
                "bytes": len(body),
                "sha256": hashlib.sha256(body).hexdigest(),
                "sample": body[:600].decode(errors="replace"),
                "x402": x402_shape(body),
                "error": None,
            }
    except urllib.error.HTTPError as e:
        body = e.read()
        return {
            "url": url,
            "status": e.code,
            "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
            "sample": body[:600].decode(errors="replace"),
            "x402": x402_shape(body),
            "error": None,
        }
    except Exception as e:
        return {"url": url, "status": None, "bytes": 0, "sha256": "", "sample": "", "error": str(e)[:200]}


def verify_paths() -> dict:
    return {
        "gspc_verify": BASE + "/gspc-verify",
        "proof": BASE + "/api/proof?sha=<64-hex>",
        "root_json": BASE + "/root.json",
        "free_forever": "verification is free forever; a grade is never sold",
    }


def doc(sku: str, title: str, block: dict) -> str:
    """Render one SKU doc; block holds derived numbers + samples."""
    p_preview = block["preview"]
    p_resource = block["resource"]
    product_scope = {
        "commission-card": "For a reviewer collecting evidence about a format-admitted target. Request `?subject=<admitted-target>` with an optional `axis=<slug>`; format admission does not establish that a model is available or that a fresh measurement can run. Some wrapper-format targets are admitted for a receipt with fulfillment `UNFULFILLABLE` for fresh model work; they do not commission a fresh model measurement. The preserved `subject=csoai` example above is an unpaid observation, not an admitted paid target: a payment-bearing request for that ambiguous subject is refused before verification or settlement. Existing reserve matches use case-insensitive model-name text and the optional axis, not proof of exact subject identity.\n\nThe unpaid challenge can include `csoai.preview` with existing-card references, corpus metadata and an unread/uncheckable state. If the paid branch succeeds, it returns a card-v0 commission receipt, up to 24 existing-card references, the total reserve count, settlement references when available and `fresh_run: UNMEASURED`. It does not return a newly completed measurement. Check `signed` and `unsigned_reason`; a receipt can be unsigned, and root inclusion is separate. Queue completion and buyer acceptance are not established by the receipt.\n\nSource scope: [handler](https://github.com/CSOAI-ORG/councilof-ai/blob/8a8f9cf455a2f25682c6e1bdb737474d224e4753/functions/api/request-attestation.ts).",
        "evidence-bundle": "For an auditor or technical reviewer assembling the default preview or paid bundle for one declared obligation. Request `obligation=<article-50|article-53|dora|cra>` and an optional `subject=<filter>`; without a subject the selection is obligation-wide. Selection uses the optional subject substring and an obligation keyword; these lexical matching rules do not prove substantive relevance or conformity. Start with the unpaid preview; `bundle=1` selects the paid assembly request. For EU obligations, the separate free `format=procurement` view returns Article 53 and Article 50 rows together and rejects `bundle=1`.\n\nIf the paid branch succeeds, it returns the selected existing card objects, an OSCAL 1.1.0 assessment-results wrapper with observations and no conformity findings, and an assembly manifest. Zero selected cards remains `ASSEMBLED-EMPTY`. Assembly does not verify input-card signatures. The manifest can be unsigned; check its signing status and reason. A thrown assembly or signing error after payment is reported as PAID_NOT_DELIVERED and requires reconciliation before reissue; an honestly reported unsigned manifest is a different returned outcome. Its signature covers the canonical manifest payload, not the entire HTTP response. An `existing_pack` link is a separate referenced artifact. Registry `counsel_confirmed` is a reported field, not a legal conclusion established by this description.\n\nSource scope: [handler](https://github.com/CSOAI-ORG/councilof-ai/blob/cab65736bd06e980c3df57948cd474f28ce5d010/functions/api/evidence-bundle.ts).",
        "eu-ai-act-pack": "For a reviewer collecting evidence relevant to Article 50 or Article 53. The default preview and paid bundle select one obligation per request, with an optional subject-substring filter plus an obligation-keyword match. These lexical selection rules do not prove substantive relevance or conformity. This indexed example selects `article-53`; a linked Article 50 pack is a separate artifact. The free `format=procurement` view instead returns Article 53 and Article 50 rows together; it rejects `bundle=1`. Those combined preview rows do not change the single-obligation paid assembly contract.\n\nIf the paid assembly branch succeeds, its output is selected existing card objects, an OSCAL 1.1.0 observations wrapper and an assembly manifest. Empty selections remain empty, input-card signatures are not verified by assembly, and the manifest may be unsigned. Check the returned signing status and any paid-not-delivered response before considering reissue; the manifest signature covers its canonical payload, not the whole response. This is evidence for review, not a conformity finding, compliance opinion or certification.\n\nSource scope: [handler](https://github.com/CSOAI-ORG/councilof-ai/blob/cab65736bd06e980c3df57948cd474f28ce5d010/functions/api/evidence-bundle.ts).",
        "swift-bank-pack": "For a bank-evidence reviewer selecting existing observations for DORA. Start with the unpaid DORA preview. This indexed example uses subject=csoai as a case-insensitive textual selection, not an exact bank identity. The handler does not fetch the SWIFT census or bank-registry files, so those artifacts are not guaranteed contents of this pack.\n\nA successful paid assembly returns the selected existing card objects, an OSCAL observations wrapper with no conformity findings, and an assembly manifest with signing status. Zero selected cards remains ASSEMBLED-EMPTY; the preview count alone does not distinguish an empty selection from an unreadable corpus. Assembly does not verify input-card signatures. A signing exception after payment follows the paid-not-delivered reconciliation path. Registry counsel_confirmed is a reported declaration, not a legal conclusion.\n\nSource scope: [DORA selection and assembly](https://github.com/CSOAI-ORG/councilof-ai/blob/cab65736bd06e980c3df57948cd474f28ce5d010/functions/api/evidence-bundle.ts).",
        "xrpl-asset-evidence": "For a reviewer examining one asset already listed by the XRPL reader. Start with the free unsigned preview. A successful paid request returns one compact point-in-time card recording the account, domain and obligation observations produced by the named reads, with explicit gaps and signing status. It does not include the original raw reader or RPC response bodies.\n\nA domain PASS records the implemented linkage test; it does not establish reserves, ownership, safety or a rating. Holder and supply figures are cited from the reader, not recomputed. Account or metadata reads can be unavailable, and the card can remain UNMEASURED or carry UNCHECKABLE results. Signing is conditional and covers the canonical card payload; input-reader signatures and root inclusion are not verified here. Preview and paid requests read their inputs again, so their bytes need not match.\n\nSource scope: [asset evidence handler](https://github.com/CSOAI-ORG/councilof-ai/blob/8a8f9cf455a2f25682c6e1bdb737474d224e4753/functions/api/rwa/evidence.ts).",
        "signed-data-feed": "For a technical reviewer collecting one assembly of the available signal, watch, root and card-index data. Start with the free stream preview and, when the source reads are complete, the free assembly manifest. The old /api/eunomia-data source constructs a 308 redirect to /api/signed-data-feed with the query preserved; this description does not establish a successful old-client payment journey.\n\nA successful paid branch returns four parsed source JSON blocks, raw-source and canonical-block digests, an assembly manifest, and an unsigned method-and-URL request record. Original raw source responses are not embedded as byte arrays. Assembly creates no new feed or manifest signature and neither requires nor verifies a signature on every source block. Preserve and verify any source-provided signatures separately.\n\nClients can optionally pin the canonical-block digest with x-csoai-expected-feed-sha256. A changed complete revision is refused before payment verification; without that header no revision is pinned. Source completeness, content truth, signature validity, freshness, delivery and acceptance remain separate. No recurring cadence or universal response-time guarantee is established by this pull.\n\nSource scope: [canonical handler](https://github.com/CSOAI-ORG/councilof-ai/blob/8a8f9cf455a2f25682c6e1bdb737474d224e4753/functions/api/signed-data-feed.ts) and [assembly helper](https://github.com/CSOAI-ORG/councilof-ai/blob/8a8f9cf455a2f25682c6e1bdb737474d224e4753/functions/api/_eunomia_delivery.ts).",
        "provider-diff-feed": "For a reviewer collecting recorded provider-document changes. Start with the free index and inspect its as_of and readability fields. The paid history branch assembles the rows listed by index.recent_diffs, available leaf documents, state and current root. This is not an independently recovered complete history.\n\nOptional since selects newer rows while retaining rows with unreadable timestamps; the full index and state remain included. The provider and surface filters narrow the free rows only; they do not make a paid history request provider-only. Assembly adds no new batch signature and does not recompute or verify the returned leaf or root signatures. Inspect existing signatures, proof data, returned counts and unreadable fields independently. Missing required assembly inputs follow the paid-not-delivered handling; a contact or invoice reference is not an order, notification or payment. Daily cadence, robots enforcement and original-page retention are not established by this handler description.\n\nSource scope: [provider-diff handler](https://github.com/CSOAI-ORG/councilof-ai/blob/8a8f9cf455a2f25682c6e1bdb737474d224e4753/functions/api/feeds/provider-diff.ts).",
        "receipts-batch": "For a reviewer selecting historical measurement-card leaves within an inclusive from/to time window. Preview the window first. The route returns at most 200 existing leaves, reports matches and truncation, and retains fractional boundaries. This is a measurement-leaf batch, not customer-payment history or guaranteed full-window coverage.\n\nA successful paid branch returns card and proof objects, carrying-root references, the canonical batch hash, and a separate manifest committing that hash. Leaves can be unsigned; a signed field reports signature-field presence rather than successful signature verification. The handler does not verify or re-sign leaves, roots or proofs. Manifest signing is conditional, and thrown signing errors after payment require the paid-not-delivered reconciliation path.\n\nCompare the actual returned hash and verify retained leaves and proofs separately. Preview and paid requests fetch their inputs again; the preview does not reserve later bytes. Timestamp-only next_from is not a guarantee of exhaustive pagination when many leaves share a timestamp. Empty selections remain empty.\n\nSource scope: [batch handler](https://github.com/CSOAI-ORG/councilof-ai/blob/8a8f9cf455a2f25682c6e1bdb737474d224e4753/functions/api/receipts/batch.ts).",
        "art50-marking-evidence": "For a reviewer inspecting metadata markings on one input asset. Use the free unsigned preview to inspect the implemented C2PA and IPTC results and explicit gaps. The issuance branch can return a point-in-time card with the input digest, named check results and the status of its own conditional canonical-payload signature. That signature does not sign the whole detailed HTTP response.\n\nDetection, assertion and supported hard-binding checks, the embedded-key claim-signature check, and chain trust are separate results. Chain trust remains UNCHECKABLE in this implementation. NOT_DETECTED does not mean unmarked. Watermark and fingerprint detectors are outside its implemented coverage; metadata presence does not establish signer authority, freshness or Article 50 conformity.\n\nAn invoice reference is a buyer handoff, not proof of payment, acceptance, invoice issuance or notification. Generic handoff metadata does not establish that this handler makes no datastore writes. Subsequent requests read and measure the input again. Preserve the returned bytes and inspect signing status and gaps before making a narrower verification claim.\n\nSource scope: [marking-evidence handler](https://github.com/CSOAI-ORG/councilof-ai/blob/8a8f9cf455a2f25682c6e1bdb737474d224e4753/functions/api/art50/marking-evidence.ts) and [C2PA inspection](https://github.com/CSOAI-ORG/councilof-ai/blob/8a8f9cf455a2f25682c6e1bdb737474d224e4753/functions/_lib/c2pa.ts)."
    }.get(sku, "No source-qualified description is indexed for this identifier. Confirm the deliverable before payment; payment options alone do not establish availability or delivery.")
    md = [
        f"# {title}",
        "",
        f"`{sku}` — endpoint observations recorded on {now()}; not a current-availability or delivery claim.",
        "",
        "> Doctrine: measurement, not certification. Verification is free forever; a grade is never sold.",
        "> Statuses, byte counts and hashes are recorded at generation time; product scope below cites pinned source.",
        "",
        f"Start free: use the [verifier]({verify_paths()['gspc_verify']}) to check an existing public record. Review the unpaid preview or challenge below before considering payment.",
        "",
        "## 402 door",
        f"`{p_resource['url']}` — observed status **{p_resource['status']}**",
        (
            f"({p_resource['bytes']} B) — an HTTP 402 response was recorded;"
            " inspect its challenge before requesting a paid artifact."
            if p_resource["status"] == 402
            else f"({p_resource['bytes']} B) — NOTE: this resource did not return 402; status {p_resource['status']}. Investigate before advertising."
        ),
        "",
        "## Unpaid preview or challenge observation",
        f"`{p_preview['url']}` — status **{p_preview['status']}**, **{p_preview['bytes']} bytes**, `sha256 {p_preview['sha256'][:16]}…`",
        "",
        "```json",
        p_preview["sample"][:450],
        "```",
        "",
        # A PAID x402 DOOR ANSWERS 402, AND THAT IS THE DOOR WORKING.
        # This branch used to be `status == 200 and bytes > 0` -> DELIVERABLE, ELSE
        # "NOT DELIVERABLE today ... not advertised until a non-empty free preview exists".
        # Every correctly-behaving metered door therefore failed it, and the verdict it wrote into
        # docs/product/commission-card.md was then copied by generate-partner-offer-docs.py into
        # OFFER-commission-card.md and quoted again in SKU-INDEX.md. Three artefacts, one wrong
        # comparison. commission-card is the SKU that 95 of the 394 conformant Bazaar hosts are
        # mapped to in the published offer column, so the estate spent days telling itself that its
        # second-largest offer group could not be served.
        # A 402 carrying a valid challenge is a live paid door. Only an unreachable or unexpected
        # status is a reason not to offer something.
        # TWO AXES, NOT ONE. This branch used to collapse them: anything that was not a 200
        # became "NOT DELIVERABLE today ... not advertised until a non-empty free preview exists".
        # The docstring rule above it is a real policy and is kept — we do not ADVERTISE a SKU a
        # buyer cannot sample for free. But "we choose not to advertise it" is not "the door
        # cannot deliver it", and writing the second when we meant the first put a false claim
        # into docs/product/commission-card.md, from where generate-partner-offer-docs.py copied
        # it into OFFER-commission-card.md and SKU-INDEX.md quoted it again.
        # commission-card is the SKU 95 of the 394 conformant Bazaar hosts are mapped to in the
        # published offer column: the estate was mapping buyers to it and telling itself it could
        # not be served, at the same time. Probed with the `subject` its bazaar extension declares
        # REQUIRED, the door returns the signed cards, their hashes and corpus_as_of.
        # GOVERNOR RULING 06 Sep 2026 — THE 402 IS A DOOR.
        # "A door that delivers its free preview INSIDE the 402 body is still a door — the 402 is
        # where the rail explains itself. Key the rule on 'issues a parseable 402 with accepts[]',
        # not on HTTP 200."
        # What this replaced, and why it was wrong: the rule read `status == 200 and bytes > 0`,
        # else not advertised. request-attestation answers 402 and puts its FREE preview — the
        # signed cards, their hashes, corpus_as_of — inside the challenge body. No amount of
        # improving that preview could ever satisfy a status-keyed rule, so the SKU that 95 of the
        # 394 conformant Bazaar hosts are mapped to in the published offer column was structurally
        # unadvertisable. We were pointing buyers at it in a public dataset and declining to
        # advertise it on our own pages, at the same time.
        ("**UNPAID RESPONSE OBSERVED.** A non-empty response was recorded. Advertised under the existing gate; paid delivery is not established."
         if p_preview["status"] == 200 and p_preview["bytes"] > 0
         else ("**PAYMENT CHALLENGE OBSERVED.** Advertised under the existing gate. The challenge parses as x402"
               f" v{p_preview.get('x402', {}).get('version')} carrying"
               f" {p_preview.get('x402', {}).get('accepts')} accepts[] entr"
               f"{'y' if p_preview.get('x402', {}).get('accepts') == 1 else 'ies'}"
               f" ({p_preview['bytes']} bytes). Parsing accepts[] establishes payment options only. "
               + ("An unpaid csoai.preview object is present; its contents may be empty or uncheckable. "
                  if p_preview.get("x402", {}).get("has_csoai_preview", False)
                  else "No csoai.preview object was identified by this parser. ")
               + "Neither observation establishes a paid artifact, a new measurement or buyer acceptance.")
         if p_preview["status"] == 402 and p_preview.get("x402", {}).get("accepts", 0) > 0
         else "**NOT ADVERTISED — 402 without a parseable accepts[].** The door answers 402 but the"
              " body does not parse as an x402 challenge with payment options, so a buyer cannot"
              " act on it."
         if p_preview["status"] == 402
         else f"**UNVERIFIED.** Status {p_preview['status']}, {p_preview['bytes']} bytes —"
              " probe the door before this SKU is offered."),
        "",
        "## Buyer and paid output scope",
        product_scope,
        "Payment, returned artifact bytes, verification, receipt by the buyer and acceptance remain separate.",
        "",
        "## Verify path",
        f"- Board/verify: {verify_paths()['gspc_verify']}",
        f"- Merkle proof for any leaf: `{verify_paths()['proof']}`",
        f"- Public root: {verify_paths()['root_json']} (`verify.include` checks the leaf)",
        f"- {verify_paths()['free_forever']}",
        "",
        "## Ledger it feeds",
        block.get("ledger", "open registries published under /interop/ (read-only, hash-verifiable)."),
        "",
    ]
    return "\n".join(md)



CALLER_LIMIT = 20
CALLER_WINDOW_SECONDS = 3600
BUDGET_SCHEMA = "csoai.h1-caller-budget/2"


class RunControlError(Exception):
    pass


def control_paths() -> tuple[Path, Path, Path]:
    # An owner-selected persistent namespace can reuse the existing stamp name.
    # Missing/legacy state is never interpreted as a fresh zero-spend budget.
    configured = os.environ.get("CSOAI_H1_CONTROL_DIR")
    if configured and not Path(configured).is_absolute():
        raise RunControlError("owner control namespace must be absolute")
    directory = Path(configured) if configured else ROOT.parents[2] / "node_modules" / ".cache"
    stamp = directory / "h1-product-docs.last"
    return stamp, directory / "h1-product-docs.lock", directory / "h1-product-docs.pending"



def clock_sample() -> dict:
    # Linux's boot identity binds cross-process monotonic ticks. Unknown boot
    # history is refused rather than using wall time to expire caller charges.
    try:
        boot = Path("/proc/sys/kernel/random/boot_id").read_text(encoding="ascii").strip()
    except OSError as error:
        raise RunControlError("same-boot monotonic clock identity unavailable") from error
    if len(boot) != 36 or boot.count("-") != 4 or any(boot[i] != "-" for i in (8, 13, 18, 23)) or any(c not in "0123456789abcdef-" for c in boot):
        raise RunControlError("invalid boot identity")
    ticks, wall = time.monotonic(), time.time()
    if any(not isinstance(v, (int, float)) or isinstance(v, bool) or not (0 <= v < float("inf")) for v in (ticks, wall)):
        raise RunControlError("invalid clock sample")
    return {"boot_id": boot, "ticks": ticks, "wall": wall}


def read_budget(stamp: Path, clock: dict) -> dict:
    try:
        state = json.loads(stamp.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise RunControlError("budget history unavailable; existing owner must reconcile its persistent baseline") from error
    if not isinstance(state, dict) or state.get("schema") != BUDGET_SCHEMA:
        raise RunControlError("legacy or unknown budget history requires owner reconciliation; no automatic reset")
    ticks = clock["ticks"]
    if state.get("boot_id") != clock["boot_id"]:
        raise RunControlError("unknown boot history requires owner reconciliation; no wall-clock expiry")
    accounted = state.get("last_accounted_ticks")
    if not isinstance(accounted, (int, float)) or isinstance(accounted, bool) or not (0 <= accounted <= ticks):
        raise RunControlError("invalid, future or backwards monotonic accounting")
    completed = state.get("last_run_ticks")
    if completed is not None and (
        not isinstance(completed, (int, float)) or isinstance(completed, bool) or not (0 <= completed <= accounted)
    ):
        raise RunControlError("incoherent monotonic completion history")
    charges = state.get("charges")
    if not isinstance(charges, list) or "inflight" not in state:
        raise RunControlError("incomplete budget history")
    seen = set()
    for charge in charges:
        if not isinstance(charge, dict):
            raise RunControlError("invalid charge")
        token, timestamp, cost = charge.get("id"), charge.get("ticks"), charge.get("cost")
        if not isinstance(token, str) or not token or token in seen:
            raise RunControlError("invalid or duplicate reservation")
        seen.add(token)
        if not isinstance(timestamp, (int, float)) or isinstance(timestamp, bool) or not (0 <= timestamp <= accounted):
            raise RunControlError("invalid monotonic reservation timestamp")
        if type(cost) is not int or not (0 < cost <= CALLER_LIMIT):
            raise RunControlError("invalid reservation cost")
    if state["inflight"] is not None:
        raise RunControlError("interrupted reservation requires owner reconciliation; --force cannot clear it")
    return state


def check_admission(state: dict, clock: dict, planned: int, force: bool) -> list:
    if type(planned) is not int or not (0 < planned <= CALLER_LIMIT):
        raise RunControlError("caller plan does not fit the existing 20/hour limit")
    ticks = clock["ticks"]
    if clock["boot_id"] != state["boot_id"] or ticks < state["last_accounted_ticks"]:
        raise RunControlError("boot or monotonic clock changed")
    if not force and state["last_run_ticks"] is not None and ticks - state["last_run_ticks"] < CALLER_WINDOW_SECONDS:
        raise RunControlError("60-minute completion cooldown; --force bypasses cooldown only")
    recent = [dict(item) for item in state["charges"] if ticks - item["ticks"] < CALLER_WINDOW_SECONDS]
    if sum(item["cost"] for item in recent) + planned > CALLER_LIMIT:
        raise RunControlError("caller budget exhausted; --force never raises or bypasses 20/hour")
    return recent


def fsync_directory(directory: Path) -> None:
    fd = os.open(str(directory), os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def stage_text(path: Path, text: str) -> str:
    # Caller admits the destination directory first. Never create it here.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=str(path.parent),
            prefix=path.name + ".", suffix=".tmp", delete=False,
        ) as stream:
            temporary = stream.name
            stream.write(text)
            stream.flush()
            os.fsync(stream.fileno())
        return temporary
    except Exception:
        if temporary is not None:
            try:
                os.unlink(temporary)
            except OSError:
                pass  # Temporary cleanup is not a successful control-state commit.
        raise


def atomic_budget_write(stamp: Path, state: dict) -> None:
    temporary = stage_text(stamp, json.dumps(state, sort_keys=True, allow_nan=False) + "\n")
    try:
        os.replace(temporary, stamp)
        fsync_directory(stamp.parent)
    except Exception:
        try:
            os.unlink(temporary)
        except OSError:
            pass
        raise


def require_no_pending(pending: Path) -> None:
    try:
        pending.stat()
    except FileNotFoundError:
        return
    raise RunControlError("pending run marker requires owner reconciliation; no age/--force recovery")


def claim_pending(pending: Path, token: str, planned: int, clock: dict) -> None:
    # Protect a replace-success/fsync-failure outcome independently of the stamp.
    # A stable separate flock inode serializes this shared control namespace.
    fd = os.open(str(pending), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        stream.write(json.dumps({
            "schema": BUDGET_SCHEMA, "id": token, "cost": planned,
            "boot_id": clock["boot_id"], "ticks": clock["ticks"], "wall_at": clock["wall"],
        }) + "\n")
        stream.flush()
        os.fsync(stream.fileno())
    fsync_directory(pending.parent)


def refresh_reservation(stamp: Path, state: dict, token: str, clock: dict) -> None:
    ticks = clock["ticks"]
    if (
        clock["boot_id"] != state["boot_id"]
        or not isinstance(ticks, (int, float)) or isinstance(ticks, bool)
        or not (state["last_accounted_ticks"] <= ticks < float("inf"))
    ):
        raise RunControlError("boot or monotonic clock anomaly during reservation")
    matches = [item for item in state["charges"] if item["id"] == token]
    if len(matches) != 1:
        raise RunControlError("reservation missing or duplicated")
    # Charge the full plan through the latest invocation and final completion.
    # Wall time is receipt metadata only, never budget-expiry authority.
    matches[0]["ticks"] = ticks
    matches[0]["wall_at"] = clock["wall"]
    state["last_accounted_ticks"] = ticks
    state["last_wall_at"] = clock["wall"]
    atomic_budget_write(stamp, state)


def finish_reservation(stamp: Path, pending: Path, state: dict, token: str, outcome: str) -> None:
    clock = clock_sample()
    refresh_reservation(stamp, state, token, clock)
    state["last_run_ticks"] = clock["ticks"]
    state["last_run_wall_at"] = clock["wall"]
    state["inflight"] = None
    state["outcome"] = outcome
    atomic_budget_write(stamp, state)
    # Stamp/replace/fsync failure above leaves pending intact. Once durable
    # completion accounting is confirmed, cleanup may remove the marker;
    # a later cleanup fsync failure must not be described as marker retention.
    pending.unlink()
    fsync_directory(pending.parent)


def valid_observation(value: dict, url: str) -> bool:
    if not isinstance(value, dict) or value.get("url") != url or value.get("error") is not None:
        return False
    status, size, digest = value.get("status"), value.get("bytes"), value.get("sha256")
    return (
        type(status) is int and 100 <= status <= 599
        and type(size) is int and size >= 0
        and isinstance(digest, str) and len(digest) == 64
        and all(c in "0123456789abcdef" for c in digest)
        and isinstance(value.get("sample"), str) and isinstance(value.get("x402"), dict)
    )


def publish_outputs(out: Path, outputs: list) -> None:
    names = [name for name, _ in outputs]
    if len(names) != 10 or len(set(names)) != 10 or names[-1] != "_INDEX.json":
        raise RunControlError("expected exactly nine observation documents followed by their index")
    if any(Path(name).name != name for name in names):
        raise RunControlError("output name escapes the admitted directory")
    out.mkdir(parents=True, exist_ok=True)
    staged = []
    try:
        for name, text in outputs:
            path = out / name
            staged.append((stage_text(path, text), path))
        # Each replacement is atomic; the index is committed last. This is not
        # a ten-file transaction: any partial failure retains the durable
        # pending marker and blocks automatic retries until owner reconciliation.
        for temporary, path in staged:
            os.replace(temporary, path)
        fsync_directory(out)
    finally:
        for temporary, _ in staged:
            try:
                os.unlink(temporary)
            except OSError:
                pass


def request_plan() -> tuple[dict, dict]:
    preview_urls = {
        "commission_card": f"{BASE}/api/request-attestation",
        "evidence_bundle": f"{BASE}/api/evidence-bundle?obligation=article-50",
        "eu_ai_pack": f"{BASE}/api/evidence-bundle?obligation=article-53",
        "swift_bank_pack": f"{BASE}/api/evidence-bundle?obligation=dora",
        "xrpl_evidence": f"{BASE}/api/rwa/evidence?asset=RLUSD&preview=1",
        "data_feed": f"{BASE}/api/eunomia-data",
        "diff_feed": f"{BASE}/api/feeds/provider-diff",
        "receipts_batch": f"{BASE}/api/receipts/batch?from=2026-09-01&to=2026-09-05&preview=1",
        # 8 conformant Bazaar hosts are mapped to art50-marking-evidence in the published offer
        # column and it had no source doc, so no offer page either. The door needs a `url` that
        # resolves; an unreachable one returns a structured "uncheckable", which is the door
        # working and not a reason to omit the SKU.
        "art50_marking": f"{BASE}/api/art50/marking-evidence?url=https://councilof.ai/&preview=1",
    }

    resource_urls = {
        "commission_card": f"{BASE}/api/request-attestation?subject=csoai&axis=honesty",
        "evidence_bundle": f"{BASE}/api/evidence-bundle?obligation=article-50&subject=csoai&bundle=1",
        "eu_ai_pack": f"{BASE}/api/evidence-bundle?obligation=article-53&subject=csoai&bundle=1",
        "swift_bank_pack": f"{BASE}/api/evidence-bundle?obligation=dora&subject=csoai&bundle=1",
        "xrpl_evidence": f"{BASE}/api/rwa/evidence?asset=RLUSD",
        "data_feed": f"{BASE}/api/eunomia-data?feed=1",
        "diff_feed": f"{BASE}/api/feeds/provider-diff?history=1",
        "receipts_batch": f"{BASE}/api/receipts/batch?from=2026-09-01&to=2026-09-05",
        "art50_marking": f"{BASE}/api/art50/marking-evidence?url=https://councilof.ai/",
    }
    return preview_urls, resource_urls


def main() -> None:
    print("H1 — record endpoint observations; paid outcomes remain separate")
    unknown = [arg for arg in sys.argv[1:] if arg not in {"--force", "--dry"}]
    if unknown or "--dry" in sys.argv:
        print(f"usage: {Path(sys.argv[0]).name} [--force] [--dry]")
        print("  planned caller probes: 18 (nine previews plus nine resource variants); limit 20/hour")
        print("  --force bypasses completion cooldown only; never budget, state or lock controls")
        if unknown:
            print("REFUSING: unknown arguments — no calls or product writes")
        raise SystemExit(2 if unknown else 0)

    spec = [
        ("commission-card", "Commission receipt (request-attestation)", "commission_card",
         "public root + reveries: the card-index verification rail; nothing measured here is certificative."),
        ("evidence-bundle", "Evidence bundle mapped to an obligation", "evidence_bundle",
         "obligations ledger (/interop/obligations-ledger.json) + OSCAL observations."),
        ("eu-ai-act-pack", "EU AI Act pack (Article 50 / 53 transparency)", "eu_ai_pack",
         "Default preview and paid assembly select one obligation; the free format=procurement view combines Article 53 and Article 50 rows. /packs/eu-article-50 remains a separate linked artifact."),
        ("swift-bank-pack", "Bank evidence selected for DORA", "swift_bank_pack",
         "DORA lexical selection from the existing evidence corpus; no guaranteed SWIFT census or bank-registry inclusion."),
        ("xrpl-asset-evidence", "XRPL asset evidence card (per request)", "xrpl_evidence",
         "public.notice evidence cards + XRPL instrument registry (/interop/xrpl-issuer-registry.json)."),
        ("signed-data-feed", "Source-data feed assembly", "data_feed",
         "eunomia streams (signals index, First-Fine Watch) + public-root leaves."),
        ("provider-diff-feed", "Provider document diff feed", "diff_feed",
         "Published provider-diff index, available leaves, state and current root; history extent and cadence require separate evidence."),
        ("receipts-batch", "Receipts batch (historical measurement leaves)", "receipts_batch",
         "receipts corpus (preview shows counts + cap, not leaves)."),
        ("art50-marking-evidence", "Article 50 transparency marking evidence (per asset)", "art50_marking",
         "the asset itself is fetched at request time; evidence is what the marking said and when it "
         "was read. A measurement of a marking, never a judgement that the marking is lawful."),
    ]
    preview_urls, resource_urls = request_plan()
    keys = {row[2] for row in spec}
    planned = len(preview_urls) + len(resource_urls)
    if len(spec) != 9 or len(keys) != 9 or set(preview_urls) != keys or set(resource_urls) != keys or planned > CALLER_LIMIT:
        print("REFUSING: nine-output caller plan is incomplete or exceeds 20/hour", file=sys.stderr)
        raise SystemExit(2)
    print(f"  {planned} caller probe attempts; redirects and endpoint-internal effects are separate")
    force = "--force" in sys.argv
    try:
        stamp, lock_path, pending = control_paths()
        clock = clock_sample()
        state = read_budget(stamp, clock)
        require_no_pending(pending)
        check_admission(state, clock, planned, force)
        # Parent must already contain a reconciled budget baseline; do not
        # initialize history or create any directory as an admission side effect.
        with lock_path.open("a+b") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            clock = clock_sample()
            state = read_budget(stamp, clock)
            require_no_pending(pending)
            recent = check_admission(state, clock, planned, force)
            token = f"{os.getpid()}-{clock['ticks']:.9f}"
            claim_pending(pending, token, planned, clock)
            state["charges"] = recent + [{"id": token, "ticks": clock["ticks"], "wall_at": clock["wall"], "cost": planned}]
            state["last_accounted_ticks"] = clock["ticks"]
            state["last_wall_at"] = clock["wall"]
            state["inflight"] = {"id": token, "cost": planned, "phase": "probing"}
            state["outcome"] = "reserved"
            atomic_budget_write(stamp, state)
            observations = []
            for label, urls in (("preview", preview_urls), ("resource", resource_urls)):
                values = {}
                for key, url in urls.items():
                    refresh_reservation(stamp, state, token, clock_sample())
                    value = probe(url)
                    if not valid_observation(value, url):
                        finish_reservation(stamp, pending, state, token, "aborted_before_product_writes")
                        raise RunControlError("unavailable or malformed HTTP observation; old documents/index retained, full plan charged")
                    values[key] = value
                    print(f"  {label} {key}: status={value['status']} bytes={value['bytes']}")
                observations.append(values)
            probes, paid = observations
            outputs = []
            for sku, title, key, ledger in spec:
                block = {"preview": probes[key], "resource": paid[key], "ledger": ledger}
                outputs.append((f"{sku}.md", doc(sku, title, block)))
            index = {
                "schema": "csoai.product-docs-index/0.1", "as_of": now(), "sku_count": len(spec),
                "skus": [{"id": sku, "file": f"docs/product/{sku}.md"} for sku, _, _, _ in spec],
                "gates": "generated by scripts/badger/generate-h1-product-docs.py (probe-before-write)",
            }
            outputs.append(("_INDEX.json", json.dumps(index, indent=2)))
            state["inflight"]["phase"] = "publishing"
            atomic_budget_write(stamp, state)
            publish_outputs(OUT, outputs)
            finish_reservation(stamp, pending, state, token, "completed")
            print("  DONE — nine recorded-observation documents and index; no paid delivery asserted")
    except Exception as error:
        # Do not clear pending state or refund reservations after an uncertain
        # lock/stamp/publication error. Any partial output needs owner recovery.
        print(f"REFUSING: {error}", file=sys.stderr)
        raise SystemExit(2) from error


if __name__ == "__main__":
    main()
