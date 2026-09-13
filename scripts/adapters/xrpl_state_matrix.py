"""XRPL 16-identity per-field state matrix (TUI-3, 2026-09-13 brief).

One honest row per locked identity, fields kept SEPARATE (the brief's core rule):
identity tuple, issuer account, on-ledger Domain, source-reported market fields,
transfer-control flags, and chain deployment. Field states: OBSERVED / STALE /
UNMEASURED / UNCHECKABLE.

Primary evidence: account_info JSON-RPC against a public XRPL server at the
validated ledger. The first successful response fixes a numeric ledger index for
all remaining account reads. Market-side values from xrpl.fi/api/metrics remain
explicitly source-reported observations; they are not promoted to independently
measured supply or holder counts.

Delta discipline: the adapter compares the freshly built matrix against the
committed one. No change -> zero leaves (sidecar UNCHANGED). Changed identities
produce one compact delta leaf each (field, from, to) plus one summary leaf.
Facts, not grades: a flag being set or unset is an observation, never a verdict.

Never raises: dark RPC AND dark metrics -> ABSENT / committed-matrix replay.
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

sys.path.insert(0, str(Path(__file__).resolve().parent))  # sibling adapters
from xrpl import LOCKED_16, METRICS_URL, fetch_metrics  # same source as xrpl.asset.state

PACK = "xrpl-16-state-matrix"
PACK_REL = Path("public/interop") / PACK
MATRIX_REL = PACK_REL / "matrix.json"
MIRRORS_REL = PACK_REL / "mirrors"
MANIFEST_REL = PACK_REL / "artefact-manifest.json"
RPC = "https://s1.ripple.com:51234/"
UA = {"User-Agent": "councilof-ai-watch/0.1"}
MAX_PAYLOAD_BYTES = 3072

# XRPL AccountRoot flags (lsf*) — transfer controls are on-ledger facts.
FLAGS = {
    0x00010000: "password_spent",
    0x00020000: "require_dest_tag",
    0x00040000: "require_auth",
    0x00080000: "disallow_xrp",
    0x00100000: "disable_master",
    0x00200000: "no_freeze",
    0x00400000: "global_freeze",
    0x00800000: "default_ripple",
    0x01000000: "deposit_auth",
    0x80000000: "allow_trustline_clawback",
}
TRANSFER_CONTROL_FIELDS = ("require_auth", "global_freeze", "no_freeze", "allow_trustline_clawback", "default_ripple")


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _canon(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _account_info(addr: str, fetch_rpc: Callable[[str, dict], bytes]) -> dict[str, Any]:
    """One account_info call. Returns the raw result dict; raises on transport error."""
    body = fetch_rpc(RPC, {"method": "account_info",
                           "params": [{"account": addr, "ledger_index": "validated"}]})
    return json.loads(body)


def _default_rpc(url: str, payload: dict) -> bytes:
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json", **UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def _decode_flags(flags: int) -> dict[str, bool]:
    return {name: bool(flags & bit) for bit, name in FLAGS.items()}


def _source_observation_state(source_as_of: str | None, observed_at: str) -> str:
    if not source_as_of:
        return "UNCHECKABLE"
    try:
        src = datetime.fromisoformat(source_as_of.replace("Z", "+00:00"))
        obs = datetime.fromisoformat(observed_at.replace("Z", "+00:00"))
        return "STALE" if (obs - src).total_seconds() > 48 * 3600 else "OBSERVED"
    except Exception:
        return "UNCHECKABLE"


def _identity_row(symbol: str, addr: str, acct: dict[str, Any] | None,
                  metric: dict[str, Any] | None, metrics_as_of: str | None,
                  observed_at: str) -> dict[str, Any]:
    states: dict[str, str] = {}
    row: dict[str, Any] = {"symbol": symbol, "issuer_address": addr, "field_states": states}

    if acct and isinstance(acct.get("result"), dict) and "account_data" in acct["result"]:
        data = acct["result"]["account_data"]
        states["identity"] = "OBSERVED"
        states["issuer_account"] = "OBSERVED"
        row["identity_basis"] = "locked registry tuple; not an issuer endorsement"
        row["ledger_index"] = acct["result"].get("ledger_index")
        dom_hex = data.get("Domain") or ""
        try:
            row["domain_on_ledger"] = bytes.fromhex(dom_hex).decode() if dom_hex else None
        except Exception:
            row["domain_on_ledger"] = None
            states["domain_on_ledger"] = "UNCHECKABLE"
        row["transfer_controls"] = {
            k: v for k, v in _decode_flags(int(data.get("Flags", 0))).items()
            if k in TRANSFER_CONTROL_FIELDS
        }
        states["transfer_controls"] = "OBSERVED"
        if row["domain_on_ledger"] is None and "domain_on_ledger" not in states:
            states["domain_on_ledger"] = "OBSERVED"  # absence is an observed fact
    else:
        states["identity"] = "UNCHECKABLE"
        states["issuer_account"] = "UNCHECKABLE"
        states["transfer_controls"] = "UNCHECKABLE"
        states["domain_on_ledger"] = "UNCHECKABLE"
        row["ledger_index"] = None

    if metric:
        reported_state = _source_observation_state(metrics_as_of, observed_at)
        row["supply"] = None
        row["holders"] = None
        row["source_reported_supply"] = metric.get("supply")
        row["source_reported_holders"] = metric.get("holders")
        row["metrics_as_of"] = metrics_as_of
        states["supply"] = "UNMEASURED"
        states["holders"] = "UNMEASURED"
        states["source_reported_supply"] = reported_state if row["source_reported_supply"] is not None else "UNMEASURED"
        states["source_reported_holders"] = reported_state if row["source_reported_holders"] is not None else "UNMEASURED"
        via = metric.get("verifiedVia")
        row["source_reported_toml_state"] = via or None
        states["source_reported_toml_state"] = reported_state if via else "UNMEASURED"
    else:
        row.update({
            "supply": None,
            "holders": None,
            "source_reported_supply": None,
            "source_reported_holders": None,
            "metrics_as_of": None,
            "source_reported_toml_state": None,
        })
        states["supply"] = states["holders"] = "UNMEASURED"
        states["source_reported_supply"] = states["source_reported_holders"] = "UNMEASURED"
        states["source_reported_toml_state"] = "UNMEASURED"

    # Chain deployment: this registry is XRPL-mainnet scoped; other chains are
    # the issuer's own claim, not measured here.
    states["chain_deployment"] = "UNMEASURED"
    row["chain_deployment"] = None
    row["source_reported_chain_deployment"] = ["xrpl-mainnet"] if metric else []
    states["source_reported_chain_deployment"] = (
        _source_observation_state(metrics_as_of, observed_at) if metric else "UNMEASURED"
    )
    row["cross_chain_deployments"] = "UNMEASURED — issuer-claimed deployments are not verified in this pack"
    # Reserve claim / attestation: separate field, sourced from the attestation
    # packs where the asset is covered; otherwise UNMEASURED. Never inferred.
    states["reserve_claim"] = "UNMEASURED"
    states["attestation"] = "UNMEASURED"
    return row


def _diff(prior: dict[str, Any], new: dict[str, Any]) -> list[dict[str, Any]]:
    """Per-identity field-level diff. Returns changed identities with field deltas."""
    p_rows = {r.get("symbol"): r for r in prior.get("identities", [])}
    changes = []
    for row in new.get("identities", []):
        sym = row.get("symbol")
        old = p_rows.get(sym)
        if old is None:
            changes.append({"symbol": sym, "kind": "added", "fields": []})
            continue
        field_changes = []
        for field in (
            "source_reported_supply", "source_reported_holders",
            "domain_on_ledger", "source_reported_toml_state",
        ):
            if old.get(field) != row.get(field):
                field_changes.append({"field": field, "from": old.get(field), "to": row.get(field)})
        if old.get("transfer_controls") != row.get("transfer_controls"):
            field_changes.append({"field": "transfer_controls",
                                  "from": old.get("transfer_controls"), "to": row.get("transfer_controls")})
        if field_changes:
            changes.append({"symbol": sym, "kind": "changed", "fields": field_changes})
    for sym in sorted(set(p_rows) - {r.get("symbol") for r in new.get("identities", [])}):
        changes.append({"symbol": sym, "kind": "removed", "fields": []})
    return changes


def _summary_leaf(matrix: dict[str, Any], changes: list[dict[str, Any]]) -> dict[str, Any]:
    state_counts: dict[str, int] = {}
    for row in matrix["identities"]:
        for state in row["field_states"].values():
            state_counts[state] = state_counts.get(state, 0) + 1
    payload = {
        "kind": "csoai.xrpl-identity-state-matrix/0.1",
        "status": "PROBED",
        "matrix_sha256": matrix["matrix_sha256"],
        "n_identities": len(matrix["identities"]),
        "n_changed": len(changes),
        "field_state_counts": state_counts,
        "ledger_index": matrix.get("ledger_index"),
        "observed_at": matrix.get("observed_at"),
        "rule": "issuer-account facts, source-reported market values, independently derived supply/holder results, deployment, reserve claim, attestation and controls stay separate",
        "matrix_url": f"https://councilof.ai/interop/{PACK}/matrix.json",
    }
    assert len(_canon(payload)) <= MAX_PAYLOAD_BYTES
    return {
        "surface": "public.notice",
        "subject": "XRPL 16-identity state matrix refresh",
        "as_of": matrix.get("observed_at"),
        "source_urls": [RPC, METRICS_URL, f"https://councilof.ai/interop/{PACK}/matrix.json"],
        "payload": payload,
        "unmeasured": ["supply", "holders", "chain_deployment", "reserve_claim", "attestation", "cross_chain_deployments"],
        "tags": ["xrpl", "identity-state-matrix", PACK],
    }


def _delta_leaf(change: dict[str, Any], matrix: dict[str, Any]) -> dict[str, Any]:
    sym = change["symbol"]
    fields = change["fields"][:6]  # cap
    payload = {
        "kind": "csoai.xrpl-identity-delta/0.1",
        "status": "DISCOVERED",
        "symbol": sym,
        "change_kind": change["kind"],
        "changed_fields": fields,
        "ledger_index": matrix.get("ledger_index"),
        "observed_at": matrix.get("observed_at"),
        "note": "a source change, recorded — never a verdict",
    }
    assert len(_canon(payload)) <= MAX_PAYLOAD_BYTES
    return {
        "surface": "public.notice",
        "subject": f"XRPL identity delta: {sym} {change['kind']}",
        "as_of": matrix.get("observed_at"),
        "source_urls": [RPC, METRICS_URL],
        "payload": payload,
        "unmeasured": [],
        "tags": ["xrpl", "identity-delta", PACK, f"symbol:{sym}"],
    }


def _load_committed(root_path: Path) -> dict[str, Any] | None:
    try:
        p = root_path / MATRIX_REL
        if p.is_file():
            d = json.loads(p.read_bytes())
            if isinstance(d, dict) and str(d.get("schema", "")).startswith("csoai.xrpl-identity-state-matrix/"):
                return d
    except Exception:
        pass
    return None


def collect(root: Any = None, *, fetch_rpc: Callable[[str, dict], bytes] | None = None,
            metrics: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build the matrix from live evidence; emit leaves only on change. NEVER raises."""
    live = fetch_rpc is None and metrics is None
    rpc = fetch_rpc or _default_rpc
    root_path = Path(root) if root is not None else Path(__file__).resolve().parents[2]

    try:
        m = metrics if metrics is not None else fetch_metrics()
        metrics_ok = bool(m.get("ok"))
        metrics_as_of = m.get("updatedAt")
        by_key = {}
        for a in m.get("assets") or []:
            sym = a.get("symbol") or a.get("currency") or ""
            addr = a.get("issuerAddress") or a.get("issuer_address") or ""
            if sym and addr:
                by_key[(sym, addr)] = a

        rows: list[dict[str, Any]] = []
        metas: list[dict[str, Any]] = []
        observed_at = _now()
        ledger_index = None
        rpc_dark = 0
        rpc_uncheckable = 0
        for locked in LOCKED_16:
            sym, addr = locked["symbol"], locked["issuer_address"]
            acct = None
            raw = None
            try:
                raw = rpc(RPC, {"method": "account_info",
                                "params": [{"account": addr, "ledger_index": ledger_index or "validated"}]})
                acct = json.loads(raw)
            except Exception:
                rpc_dark += 1
            if acct and ledger_index is None:
                ledger_index = (acct.get("result") or {}).get("ledger_index")
            if not (acct and isinstance(acct.get("result"), dict) and "account_data" in acct["result"]):
                rpc_uncheckable += 1
            # Never fall back to symbol-only matching: duplicate currency codes
            # on XRPL can belong to unrelated issuers.
            metric = by_key.get((sym, addr))
            rows.append(_identity_row(sym, addr, acct, metric, metrics_as_of, observed_at))
            if live and raw:
                try:
                    mid = f"account-info-{sym}.json"
                    meta = {"id": mid, "role": "on-ledger-account-info",
                            "source_url": f"{RPC} account_info {addr} @validated",
                            "fetched_at": observed_at, "http": 200,
                            "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}
                    mp = root_path / MIRRORS_REL
                    mp.mkdir(parents=True, exist_ok=True)
                    (mp / mid).write_bytes(raw)
                    (mp / (mid + ".meta.json")).write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n")
                    metas.append(meta)
                except Exception:
                    pass

        if rpc_dark == len(LOCKED_16) and not metrics_ok:
            committed = _load_committed(root_path)
            if committed is not None:
                return {"leaves": [], "sidecar": {"status": "MATRIX_REPLAY", "pack": PACK,
                                                  "note": "all sources dark — committed matrix unchanged",
                                                  "matrix_sha256": committed.get("matrix_sha256")}}
            return {"leaves": [], "sidecar": {"status": "ABSENT", "pack": PACK,
                                              "note": "RPC and metrics both dark; no committed matrix"}}

        matrix = {
            "schema": "csoai.xrpl-identity-state-matrix/0.1",
            "observed_at": observed_at,
            "ledger_index": ledger_index,
            "field_vocabulary": ["OBSERVED", "STALE", "UNMEASURED", "UNCHECKABLE"],
            "sources": {"account_info": RPC, "metrics": METRICS_URL},
            "source_limitations": {
                "metrics": "xrpl.fi values are source-reported and may be stale; holders must not be read as an independently enumerated holder or trust-line count",
                "account_info": "AccountRoot flags are issuer-account facts; applicability to a particular issued currency remains a separate question",
            },
            "identities": rows,
        }
        matrix["matrix_sha256"] = hashlib.sha256(_canon({k: v for k, v in matrix.items() if k != "matrix_sha256"})).hexdigest()

        committed = _load_committed(root_path)
        changes = _diff(committed, matrix) if committed else [
            {"symbol": r["symbol"], "kind": "added", "fields": []} for r in rows]

        # Persist derived outputs on any successful build (deterministic from
        # inputs); raw-byte mirrors stay live-only (they are evidence captures).
        try:
            (root_path / MATRIX_REL).parent.mkdir(parents=True, exist_ok=True)
            (root_path / MATRIX_REL).write_text(json.dumps(matrix, indent=1, sort_keys=True) + "\n")
            # delta history (append-only, machine-readable)
            if changes:
                hist = root_path / PACK_REL / "deltas.jsonl"
                with open(hist, "a", encoding="utf-8") as f:
                    f.write(json.dumps({"observed_at": observed_at, "ledger_index": ledger_index,
                                        "matrix_sha256": matrix["matrix_sha256"],
                                        "changes": changes}, sort_keys=True) + "\n")
        except Exception:
            pass
        if live:
            try:
                # manifest: all committed mirror metas
                artefacts = []
                for mp in sorted((root_path / MIRRORS_REL).glob("*.meta.json")):
                    try:
                        artefacts.append(json.loads(mp.read_bytes()))
                    except Exception:
                        continue
                (root_path / MANIFEST_REL).write_text(json.dumps(
                    {"schema": "csoai.artefact-manifest/0.1", "pack": PACK,
                     "as_of": observed_at, "artefacts": artefacts}, indent=2, sort_keys=True) + "\n")
            except Exception:
                pass

        if not changes:
            return {"leaves": [], "sidecar": {"status": "UNCHANGED", "pack": PACK,
                                              "matrix_sha256": matrix["matrix_sha256"],
                                              "ledger_index": ledger_index}}
        leaves = [_summary_leaf(matrix, changes)] + [_delta_leaf(c, matrix) for c in changes]
        return {"leaves": leaves, "sidecar": {"status": "CHANGED", "pack": PACK,
                                              "matrix_sha256": matrix["matrix_sha256"],
                                              "ledger_index": ledger_index,
                                              "n_changed": len(changes),
                                              "rpc_dark": rpc_dark,
                                              "rpc_uncheckable": rpc_uncheckable,
                                              "metrics_ok": metrics_ok}}
    except Exception as exc:
        return {"leaves": [], "sidecar": {"status": "ERROR", "pack": PACK, "reason": type(exc).__name__}}


if __name__ == "__main__":
    out = collect()
    print(json.dumps(out["sidecar"], indent=2, sort_keys=True))
    print(f"leaves: {len(out['leaves'])}")
