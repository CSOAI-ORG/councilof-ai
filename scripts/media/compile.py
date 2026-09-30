#!/usr/bin/env python3
"""Evidence -> media compiler (csoai.media-draft/0.1).

    compile.py RECORD_URL --out DIR [--allow-superseded] [--no-ots-upgrade]

Generated media may only ever RE-RENDER a signed, verified record. It never originates a claim.

For one record URL (https:// or file://) the compiler:

 1. re-fetches the record bytes and its siblings (<stem>.signed.json, <stem>.json.ots, <stem>.ots.json).
    A Hugging Face `resolve/<rev>/` URL is pinned to the dataset's current commit first, so all four
    files come from ONE revision;
 2. recomputes sha256(record) and VERIFIES the board signature: canonical payload sha256 ==
    signature.payload_sha256, payload.artifact.sha256 == sha256(record), payload.artifact.schema/as_of
    == the record's, and Ed25519 over the canonical payload under did:web:csoai.org#board-attestation-1
    taken live from https://csoai.org/.well-known/did.json. An altered-preimage control must FAIL.
    Any failure is a REFUSAL: nothing is written;
 3. checks the OpenTimestamps proof binds to sha256(record) (a proof over other bytes is a refusal),
    and asks the known calendars whether a pending commitment has been upgraded. It reports what the
    proof says; it never calls a calendar answer a Bitcoin-verified timestamp;
 4. refuses a record that a sibling record in the same dataset directory SUPERSEDES (corrections
    supersede; a superseded record is not re-promoted) unless --allow-superseded, in which case every
    output says SUPERSEDED;
 5. renders, from a per-schema spec of JSON paths (no spec -> refusal; the compiler never improvises a
    claim): a 1200x675 SVG card, an X post (<= 280 characters), a LinkedIn text and a 30-second video
    script. Each carries record id, date, sha256 prefix, signature state, OTS state, verify URL and the
    record's own limits;
 6. runs the number-provenance check: every number token in every emitted text must appear verbatim
    as a number in record.json (or, for provenance fields only, in the verified signed envelope).
    A number the record does not contain - including one rounded differently - is a refusal.

Nothing is posted anywhere. Posting is owner-gated. Exit codes: 0 compiled, 2 REFUSED, 1 usage/IO error.
"""
import argparse
import base64
import datetime
import hashlib
import html
import json
import os
import pathlib
import re
import sys
import tempfile
import textwrap
import urllib.parse
import urllib.request

SCHEMA = "csoai.media-draft/0.1"
CANONICAL_DID_DOC = "https://csoai.org/.well-known/did.json"
EXPECTED_DID = "did:web:csoai.org#board-attestation-1"
KEY_FRAGMENT = "#board-attestation-1"
UA = "CSOAI-media-compiler/0.1 (+https://councilof.ai)"
KNOWN_CALENDARS = ("https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org",
                   "https://finney.calendar.eternitywall.com", "https://btc.calendar.catallaxy.com")
X_LIMIT = 280
POSTING = "NOT POSTED. Drafts only; posting to any channel is owner-gated."


class Refusal(Exception):
    """The compiler will not emit anything for this record."""


# --------------------------------------------------------------------------- fetch

def sha(b):
    return hashlib.sha256(b).hexdigest()


def fetch(url, timeout=30):
    if url.startswith("file://"):
        return pathlib.Path(urllib.parse.urlparse(url).path).read_bytes()
    req = urllib.request.Request(url, headers={"user-agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def fetch_optional(url):
    try:
        return fetch(url)
    except Exception as e:  # noqa: BLE001 - absence is reported, never invented
        return None if "404" in str(e) or isinstance(e, FileNotFoundError) else e


HF_RE = re.compile(r"^https://huggingface\.co/datasets/(?P<repo>[^/]+/[^/]+)/resolve/(?P<rev>[^/]+)/(?P<path>.+)$")


def pin_url(url):
    """Pin an HF resolve URL to the dataset's current commit so every sibling comes from one revision."""
    m = HF_RE.match(url)
    if not m:
        return url, None
    info = json.loads(fetch(f"https://huggingface.co/api/datasets/{m['repo']}"))
    commit = info["sha"]
    return f"https://huggingface.co/datasets/{m['repo']}/resolve/{commit}/{m['path']}", commit


def siblings(url):
    head, name = url.rsplit("/", 1)
    if not name.endswith(".json"):
        raise Refusal(f"record URL must end in .json: {name}")
    stem = name[:-5]
    return {"signed": f"{head}/{stem}.signed.json", "ots_proof": f"{head}/{name}.ots", "ots_state": f"{head}/{stem}.ots.json"}


RECORD_NAME = re.compile(r"^record(\.v[0-9][0-9.]*)?\.json$")


def list_sibling_records(url):
    """Other record*.json files in the same directory (HF dataset or local dir)."""
    head, name = url.rsplit("/", 1)
    if url.startswith("file://"):
        d = pathlib.Path(urllib.parse.urlparse(head).path)
        return [f"{head}/{p.name}" for p in sorted(d.iterdir()) if RECORD_NAME.match(p.name) and p.name != name]
    m = HF_RE.match(url)
    if not m:
        return []
    info = json.loads(fetch(f"https://huggingface.co/api/datasets/{m['repo']}/revision/{m['rev']}"))
    base = m["path"].rsplit("/", 1)[0] + "/" if "/" in m["path"] else ""
    out = []
    for s in info.get("siblings", []):
        f = s["rfilename"]
        if f.startswith(base) and "/" not in f[len(base):] and RECORD_NAME.match(f[len(base):]) and f[len(base):] != name:
            out.append(f"{head}/{f[len(base):]}")
    return out


# --------------------------------------------------------------------------- verification

def canon(payload):
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def board_key(did_doc):
    from cryptography.hazmat.primitives.asymmetric import ed25519
    ms = [m for m in did_doc.get("verificationMethod", []) if m.get("id", "").endswith(KEY_FRAGMENT)]
    if len(ms) != 1:
        raise Refusal(f"DID document has {len(ms)} {KEY_FRAGMENT} keys (need exactly 1)")
    jwk = ms[0].get("publicKeyJwk") or {}
    if jwk.get("kty") != "OKP" or jwk.get("crv") != "Ed25519":
        raise Refusal("board key is not an Ed25519 OKP key")
    x = jwk["x"]
    return ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))), ms[0]["id"]


def verify_record(raw, signed_bytes, did_doc):
    """Return the verification facts, or raise Refusal. Pure: no network."""
    from cryptography.exceptions import InvalidSignature
    try:
        rec = json.loads(raw)
    except Exception as e:
        raise Refusal(f"record is not JSON: {e}")
    if signed_bytes is None or isinstance(signed_bytes, Exception):
        raise Refusal(f"no signed envelope could be fetched ({signed_bytes}); unsigned records are never rendered")
    try:
        env = json.loads(signed_bytes)
        payload, sig = env["payload"], env["signature"]
    except Exception as e:
        raise Refusal(f"signed envelope unreadable: {e}")
    c = canon(payload)
    if sha(c) != sig.get("payload_sha256"):
        raise Refusal("canonical payload sha256 != signature.payload_sha256 (envelope altered)")
    art = payload.get("artifact") or {}
    got = sha(raw)
    if art.get("sha256") != got:
        raise Refusal(f"record sha256 {got[:16]}... != signed artifact sha256 {str(art.get('sha256'))[:16]}... (record altered or wrong file)")
    if art.get("schema") != rec.get("schema") or art.get("as_of") != rec.get("as_of"):
        raise Refusal("signed artifact schema/as_of do not match the record")
    if sig.get("did") != EXPECTED_DID or sig.get("alg") != "Ed25519":
        raise Refusal(f"signature is not by {EXPECTED_DID} / Ed25519 (got {sig.get('did')} / {sig.get('alg')})")
    pk, kid = board_key(did_doc)
    try:
        s = bytes.fromhex(sig["sig_ed25519"])
    except Exception:
        raise Refusal("sig_ed25519 is not hex")
    try:
        pk.verify(s, c)
    except InvalidSignature:
        raise Refusal(f"Ed25519 signature does NOT verify under {kid}")
    for altered in (c + b" ", c[:-1]):
        try:
            pk.verify(s, altered)
            raise Refusal("altered-preimage control VERIFIED: the verifier is broken; refusing")
        except InvalidSignature:
            pass
    return rec, env, {"state": "VERIFIED", "did": sig["did"], "key_id": kid, "signed_at": sig.get("signed_at"),
                      "payload_sha256": sig["payload_sha256"], "record_sha256": got,
                      "checks": ["canonical payload sha256 == signature.payload_sha256",
                                 "payload.artifact.sha256 == sha256(record bytes)",
                                 "payload.artifact.schema/as_of == record schema/as_of",
                                 "Ed25519 verifies over the canonical payload",
                                 "altered-preimage controls (appended byte, dropped byte) rejected"]}


def ots_state(raw, proof, sidecar, upgrade=True):
    """What the OTS proof says about sha256(record). Proof over other bytes -> Refusal."""
    digest = hashlib.sha256(raw).digest()
    side = None
    if isinstance(sidecar, (bytes, bytearray)):
        try:
            side = json.loads(sidecar)
        except Exception:
            side = None
    if proof is None or isinstance(proof, Exception):
        return {"state": "NO_OTS_PROOF", "short": "OTS:none", "detail": f"no {'.ots'} proof fetched ({proof})"}
    if side and side.get("sha256") not in (None, sha(raw)):
        raise Refusal("OTS sidecar names a different record sha256")
    if side and side.get("ots_sha256") not in (None, sha(proof)):
        raise Refusal("OTS sidecar names a different proof sha256")
    try:
        from opentimestamps.core.serialize import BytesDeserializationContext
        from opentimestamps.core.timestamp import DetachedTimestampFile
        from opentimestamps.core.notary import PendingAttestation, BitcoinBlockHeaderAttestation
    except ImportError:
        st = (side or {}).get("state", "UNPARSED")
        return {"state": f"{st} (as stated by the sidecar; proof not parsed here)", "short": "OTS:unparsed", "detail": "opentimestamps not installed"}
    try:
        dtf = DetachedTimestampFile.deserialize(BytesDeserializationContext(proof))
    except Exception as e:
        raise Refusal(f"OTS proof does not parse: {e}")
    if dtf.file_digest != digest:
        raise Refusal("OTS proof is over different bytes than this record")
    atts = [a for _, a in dtf.timestamp.all_attestations()]
    upgraded, queried, errors = False, [], {}
    if upgrade and not any(isinstance(a, BitcoinBlockHeaderAttestation) for a in atts):
        from opentimestamps.calendar import RemoteCalendar

        def direct(stamp):
            if stamp.attestations:
                yield stamp
            for sub in stamp.ops.values():
                yield from direct(sub)
        for sub in list(direct(dtf.timestamp)):
            for a in list(sub.attestations):
                if isinstance(a, PendingAttestation) and a.uri in KNOWN_CALENDARS:
                    queried.append(a.uri)
                    try:
                        sub.merge(RemoteCalendar(a.uri).get_timestamp(sub.msg, timeout=15))
                        upgraded = True
                    except Exception as e:  # noqa: BLE001 - pending is the normal answer
                        errors[a.uri] = type(e).__name__
        atts = [a for _, a in dtf.timestamp.all_attestations()]
    btc_pairs = [(msg, a) for msg, a in dtf.timestamp.all_attestations() if isinstance(a, BitcoinBlockHeaderAttestation)]
    btc = sorted({a.height for _, a in btc_pairs})
    if btc:
        upgraded_bytes = None
        if upgraded:
            from opentimestamps.core.serialize import BytesSerializationContext
            ctx = BytesSerializationContext()
            dtf.serialize(ctx)
            upgraded_bytes = ctx.getbytes()
        checks = explorer_check(btc_pairs) if upgrade else {}
        base = {"bitcoin_block_heights": btc, "upgraded_in_memory": upgraded, "calendars_queried": queried,
                "explorer_checks": checks, "_upgraded_proof": upgraded_bytes}
        if any(v.get("match") is False for v in checks.values()):
            raise Refusal(f"OTS Bitcoin attestation does not match the block header's merkle root: {checks}")
        if checks and all(v.get("match") is True for v in checks.values()):
            return {**base, "state": "BITCOIN_BLOCK_ATTESTED_EXPLORER_CHECKED", "short": "OTS:bitcoin",
                    "detail": ("The proof commits sha256(record) into Bitcoin block merkle roots; each root matched the block header "
                               "served by a public block explorer (" + EXPLORER + "). Not checked against a local Bitcoin node.")}
        return {**base, "state": "BITCOIN_ATTESTATION_FROM_CALENDAR", "short": "OTS:bitcoin-unchecked",
                "detail": "The proof now contains a Bitcoin block-header attestation. This compiler did NOT check it against Bitcoin; `ots verify` against a node decides."}
    return {"state": "PENDING_CALENDAR_COMMITMENT", "short": "OTS:pending",
            "attestations": [type(a).__name__ for a in atts], "calendars_queried": queried, "calendar_answers": errors,
            "detail": "Calendars hold a commitment to sha256(record); no Bitcoin attestation yet. Not a Bitcoin timestamp."}


EXPLORER = "https://blockstream.info/api"


def explorer_check(pairs):
    """For each Bitcoin attestation: does the committed digest equal that block's merkle root (explorer byte order)?"""
    out = {}
    for msg, a in pairs:
        k = str(a.height)
        try:
            h = fetch(f"{EXPLORER}/block-height/{a.height}", timeout=20).decode().strip()
            blk = json.loads(fetch(f"{EXPLORER}/block/{h}", timeout=20))
            out[k] = {"block_hash": h, "merkle_root": blk["merkle_root"], "match": msg[::-1].hex() == blk["merkle_root"]}
        except Exception as e:  # noqa: BLE001 - unreachable explorer leaves the state unchecked, never passed
            out[k] = {"match": None, "error": type(e).__name__}
    return out


def supersession(url, rec_sha, did_doc, fetcher=fetch):
    """Return the verified sibling record that supersedes this one, or None. Unverifiable claims -> Refusal."""
    for sib in list_sibling_records(url):
        try:
            sraw = fetcher(sib)
            srec = json.loads(sraw)
        except Exception:
            continue
        sup = srec.get("supersedes") or {}
        if sup.get("sha256") != rec_sha:
            continue
        try:
            _, _, v = verify_record(sraw, fetch_optional(siblings(sib)["signed"]), did_doc)
        except Refusal as e:
            raise Refusal(f"{sib.rsplit('/', 1)[1]} claims to supersede this record but does not verify ({e}); resolve before compiling")
        return {"by_file": sib.rsplit("/", 1)[1], "by_sha256": v["record_sha256"], "by_version": srec.get("record_version"),
                "correction_scope": (srec.get("correction") or {}).get("scope")}
    return None


# --------------------------------------------------------------------------- specs (JSON paths only)

def get_path(rec, path):
    cur = rec
    for part in path.split("."):
        if isinstance(cur, list):
            cur = cur[int(part)]
        elif isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            raise Refusal(f"spec path {path!r} is absent from the record (the compiler never fills a gap)")
    return cur


def render_value(v):
    if isinstance(v, bool) or v is None:
        raise Refusal(f"refusing to render {v!r} as a figure")
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        s = repr(v)
        if float(s) != v:
            raise Refusal(f"float {v!r} does not round-trip")
        return s
    return str(v)


PH = re.compile(r"\{([A-Za-z0-9_.]+)\}")


def fill(template, rec, claims):
    def sub(m):
        v = get_path(rec, m.group(1))
        s = render_value(v)
        if isinstance(v, (int, float)):
            claims.append({"path": m.group(1), "value": v, "rendered": s})
        return s
    return PH.sub(sub, template)


# Each spec is data: templates whose every figure is a JSON path into the record. Free text in a
# template may contain a number only if the record contains that number verbatim (checked globally).
SPECS = {
    "csoai.a2a-card-census/0.1": {
        "kicker": "A2A agent cards, one registry",
        "headline": "{signatures.pct_verified}% of served A2A agent cards carry a signature that verifies",
        "sub": "{signatures.verified} of {signatures.cards_served} cards served; denominator is cards served, not listings",
        "facts": ["{signatures.signed} of {signatures.cards_served} served cards are signed ({signatures.pct_signed}%)",
                  "{signatures.failed} FAILED, {signatures.uncheckable} UNCHECKABLE, {signatures.no_signatures} carry no signatures",
                  "{read.n_planned} a2aregistry listings read; {states.CARD_SERVED} served a card"],
        "limits": "{read.read_state}: one registry's {read.n_planned} listings. Not a population total of A2A agents.",
        "limits_short": "One registry, {read.n_planned} listings; not a population total.",
        "caveat": "Not evidence {not_evidence_of.1}",
    },
    "csoai.hf-mcp-spaces-census/0.1": {
        "kicker": "Hugging Face Spaces tagged mcp-server",
        "headline": "{states.RESPONDED} of {read.frame_spaces} mcp-server Spaces answered MCP initialize",
        "sub": "{contacted.n} were RUNNING Gradio apps and contacted; {not_contacted.n} were never contacted",
        "facts": ["Not contacted: {states.RUNTIME_ERROR} RUNTIME_ERROR, {states.SLEEPING} SLEEPING, {states.PAUSED} PAUSED, {states.BUILD_ERROR} BUILD_ERROR",
                  "{states.SSE_ENDPOINT_ONLY} served a legacy SSE endpoint only; {states.NOT_MCP} answered, but not with MCP",
                  "Median tools per responding Space: {measured_tool_surface.tools_per_responding_space.median}"],
        "limits": "{read.read_state} over the {read.frame_spaces} Spaces tagged mcp-server; a tag is self-declared. Not a population total of MCP servers.",
        "limits_short": "{not_contacted.n} never contacted, by rule; tag self-declared; not a population total.",
        "caveat": "Not evidence {not_evidence_of.0}",
    },
    "csoai.mcp-remote-census/0.1": {
        "kicker": "Remote MCP endpoints in public catalogues",
        "headline": "{probe.states.RESPONDED} of {probe.n_attempted} remote MCP endpoints answered initialize",
        "sub": "{probe.states.AUTH_REQUIRED} refused without a credential; no credential was ever sent",
        "facts": ["{probe.states.NOT_MCP} NOT_MCP, {probe.states.UNREACHABLE} UNREACHABLE, {probe.states.TIMEOUT} TIMEOUT",
                  "Median tools per endpoint whose tools/list completed: {measured_tool_surface.per_endpoint_tool_count.median}",
                  "{probe.n_not_attempted} planned endpoints not attempted (robots.txt)"],
        "limits": "{probe.read_state}: the top 20% of one ordered plan ({probe.n_attempted} of {probe.n_planned} attempted). Not a population total.",
        "limits_short": "{probe.read_state}: top 20% of one plan; not a population total.",
        "caveat": "Not evidence {not_evidence_of.0}",
    },
}
SPECS["csoai.mcp-remote-census/0.1.1"] = SPECS["csoai.mcp-remote-census/0.1"]


# --------------------------------------------------------------------------- number provenance

NUM = re.compile(r"(?<![A-Za-z0-9_])(?<!\d[.,])\d+(?:[.,]\d+)*(?![A-Za-z0-9_])(?![.,]\d)")


def number_tokens(text):
    return [m.group(0) for m in NUM.finditer(text)]


def contains_number(source, tok):
    return re.search(r"(?<![A-Za-z0-9_])(?<!\d[.,])" + re.escape(tok) + r"(?![A-Za-z0-9_])(?![.,]\d)", source) is not None


ISO = re.compile(r"(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}(?:\.\d+)?)Z")


def iso_split(t):
    """Split ISO timestamps at T and Z so their parts are number tokens in outputs and sources alike."""
    return ISO.sub(r"\1 \2 Z", t)


def provenance_check(texts, record_text, envelope_text):
    """Every number in every text must appear verbatim in the record, or (provenance only) in the signed envelope."""
    violations, seen = [], {}
    record_text, envelope_text = iso_split(record_text), iso_split(envelope_text)
    texts = {k: iso_split(v) for k, v in texts.items()}
    for name, t in texts.items():
        for tok in number_tokens(t):
            if contains_number(record_text, tok):
                seen.setdefault(tok, "record.json")
            elif contains_number(envelope_text, tok):
                seen.setdefault(tok, "signed envelope (provenance)")
            else:
                violations.append({"output": name, "number": tok})
    return violations, seen


def svg_text(svg):
    return "\n".join(html.unescape(m) for m in re.findall(r">([^<>]+)<", svg) if m.strip())


# --------------------------------------------------------------------------- rendering

def esc(s):
    return html.escape(s, quote=False)


def wrap(s, width):
    return textwrap.wrap(s, width=width, break_long_words=False, break_on_hyphens=False) or [""]


def card_svg(m):
    W, H = 1200, 675
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{esc(m["headline"])}">',
           '<rect width="100%" height="100%" fill="#0f1720"/>',
           '<rect x="0" y="0" width="12" height="100%" fill="#e8b04a"/>',
           '<g font-family="DejaVu Sans, Helvetica, Arial, sans-serif" fill="#f3f4f6">']
    y = 70
    out.append(f'<text x="60" y="{y}" font-size="18" fill="#9aa4b2">{esc(m["kicker_line"])}</text>')
    y += 22
    for line in wrap(m["headline"], 38):
        y += 54
        out.append(f'<text x="60" y="{y}" font-size="46" font-weight="bold">{esc(line)}</text>')
    y += 44
    out.append(f'<text x="60" y="{y}" font-size="23" fill="#cbd5e1">{esc(m["sub"])}</text>')
    y += 10
    for f in m["facts"]:
        y += 34
        out.append(f'<text x="60" y="{y}" font-size="21" fill="#cbd5e1">- {esc(f)}</text>')
    y += 30
    lim = wrap("LIMITS  |  " + m["limits"], 84)
    out.append(f'<rect x="48" y="{y}" width="{W - 96}" height="{18 + 28 * len(lim)}" rx="6" fill="#2a2110" stroke="#e8b04a"/>')
    for line in lim:
        y += 28
        out.append(f'<text x="64" y="{y}" font-size="20" fill="#f5d38a">{esc(line)}</text>')
    y += 30
    for line in wrap(m["caveat"], 110)[:2]:
        y += 22
        out.append(f'<text x="60" y="{y}" font-size="17" fill="#9aa4b2">{esc(line)}</text>')
    fy = H - 76
    for line in m["provenance_lines"]:
        out.append(f'<text x="60" y="{fy}" font-size="15" fill="#9aa4b2" font-family="DejaVu Sans Mono, Menlo, monospace">{esc(line)}</text>')
        fy += 22
    out.append(f'<text x="{W - 40}" y="{H - 32}" font-size="16" font-weight="bold" fill="#e8b04a" text-anchor="end">{esc(m["badge"])}</text>')
    out.append("</g></svg>")
    if y > H - 100:
        raise Refusal(f"card layout overflows ({y}px); shorten the spec, never the limits")
    return "\n".join(out) + "\n"


def compile_record(url, out_dir, did_doc_url=CANONICAL_DID_DOC, allow_noncanonical_did=False,
                   allow_superseded=False, ots_upgrade=True, now=None):
    if did_doc_url != CANONICAL_DID_DOC and not allow_noncanonical_did:
        raise Refusal(f"DID document must be {CANONICAL_DID_DOC}")
    pinned, commit = pin_url(url)
    sib = siblings(pinned)
    raw = fetch(pinned)
    signed = fetch_optional(sib["signed"])
    did_doc = json.loads(fetch(did_doc_url))
    rec, env, sigv = verify_record(raw, signed, did_doc)
    ots = ots_state(raw, fetch_optional(sib["ots_proof"]), fetch_optional(sib["ots_state"]), upgrade=ots_upgrade)
    sup = supersession(pinned, sigv["record_sha256"], did_doc)
    if sup and not allow_superseded:
        raise Refusal(f"record is SUPERSEDED by {sup['by_file']} (sha256 {sup['by_sha256'][:12]}); compile that one")
    spec = SPECS.get(rec.get("schema"))
    if not spec:
        raise Refusal(f"no media spec for schema {rec.get('schema')!r}; the compiler never improvises a claim")

    claims = []
    rid = rec.get("record_id") or rec["schema"]
    ver = rec.get("record_version")
    date = rec["as_of"][:10]
    p12 = sigv["record_sha256"][:12]
    verify_url = rec.get("hf_dataset") or url
    sig_short = "sig VERIFIED" if did_doc_url == CANONICAL_DID_DOC else "sig VERIFIED (test key, not the board key)"
    sup_note = f"SUPERSEDED by {sup['by_file']}. " if sup else ""
    m = {"headline": fill(spec["headline"], rec, claims), "sub": fill(spec["sub"], rec, claims),
         "facts": [fill(f, rec, claims) for f in spec["facts"]], "limits": sup_note + fill(spec["limits"], rec, claims),
         "limits_short": fill(spec["limits_short"], rec, claims), "caveat": fill(spec["caveat"], rec, claims)}
    idv = rid + (f" v{ver}" if ver else "")
    m["kicker_line"] = f"MEASUREMENT RECORD  |  {spec['kicker']}  |  as of {date}"
    m["badge"] = "DRAFT - SUPERSEDED" if sup else "DRAFT"
    corr = ""
    if rec.get("supersedes"):
        corr = f"Record v{ver} supersedes v{rec['supersedes'].get('record_version')}; correction scope: {(rec.get('correction') or {}).get('scope')}."
    prov = {"record": idv, "date": date, "sha256_prefix": p12, "signature": f"{sig_short} ({sigv['did']})",
            "ots": ots["state"], "verify": verify_url}
    m["provenance_lines"] = [f"{idv}  |  as of {date}  |  sha256 {p12}",
                             f"{sig_short} under {sigv['did']}  |  OTS {ots['state']}",
                             f"verify: {verify_url}"]

    sig_x = "sig:VERIFIED" if did_doc_url == CANONICAL_DID_DOC else "sig:TEST-KEY"
    x = (("SUPERSEDED. " if sup else "") + f"{m['headline']}. {m['limits_short']} {idv} {date} sha256:{p12} {sig_x} "
         f"{ots['short']} {verify_url}")
    if len(x) > X_LIMIT:
        raise Refusal(f"X post is {len(x)} chars > {X_LIMIT}; shorten the spec, never drop provenance or limits")
    li = "\n".join([
        f"{m['headline']}.", "", m["sub"] + ".", "", *[f"- {f}" for f in m["facts"]], "",
        f"Limits: {m['limits']}", *( [corr] if corr else [] ), "",
        "What this record is not evidence of (quoted from the record):",
        *[f"- {t}" for t in rec.get("not_evidence_of", [])], "",
        f"Record: {idv}", f"As of: {rec['as_of']}", f"sha256: {sigv['record_sha256']}",
        f"Signature: {sig_short.replace('sig ', '', 1)} under {sigv['did']} (signed {sigv['signed_at']}); checked by this compiler at build time.",
        f"Timestamp (OTS): OpenTimestamps {ots['state']}. {ots['detail']}",
        f"Verify it yourself: {verify_url}",
        f"How: {(rec.get('verify') or {}).get('signature', 'see record.signed.json')}",
        "", "A measurement, not a certification, grade or endorsement of any agent, server or organisation.",
    ]) + "\n"
    shots = [
        {"shot": "A", "t_s": [0, 7], "on_screen": m["headline"], "voiceover": f"{m['headline']}."},
        {"shot": "B", "t_s": [7, 15], "on_screen": m["sub"], "voiceover": f"{m['sub']}. {m['facts'][0]}."},
        {"shot": "C", "t_s": [15, 23], "on_screen": "LIMITS  " + m["limits"], "voiceover": m["limits"]},
        {"shot": "D", "t_s": [23, 30], "on_screen": "\n".join(m["provenance_lines"]),
         "voiceover": f"Signed by the board key and checked before this video was made. Verify the record yourself on Hugging Face."},
    ]
    vo_words = sum(len(s["voiceover"].split()) for s in shots)
    script_txt = "\n".join(
        [f"VIDEO SCRIPT, THIRTY SECONDS (DRAFT)  {idv}", "Shot timings live in video-script.json (production metadata, not a claim).", ""]
        + [f"SHOT {s['shot']}\n  ON SCREEN: {s['on_screen']}\n  VOICE: {s['voiceover']}\n" for s in shots]
        + ["Provenance: " + " | ".join(m["provenance_lines"]), POSTING]) + "\n"
    if vo_words > 95:
        raise Refusal(f"voiceover {vo_words} words will not fit 30 seconds")
    svg = card_svg(m)

    texts = {"card.svg": svg_text(svg), "x.txt": x, "linkedin.txt": li, "video-script.txt": script_txt,
             "video-script.json:on_screen+voiceover": "\n".join(s["on_screen"] + "\n" + s["voiceover"] for s in shots)}
    violations, sources = provenance_check(texts, raw.decode("utf-8"), signed.decode("utf-8") + "\n" + p12 + "\n")
    for c in claims:
        if not contains_number(raw.decode("utf-8"), c["rendered"]):
            violations.append({"output": "spec", "number": c["rendered"], "path": c["path"], "why": "rendered figure not verbatim in record"})
    if violations:
        raise Refusal(f"number-provenance check failed: {violations[:5]}")

    out = pathlib.Path(out_dir)
    tmp = pathlib.Path(tempfile.mkdtemp(prefix=".mc-", dir=str(out.parent) if out.parent.exists() else None))
    files = {"card.svg": svg, "x.txt": x + "\n", "linkedin.txt": li, "video-script.txt": script_txt,
             "video-script.json": json.dumps({"schema": "csoai.media-video-script/0.1", "duration_s": 30, "voiceover_words": vo_words,
                                              "timing_note": "t_s is production metadata, not a claim, and is excluded from the number check",
                                              "shots": shots, "provenance": prov}, indent=1, ensure_ascii=False) + "\n"}
    for k, v in files.items():
        (tmp / k).write_text(v, encoding="utf-8")
    up = ots.pop("_upgraded_proof", None)
    if up:
        name = pinned.rsplit("/", 1)[1] + ".upgraded.ots"
        (tmp / name).write_bytes(up)
        ots["upgraded_proof_file"] = {"file": name, "sha256": sha(up),
                                      "note": "written for the owner: the published .ots is still the pending proof; this one carries the Bitcoin attestations"}
    manifest = {
        "schema": SCHEMA, "compiled_utc": now or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "rule": "Generated media only re-renders a signed, verified record; it never originates a claim.",
        "posting": POSTING,
        "source": {"record_url": url, "pinned_url": pinned, "hf_commit": commit, "record_id": rid, "record_version": ver,
                   "schema": rec["schema"], "as_of": rec["as_of"], "sha256": sigv["record_sha256"], "bytes": len(raw),
                   "signed_envelope_sha256": sha(signed)},
        "signature": {**sigv, "did_document": did_doc_url},
        "ots": ots, "supersession": sup or "none found among sibling records",
        "correction_carried": corr or None,
        "claims": claims,
        "number_provenance": {"rule": "every number token in every output text appears verbatim in record.json; provenance numbers (date, signed_at) may come from the verified signed envelope",
                              "violations": 0, "tokens_checked": len(sources), "sources": sources,
                              "excluded": ["SVG markup attributes (layout)", "video-script.json t_s timings (production metadata)"]},
        "png": "NOT_RENDERED: no SVG rasteriser on this host (rsvg-convert, ImageMagick, inkscape, cairosvg absent); none installed by rule",
        "outputs": {k: {"sha256": sha(v.encode("utf-8")), "chars": len(v)} for k, v in files.items()},
        "x_chars": len(x),
    }
    (tmp / "manifest.json").write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    out.mkdir(parents=True, exist_ok=True)
    for p in tmp.iterdir():
        os.replace(p, out / p.name)
    tmp.rmdir()
    return manifest


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("record_url")
    ap.add_argument("--out", required=True)
    ap.add_argument("--did-doc", default=CANONICAL_DID_DOC, help="tests only; any other value is labelled a test key")
    ap.add_argument("--allow-noncanonical-did", action="store_true")
    ap.add_argument("--allow-superseded", action="store_true")
    ap.add_argument("--no-ots-upgrade", action="store_true")
    a = ap.parse_args(argv)
    try:
        m = compile_record(a.record_url, a.out, a.did_doc, a.allow_noncanonical_did, a.allow_superseded, not a.no_ots_upgrade)
    except Refusal as e:
        print(f"REFUSED: {e}", file=sys.stderr)
        return 2
    print(f"COMPILED {m['source']['record_id']} sha256 {m['source']['sha256'][:12]} sig {m['signature']['state']} "
          f"ots {m['ots']['state']} x_chars {m['x_chars']} claims {len(m['claims'])} -> {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
