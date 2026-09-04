#!/usr/bin/env python3
"""Witness the ONE public root (never N leaves) from PUBLIC bytes only.

After publish_public_root.py commits public/root.json, this script:
  1. rebuilds the exact Ed25519 preimage (same canonicalisation as the signer) and
     verifies sig_ed25519 against did:web:csoai.org#board-attestation-1 (JWK from did.json);
  2. uploads a Rekor `rekord` entry carrying the preimage bytes + the raw signature +
     the board PEM public key (x509 pki format). Pure Ed25519 is rejected only by
     `hashedrekord`; `rekord` verifies it. Duplicate uploads dedupe (409 → existing entry);
  3. OpenTimestamps-stamps root.json bytes when the `ots` client is available and the
     calendars answer; otherwise records PENDING honestly;
  4. writes public/interop/root-witness-latest.json (+ dated copy), the Rekor entry file,
     and refreshes public/interop/root-witness-pointer.json with the drift computed.
No private key is used or needed. Existence/time of bytes — not certification.
"""
from __future__ import annotations
import argparse, base64, hashlib, json, os, re, shutil, subprocess, sys, time, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
ROOT_JSON = PUB / "root.json"
INTEROP = PUB / "interop"
DID_URL = "https://csoai.org/.well-known/did.json"
DID_ID = "did:web:csoai.org#board-attestation-1"
REKOR = "https://rekor.sigstore.dev"
ENVELOPE_FIELDS = ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"]


def canonical_bytes(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def board_pubkey() -> bytes:
    """Raw 32-byte Ed25519 public key for #board-attestation-1, from the live DID document."""
    req = urllib.request.Request(DID_URL, headers={"User-Agent": "csoai-root-witness/1 (+https://councilof.ai)", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            did = json.loads(r.read())
    except Exception as ex:  # DID apex is edge-protected for some clients; the repo mirrors it
        local = PUB / ".well-known" / "did.json"
        if not local.exists():
            raise SystemExit(f"did.json unreachable ({ex}) and no local mirror")
        did = json.loads(local.read_text())
    for vm in did.get("verificationMethod", []):
        if vm.get("id") == DID_ID:
            x = vm["publicKeyJwk"]["x"]
            return base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
    raise SystemExit(f"{DID_ID} not in {DID_URL}")


def verify(preimage: bytes, sig: bytes, raw_pub: bytes) -> bool:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    try:
        Ed25519PublicKey.from_public_bytes(raw_pub).verify(sig, preimage)
        return True
    except Exception:
        return False


def pem_of(raw_pub: bytes) -> bytes:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.hazmat.primitives import serialization
    return Ed25519PublicKey.from_public_bytes(raw_pub).public_bytes(
        serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)


def rekor_upload(preimage: bytes, sig: bytes, pem: bytes) -> dict:
    body = {"apiVersion": "0.0.1", "kind": "rekord", "spec": {
        "data": {"content": base64.b64encode(preimage).decode()},
        "signature": {"format": "x509", "content": base64.b64encode(sig).decode(),
                       "publicKey": {"content": base64.b64encode(pem).decode()}}}}
    req = urllib.request.Request(f"{REKOR}/api/v1/log/entries", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "Accept": "application/json", "User-Agent": "csoai-root-witness/1"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            out = json.loads(r.read()); uuid = next(iter(out)); e = out[uuid]
            return {"status": "WITNESSED", "uuid": uuid, "logIndex": e.get("logIndex"), "integratedTime": e.get("integratedTime"),
                    "logID": e.get("logID"), "entry": out, "new": True}
    except urllib.error.HTTPError as err:
        text = err.read().decode("utf-8", "replace")
        if err.code == 409:
            m = re.search(r"[0-9a-f]{80}", text + " " + (err.headers.get("Location") or ""))
            if m:
                uuid = m.group(0)
                with urllib.request.urlopen(f"{REKOR}/api/v1/log/entries/{uuid}", timeout=60) as r:
                    out = json.loads(r.read()); e = out[uuid]
                return {"status": "WITNESSED", "uuid": uuid, "logIndex": e.get("logIndex"), "integratedTime": e.get("integratedTime"),
                        "logID": e.get("logID"), "entry": out, "new": False}
        return {"status": "UNCHECKABLE", "reason": f"rekor HTTP {err.code}: {text[:160]}"}
    except Exception as ex:  # network — never fake a witness
        return {"status": "UNCHECKABLE", "reason": f"rekor unreachable: {ex}"[:200]}


def ots_stamp(path: Path, out: Path) -> dict:
    # Proof history is evidence. Never replace an existing proof with a fresh
    # calendar submission (which could silently downgrade confirmed -> pending).
    if out.exists():
        return ots_status_from_proof(path, out)
    exe = shutil.which("ots")
    if not exe:
        return {"status": "PENDING", "reason": "ots client not installed on this runner"}
    tmp = path.with_suffix(path.suffix + ".ots")
    tmp.unlink(missing_ok=True)
    try:
        subprocess.run([exe, "--no-cache", "stamp", "--timeout", "90", str(path)], check=True, capture_output=True, text=True, timeout=240)
        if tmp.exists():
            out.parent.mkdir(parents=True, exist_ok=True); shutil.move(str(tmp), str(out))
            return ots_status_from_proof(path, out)
    except Exception as ex:
        return {"status": "PENDING", "reason": f"calendars did not answer: {str(ex)[:120]}"}
    return {"status": "PENDING", "reason": "no .ots produced"}


def ots_status_from_proof(
    subject: Path,
    proof: Path,
    *,
    root_dir: Path = ROOT,
    public_dir: Path = PUB,
    observed_at: str | None = None,
) -> dict:
    """Derive OTS state from proof bytes and verify Bitcoin headers twice."""
    from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
    from opentimestamps.core.serialize import StreamDeserializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile

    with proof.open("rb") as handle:
        detached = DetachedTimestampFile.deserialize(StreamDeserializationContext(handle))
    subject_sha = hashlib.sha256(subject.read_bytes()).hexdigest()
    if bytes(detached.timestamp.msg).hex() != subject_sha:
        raise RuntimeError("existing OTS proof does not bind the current subject bytes")
    bitcoin, pending = [], 0
    for message, attestation in detached.timestamp.all_attestations():
        if isinstance(attestation, BitcoinBlockHeaderAttestation):
            bitcoin.append((bytes(message), attestation.height))
        elif isinstance(attestation, PendingAttestation):
            pending += 1
    proof_observed_at = observed_at or now()
    base = {
        "path": str(proof.relative_to(root_dir)),
        "url": "https://councilof.ai/" + str(proof.relative_to(public_dir)),
        "proof_sha256": hashlib.sha256(proof.read_bytes()).hexdigest(),
        "subject_sha256": subject_sha,
        "bitcoin_blocks": sorted({height for _, height in bitcoin}),
        "observed_at": proof_observed_at,
        "scope": "PUBLIC_ROOT_BYTES_ONLY",
    }
    if not bitcoin:
        return base | {
            "status": "STAMPED_PENDING_BITCOIN" if pending else "NO_ATTESTATION",
            "note": "Status is derived from the proof bytes. Pending is not a Bitcoin timestamp.",
        }

    height = sorted({height for _, height in bitcoin})[0]
    hash_urls = [
        f"https://blockstream.info/api/block-height/{height}",
        f"https://mempool.space/api/block-height/{height}",
    ]
    hashes = [urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read().decode().strip() for url in hash_urls]
    if len(set(hashes)) != 1 or not re.fullmatch(r"[0-9a-f]{64}", hashes[0]):
        raise RuntimeError("Bitcoin block sources do not agree on the attested height")
    block_hash = hashes[0]
    header_urls = [
        f"https://blockstream.info/api/block/{block_hash}/header",
        f"https://mempool.space/api/block/{block_hash}/header",
    ]
    headers = [urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read().decode().strip() for url in header_urls]
    if len(set(headers)) != 1 or not re.fullmatch(r"[0-9a-f]{160}", headers[0]):
        raise RuntimeError("Bitcoin block sources do not return one identical 80-byte header")
    header_bytes = bytes.fromhex(headers[0])
    calculated_hash = hashlib.sha256(hashlib.sha256(header_bytes).digest()).digest()[::-1].hex()
    if calculated_hash != block_hash:
        raise RuntimeError("Bitcoin header bytes do not hash to the source block id")
    if not all(message == header_bytes[36:68] for message, attested_height in bitcoin if attested_height == height):
        raise RuntimeError("Bitcoin header Merkle root does not satisfy the OTS attestation")
    block_time = int.from_bytes(header_bytes[68:72], "little")
    return base | {
        "status": "CONFIRMED_BITCOIN",
        "bitcoin_header": {
            "height": height,
            "block_hash": block_hash,
            "hex": headers[0],
            "header_sha256": hashlib.sha256(header_bytes).hexdigest(),
            "block_time_unix": block_time,
            "block_time": datetime.fromtimestamp(block_time, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "verified_at": proof_observed_at,
            "source_agreement": "BLOCKSTREAM_MEMPOOL_BYTE_IDENTICAL",
            "sources": header_urls,
        },
        "note": "Status is derived from the proof bytes. The Bitcoin timestamp proves these exact root.json bytes existed no later than the named block; it does not prove correctness, completeness, compliance, certification, or coverage of the separate signed-card corpus.",
    }


def eas_status(sha: str, interop_dir: Path = INTEROP) -> dict:
    """Return EAS state for these exact root bytes, never the log's global state."""
    p = interop_dir / "eas-root-attestations.json"
    if not p.exists():
        return {"status": "NOT_YET", "reason": "no attester key in GitHub secrets (EAS_ATTESTER_PRIVATE_KEY); schema bytes32 sha256,string as_of,string did"}
    log = json.loads(p.read_text())
    hit = next((a for a in log.get("attestations", []) if a.get("sha256") == sha), None)
    if hit:
        return {"status": "ATTESTED", "uid": hit.get("uid"), "url": hit.get("url"), "attester": hit.get("attester"), "chain": "base-mainnet"}
    return {
        "status": "NOT_YET",
        "reason": "no EAS attestation in the append-only log matches this root.json sha256",
        "log": "https://councilof.ai/interop/eas-root-attestations.json",
    }


def refresh_eas_metadata(public_dir: Path = PUB) -> int:
    """Refresh only the EAS rail after its chain-writing workflow step.

    Rekor upload and OTS submission are deliberately not repeated. The refresh
    proceeds only when the existing sidecar and pointer bind the exact current
    root bytes, so an older EAS record cannot promote a newer root.
    """
    root_path = public_dir / "root.json"
    interop_dir = public_dir / "interop"
    latest_path = interop_dir / "root-witness-latest.json"
    pointer_path = interop_dir / "root-witness-pointer.json"
    try:
        raw = root_path.read_bytes()
        root_sha = hashlib.sha256(raw).hexdigest()
        side = json.loads(latest_path.read_text())
        pointer = json.loads(pointer_path.read_text())
    except Exception as exc:
        print(f"EAS metadata refresh refused: witness files unreadable: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2

    artifact = side.get("artifact") if isinstance(side.get("artifact"), dict) else {}
    live_root = pointer.get("live_root") if isinstance(pointer.get("live_root"), dict) else {}
    if artifact.get("sha256") != root_sha or live_root.get("sha256") != root_sha:
        print("EAS metadata refresh refused: sidecar/pointer do not bind the current root bytes", file=sys.stderr)
        return 2

    status = eas_status(root_sha, interop_dir)
    observed_at = now()
    side.setdefault("witnesses", {})["eas_base"] = status
    side["as_of"] = observed_at
    pointer.setdefault("witnesses", {})["eas_base"] = status.get("status", "UNCHECKABLE")
    pointer["as_of"] = observed_at

    dated_value = (pointer.get("witness_sidecar") or {}).get("dated_copy")
    repo_root = public_dir.parent
    dated_path = repo_root / dated_value if isinstance(dated_value, str) and dated_value.startswith("public/") else None
    side_bytes = json.dumps(side, indent=1, ensure_ascii=False) + "\n"
    latest_path.write_text(side_bytes)
    if dated_path is not None and dated_path.is_file():
        dated_path.write_text(side_bytes)
    pointer_path.write_text(json.dumps(pointer, indent=1, ensure_ascii=False) + "\n")
    print(f"refreshed EAS witness metadata for {root_sha[:16]}: {status.get('status')}")
    return 0


LIVE_ROOT_URL = "https://councilof.ai/root.json"
# Cloudflare 403s the default Python-urllib UA on this zone (Error 1010), which would make every
# drift check come back UNCHECKABLE for a reason that has nothing to do with drift.
UA = "csoai-witness/1.0"


def compute_drift(
    witness_sha: str,
    witness_merkle: str,
    live_url: str = LIVE_ROOT_URL,
    *,
    timeout_seconds: int = 60,
) -> dict:
    """Compare the WITNESSED bytes against what a reader actually fetches, right now.

    WHY THIS FUNCTION EXISTS. The block it replaces was a tautology:

        "drift": {"status": "MATCH", "witness_artifact_sha256": sha, "live_root_sha256": sha,
                  "match_sha256": True, "match_merkle_root": True, ...}

    Every field came from the SAME `sha` and the SAME root object — it compared a value to itself
    and hardcoded the verdict, so `status` could never be anything but MATCH. A guard that cannot
    fail is not a guard, and this one is named `drift` and read as the answer to "are the anchored
    bytes still the live bytes?".

    It published a false all-clear. Observed 2026-09-04: the pointer said MATCH with
    live_root_sha256 728e8c5e… and bytes 4948, while https://councilof.ai/root.json was
    f0d8f22f… at 11588 bytes and a day newer. It was asserting MATCH about bytes it had never
    fetched. The old `reason` — "witness computed from the same root.json bytes this publish
    committed" — was true at the instant of writing, which is exactly the trap: a statement true
    only at write time, published as a standing fact and read days later.

    UNCHECKABLE is a distinct third state on purpose. A fetch that fails says nothing about
    drift, and must never collapse into MATCH.
    """
    try:
        req = urllib.request.Request(
            live_url,
            headers={"User-Agent": UA, "Accept": "application/json", "Cache-Control": "no-cache"},
        )
        with urllib.request.urlopen(req, timeout=timeout_seconds) as r:
            live = r.read()
    except Exception as e:  # network, DNS, HTTP error — anything
        return {"status": "UNCHECKABLE", "checked_at": now(), "checked_against": live_url,
                "witness_artifact_sha256": witness_sha, "witness_artifact_merkle_root": witness_merkle,
                "reason": f"could not fetch the live root ({type(e).__name__}: {e}) — this says nothing about drift"}
    live_sha = hashlib.sha256(live).hexdigest()
    try:
        live_merkle = json.loads(live).get("merkle_root")
    except Exception:
        live_merkle = None
    match_sha = live_sha == witness_sha
    match_merkle = live_merkle == witness_merkle
    ok = match_sha and match_merkle
    return {
        "status": "MATCH" if ok else "DRIFTED",
        "checked_at": now(),
        "checked_against": live_url,
        "witness_artifact_sha256": witness_sha, "live_root_sha256": live_sha,
        "witness_artifact_merkle_root": witness_merkle, "live_root_merkle_root": live_merkle,
        "live_root_bytes": len(live),
        "match_sha256": match_sha, "match_merkle_root": match_merkle,
        "reason": (
            "the live root a reader fetches is byte-identical to the witnessed bytes"
            if ok else
            "the live root differs from the witnessed bytes; this observation does not establish "
            "which is newer — publish the witnessed candidate or witness the live root before "
            "treating either as current"
        ),
    }


def recheck(
    *,
    public_dir: Path = PUB,
    check_only: bool = False,
    output: Path | None = None,
    attempts: int = 1,
    retry_delay_seconds: float = 0,
    timeout_seconds: int = 60,
    live_url: str = LIVE_ROOT_URL,
) -> int:
    """Re-evaluate drift on the EXISTING pointer without re-witnessing.

    This is what stops the pointer going quietly stale: the witness only runs when the root is
    republished, so between publishes nothing was re-examining whether the observation still held.
    With check_only=True the comparison is read-only and does not alter candidate or dist bytes.
    """
    ptr_path = public_dir.resolve() / "interop" / "root-witness-pointer.json"
    if not ptr_path.exists():
        print("no pointer to recheck"); return 1
    ptr = json.loads(ptr_path.read_text())
    witnessed = (ptr.get("live_root") or {}).get("sha256") or (ptr.get("drift") or {}).get("witness_artifact_sha256")
    merkle = (ptr.get("live_root") or {}).get("merkle_root") or (ptr.get("drift") or {}).get("witness_artifact_merkle_root")
    if not witnessed:
        print("pointer carries no witnessed sha256 — nothing to compare"); return 1
    drift: dict = {}
    for attempt in range(1, attempts + 1):
        drift = compute_drift(witnessed, merkle, live_url, timeout_seconds=timeout_seconds)
        print(
            f"drift attempt {attempt}/{attempts}: {drift['status']}  "
            f"witnessed={witnessed[:16]}  live={drift.get('live_root_sha256', '')[:16]}"
        )
        if drift["status"] == "MATCH":
            break
        if attempt < attempts:
            time.sleep(retry_delay_seconds)

    if not check_only:
        ptr["drift"] = drift
        ptr_path.write_text(json.dumps(ptr, indent=1, ensure_ascii=False) + "\n")
    if output is not None:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(drift, indent=1, ensure_ascii=False) + "\n")
    return 0 if drift["status"] == "MATCH" else 1


def selftest() -> int:
    """Prove DRIFTED and UNCHECKABLE are reachable. The block this replaced could reach neither."""
    import tempfile, http.server, threading, functools
    body = json.dumps({"merkle_root": "aa" * 32}).encode()
    d = tempfile.mkdtemp(); Path(d, "root.json").write_bytes(body)
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=d)
    srv = http.server.HTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{srv.server_port}/root.json"
    live_sha = hashlib.sha256(body).hexdigest()

    same = compute_drift(live_sha, "aa" * 32, url)
    other = compute_drift("00" * 32, "bb" * 32, url)
    interop = Path(d, "interop"); interop.mkdir()
    pointer_path = interop / "root-witness-pointer.json"
    pointer_path.write_text(json.dumps({
        "live_root": {"sha256": live_sha, "merkle_root": "aa" * 32},
        "drift": same,
    }))
    pointer_before = pointer_path.read_bytes()
    output_path = Path(d, "live-drift.json")
    read_only_rc = recheck(
        public_dir=Path(d),
        check_only=True,
        output=output_path,
        attempts=2,
        timeout_seconds=2,
        live_url=url,
    )
    srv.shutdown()
    gone = compute_drift(live_sha, "aa" * 32, "http://127.0.0.1:1/root.json")

    fails = []
    if same["status"] != "MATCH": fails.append(f"identical bytes should MATCH, got {same['status']}")
    if other["status"] != "DRIFTED": fails.append(f"different bytes should DRIFT, got {other['status']}")
    if gone["status"] != "UNCHECKABLE": fails.append(f"unreachable root should be UNCHECKABLE, got {gone['status']}")
    if gone.get("match_sha256") is not None: fails.append("UNCHECKABLE must not claim a comparison")
    if read_only_rc != 0: fails.append(f"read-only exact recheck should pass, got rc={read_only_rc}")
    if pointer_path.read_bytes() != pointer_before: fails.append("--check-only mutated the pointer")
    if json.loads(output_path.read_text()).get("status") != "MATCH": fails.append("--output did not record MATCH")
    with tempfile.TemporaryDirectory() as eas_dir:
        eas_path = Path(eas_dir)
        (eas_path / "eas-root-attestations.json").write_text(json.dumps({
            "status": "ATTESTED",
            "attestations": [{"sha256": "11" * 32, "uid": "old-root"}],
        }))
        if eas_status("22" * 32, eas_path).get("status") != "NOT_YET":
            fails.append("an older root's global EAS status promoted the current unattested root")
        if eas_status("11" * 32, eas_path).get("status") != "ATTESTED":
            fails.append("an exact-root EAS attestation was not discovered")
    with tempfile.TemporaryDirectory() as refresh_dir:
        refresh_public = Path(refresh_dir) / "public"
        refresh_interop = refresh_public / "interop"
        refresh_interop.mkdir(parents=True)
        refresh_raw = b'{"fixture":"root"}\n'
        refresh_sha = hashlib.sha256(refresh_raw).hexdigest()
        (refresh_public / "root.json").write_bytes(refresh_raw)
        side_fixture = {
            "as_of": "2026-09-04T12:00:00Z",
            "artifact": {"sha256": refresh_sha},
            "witnesses": {"eas_base": {"status": "NOT_YET"}},
        }
        pointer_fixture = {
            "as_of": "2026-09-04T12:00:00Z",
            "live_root": {"sha256": refresh_sha},
            "witness_sidecar": {"dated_copy": "public/interop/root-witness-fixture.json"},
            "witnesses": {"eas_base": "NOT_YET"},
        }
        (refresh_interop / "root-witness-latest.json").write_text(json.dumps(side_fixture))
        (refresh_interop / "root-witness-fixture.json").write_text(json.dumps(side_fixture))
        (refresh_interop / "root-witness-pointer.json").write_text(json.dumps(pointer_fixture))
        (refresh_interop / "eas-root-attestations.json").write_text(json.dumps({
            "status": "ATTESTED",
            "attestations": [{"sha256": refresh_sha, "uid": "exact-root"}],
        }))
        if refresh_eas_metadata(refresh_public) != 0:
            fails.append("exact-root EAS metadata refresh failed")
        else:
            refreshed_side = json.loads((refresh_interop / "root-witness-latest.json").read_text())
            refreshed_dated = json.loads((refresh_interop / "root-witness-fixture.json").read_text())
            refreshed_pointer = json.loads((refresh_interop / "root-witness-pointer.json").read_text())
            if refreshed_side.get("witnesses", {}).get("eas_base", {}).get("status") != "ATTESTED":
                fails.append("refresh did not promote the exact-root EAS witness")
            if refreshed_dated != refreshed_side:
                fails.append("refresh left the dated sidecar stale")
            if refreshed_pointer.get("witnesses", {}).get("eas_base") != "ATTESTED":
                fails.append("refresh left the pointer EAS state stale")
    for f in fails: print("FAIL:", f)
    print("selftest:", "FAILED" if fails else "ok — MATCH, DRIFTED and UNCHECKABLE all reachable")
    return 1 if fails else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--selftest", action="store_true")
    parser.add_argument("--recheck", action="store_true")
    parser.add_argument("--refresh-eas", action="store_true")
    parser.add_argument("--public-dir", type=Path, default=PUB)
    parser.add_argument("--check-only", action="store_true")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--attempts", type=int, default=1)
    parser.add_argument("--retry-delay-seconds", type=float, default=0)
    parser.add_argument("--timeout-seconds", type=int, default=60)
    parser.add_argument("--live-url", default=LIVE_ROOT_URL)
    args = parser.parse_args()
    if args.selftest:
        return selftest()
    if args.refresh_eas:
        return refresh_eas_metadata(args.public_dir)
    if args.attempts < 1 or args.attempts > 20:
        parser.error("--attempts must be between 1 and 20")
    if args.retry_delay_seconds < 0 or args.retry_delay_seconds > 300:
        parser.error("--retry-delay-seconds must be between 0 and 300")
    if args.timeout_seconds < 1 or args.timeout_seconds > 120:
        parser.error("--timeout-seconds must be between 1 and 120")
    if args.check_only and not args.recheck:
        parser.error("--check-only requires --recheck")
    if args.output is not None and not args.recheck:
        parser.error("--output requires --recheck")
    if args.recheck:
        return recheck(
            public_dir=args.public_dir,
            check_only=args.check_only,
            output=args.output,
            attempts=args.attempts,
            retry_delay_seconds=args.retry_delay_seconds,
            timeout_seconds=args.timeout_seconds,
            live_url=args.live_url,
        )
    raw = ROOT_JSON.read_bytes(); root = json.loads(raw)
    sha = hashlib.sha256(raw).hexdigest(); short = sha[:8]
    preimage = canonical_bytes({k: root[k] for k in ENVELOPE_FIELDS})
    sig = bytes.fromhex(root["sig_ed25519"])
    pub = board_pubkey(); ok = verify(preimage, sig, pub)
    print(f"root.json sha256={sha[:16]} merkle={root['merkle_root'][:16]} sig_verifies={ok}")
    if not ok:
        print("signature does not verify against the DID key — refusing to witness (nothing written)"); return 2
    rek = rekor_upload(preimage, sig, pem_of(pub))
    print("rekor:", {k: v for k, v in rek.items() if k != "entry"})
    INTEROP.mkdir(parents=True, exist_ok=True)
    if rek.get("entry"):
        (INTEROP / f"rekor-root-{short}.json").write_text(json.dumps(rek["entry"], indent=1) + "\n")
    ots = ots_stamp(ROOT_JSON, INTEROP / f"root-{short}.json.ots")
    print("ots:", ots)
    card_index = json.loads((PUB / "signed" / "card_index.json").read_text())
    signed_card_ids = {row.get("card") for row in card_index.get("cards", []) if isinstance(row, dict) and isinstance(row.get("card"), str)}
    root_leaf_ids = set(root.get("card_sha256", []))
    corpus_scope = {
        "relationship": "SEPARATE_CORPORA",
        "public_root_count": len(root_leaf_ids),
        "public_root_sha256": sha,
        "signed_card_count": len(card_index.get("cards", [])),
        "signed_card_id_overlap": len(root_leaf_ids & signed_card_ids),
        "ots_covers": "PUBLIC_ROOT_BYTES_ONLY",
        "note": f"The {len(root_leaf_ids)} public-root leaves and {len(card_index.get('cards', []))} separately indexed signed cards are separate corpora with {len(root_leaf_ids & signed_card_ids)} identifier overlap. This root and its OTS proof do not anchor the signed-card index.",
    }
    side = {
        "kind": "csoai.root-witness/v1", "as_of": now(),
        "note": "Witnesses for the live signed public root — existence/time of these exact bytes. Not certification, not endorsement, not a rank sale. Never mint a token. ONE root anchor, never N leaves.",
        "artifact": {"url": "https://councilof.ai/root.json", "also": "https://councilof.ai/api/root", "sha256": sha, "bytes": len(raw),
                      "merkle_root": root["merkle_root"], "card_count": root.get("card_count"), "as_of": root.get("as_of")},
        "corpus_scope": corpus_scope,
        "signature": {"did": DID_ID, "field": "sig_ed25519", "preimage_fields": ENVELOPE_FIELDS,
                       "preimage_canonical": "JSON sorted keys, separators (',',':'), ensure_ascii=false, UTF-8",
                       "preimage_sha256": hashlib.sha256(preimage).hexdigest(), "preimage_bytes": len(preimage), "verified_against_did_json": ok},
        "witnesses": {
            "rekor": {k: v for k, v in rek.items() if k != "entry"} | ({"url": f"{REKOR}/api/v1/log/entries?logIndex={rek['logIndex']}", "type": "rekord/x509 over the preimage bytes with the board signature", "entry_file": f"https://councilof.ai/interop/rekor-root-{short}.json"} if rek.get("logIndex") is not None else {}),
            "ots": ots,
            "eas_base": eas_status(sha),
            "xrpl_memo": {"status": "NOT_YET", "reason": "needs a funded XRPL account (owner); one memo tx carrying sha256(root.json)"},
        },
        "verify_hints": ["https://councilof.ai/signed/HOW-TO-VERIFY-ROOT.md"],
    }
    latest = INTEROP / "root-witness-latest.json"; dated = INTEROP / f"root-witness-{now()[:10]}-{short}.json"
    for p in (latest, dated): p.write_text(json.dumps(side, indent=1, ensure_ascii=False) + "\n")
    ptr_path = INTEROP / "root-witness-pointer.json"
    ptr = json.loads(ptr_path.read_text()) if ptr_path.exists() else {"kind": "csoai.root-witness-pointer/v0"}
    ptr.update({"as_of": now(),
                "note": "Timestamped pointer for the witnessed root. Drift is an observation at checked_at, not a standing all-clear. Existence/time of bytes — not certification, not endorsement, not a rank sale. Never mint a token.",
                "live_root": side["artifact"],
                "witness_sidecar": {"url": "https://councilof.ai/interop/root-witness-latest.json", "path": str(latest.relative_to(ROOT)), "status": "PUBLISHED", "dated_copy": str(dated.relative_to(ROOT))},
                # Computed against the LIVE root a reader fetches — never against the local bytes
                # we just witnessed, which is a comparison of a value with itself. Before the
                # candidate is deployed this may legitimately read DRIFTED. checked_at makes this
                # a timestamped observation; it is never published as a standing live verdict.
                "drift": compute_drift(sha, root["merkle_root"]),
                "corpus_scope": corpus_scope,
                # Proof observation exists before Bitcoin confirmation.  A
                # pending proof has no bitcoin_header by definition, so its own
                # observed_at is the authoritative timestamp for this state.
                "witness_status_observed_at": ots.get("observed_at") or (ots.get("bitcoin_header") or {}).get("verified_at") or side["as_of"],
                "witnesses": {"rekor": side["witnesses"]["rekor"].get("status"), "ots": ots.get("status"), "eas_base": side["witnesses"]["eas_base"].get("status", "UNCHECKABLE"), "xrpl_memo": "NOT_YET"}})
    ptr_path.write_text(json.dumps(ptr, indent=1, ensure_ascii=False) + "\n")
    print("wrote", latest.name, dated.name, ptr_path.name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
