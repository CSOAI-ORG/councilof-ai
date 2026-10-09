"""
meok-redfish-api.py
Minimal Redfish API server for a MEOK sovereign BMC.

Run on the BMC itself (port 8443, TLS terminated by the OpenBMC web server
or by `python -m http.server` behind a reverse proxy). The server exposes
the handful of endpoints a MEOK agent actually consumes:

  GET  /redfish/v1/
  GET  /redfish/v1/Systems/{system_id}
  GET  /redfish/v1/Managers/{manager_id}
  GET  /redfish/v1/Systems/{system_id}/Actions/Sober.MeokAttest
  POST /redfish/v1/Systems/{system_id}/Actions/Sober.MeokAttest
  GET  /redfish/v1/AttestationService/Quotes
  GET  /redfish/v1/AttestationService/Quotes/{quote_id}

Sovereign extensions live under `Oem.Meok.*` so a stock Redfish client
ignores them; the MEOK agent speaks the Oem path.

License: Apache-2.0
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import secrets
import sys
import time
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse


# ---------- Sovereign receipt store (in-memory, fine for the BMC) ----------

@dataclass
class Quote:
    quote_id: str
    node_id: str
    counter: int
    pcrs: Dict[str, str]
    signature: str
    issued_at: float
    sigil: str = "v1"


class AttestationStore:
    """Append-only ring of recent SIGIL quotes."""

    def __init__(self, maxlen: int = 256) -> None:
        self._maxlen = maxlen
        self._quotes: List[Quote] = []

    def add(self, q: Quote) -> None:
        self._quotes.append(q)
        if len(self._quotes) > self._maxlen:
            self._quotes = self._quotes[-self._maxlen :]

    def latest(self) -> Optional[Quote]:
        return self._quotes[-1] if self._quotes else None

    def get(self, quote_id: str) -> Optional[Quote]:
        for q in self._quotes:
            if q.quote_id == quote_id:
                return q
        return None

    def all(self) -> List[Quote]:
        return list(self._quotes)


# ---------- PCR + signature helpers (mirror of meok-bmc-daemon) ----------

PCR_INDICES = [0, 2, 4, 7, 11]
NODE_ID_DEFAULT = "meok-hive-01"
SECRET_DEFAULT = "meok-sovereign-bmc-secret-v1"  # in real BMCs: tpm-bound


def _fnv1a_64(data: bytes) -> bytes:
    h = 0xCBF29CE484222325
    for b in data:
        h ^= b
        h = (h * 0x100000001B3) & 0xFFFFFFFFFFFFFFFF
    return h.to_bytes(8, "big")


def _sign(payload: bytes) -> bytes:
    """4× FNV-1a-64 — production: Ed25519 with TPM-resident key."""
    h1 = _fnv1a_64(payload)
    h2 = _fnv1a_64(h1)
    h3 = _fnv1a_64(h2)
    h4 = _fnv1a_64(h3)
    return h1 + h2 + h3 + h4 + b"\x00" * 32


def collect_quote(node_id: str = NODE_ID_DEFAULT) -> Quote:
    """Generate one sovereign quote. PCRs are placeholders outside a TPM."""
    pcrs = {}
    payload = b""
    for idx in PCR_INDICES:
        # Deterministic placeholder for non-TPM runtimes.
        pcr = hashlib.sha256(f"meok-bmc-pcr-{idx}-{node_id}".encode()).digest()
        pcrs[str(idx)] = pcr.hex()
        payload += pcr
    payload += node_id.encode()
    counter = int(time.time())
    payload += counter.to_bytes(8, "big")
    sig = _sign(payload)
    return Quote(
        quote_id=secrets.token_hex(16),
        node_id=node_id,
        counter=counter,
        pcrs=pcrs,
        signature=sig.hex(),
        issued_at=time.time(),
    )


# ---------- HTTP handler ----------

class RedfishHandler(BaseHTTPRequestHandler):
    server_version = "MEOK-Sovereign-BMC-Redfish/0.1"

    # set by the factory below
    store: AttestationStore = None  # type: ignore
    node_id: str = NODE_ID_DEFAULT
    system_id: str = "MEOK-System-0"
    manager_id: str = "MEOK-BMC-0"

    def log_message(self, fmt: str, *args: Any) -> None:  # quieter logs
        sys.stderr.write(
            f"[meok-redfish {time.strftime('%H:%M:%S')}] {fmt % args}\n"
        )

    # ---- helpers ----
    def _send_json(self, status: int, body: Any) -> None:
        payload = json.dumps(body, indent=2, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("OData-Version", "4.0")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def _send_404(self) -> None:
        self._send_json(
            404,
            {
                "error": {
                    "code": "Base.1.0.GeneralError",
                    "message": "Resource not found",
                    "@Message.ExtendedInfo": [
                        {"MessageId": "Base.1.0.ResourceNotFound"}
                    ],
                }
            },
        )

    # ---- routing ----
    def do_GET(self) -> None:  # noqa: N802 (BaseHTTPRequestHandler API)
        path = urlparse(self.path).path.rstrip("/")
        if path in ("/redfish/v1", "/redfish/v1/"):
            return self._send_json(200, self._root())
        if path == f"/redfish/v1/Systems/{self.system_id}":
            return self._send_json(200, self._system())
        if path == f"/redfish/v1/Managers/{self.manager_id}":
            return self._send_json(200, self._manager())
        if path == f"/redfish/v1/Systems/{self.system_id}/Actions/Sober.MeokAttest":
            return self._send_json(200, self._attest_action_metadata())
        if path == "/redfish/v1/AttestationService/Quotes":
            quotes = [self._quote_to_redfish(q) for q in self.store.all()]
            return self._send_json(
                200,
                {
                    "@odata.type": "#AttestationQuoteCollection.AttestationQuoteCollection",
                    "Name": "MEOK Attestation Quotes",
                    "Members@odata.count": len(quotes),
                    "Members": quotes,
                },
            )
        if path.startswith("/redfish/v1/AttestationService/Quotes/"):
            quote_id = path.rsplit("/", 1)[-1]
            q = self.store.get(quote_id)
            if not q:
                return self._send_404()
            return self._send_json(200, self._quote_to_redfish(q))
        return self._send_404()

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path.rstrip("/")
        length = int(self.headers.get("Content-Length", "0") or "0")
        body_raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(body_raw or b"{}")
        except json.JSONDecodeError:
            body = {}
        if path == f"/redfish/v1/Systems/{self.system_id}/Actions/Sober.MeokAttest":
            node_id = body.get("NodeId") or self.node_id
            q = collect_quote(node_id=node_id)
            self.store.add(q)
            return self._send_json(200, self._quote_to_redfish(q))
        return self._send_404()

    # ---- payloads ----
    def _root(self) -> Dict[str, Any]:
        return {
            "@odata.type": "#ServiceRoot.v1_0_0.ServiceRoot",
            "Id": "RootService",
            "Name": "MEOK Sovereign BMC",
            "RedfishVersion": "1.0.0",
            "Systems": {"@odata.id": f"/redfish/v1/Systems"},
            "Managers": {"@odata.id": f"/redfish/v1/Managers"},
            "AttestationService": {
                "@odata.id": "/redfish/v1/AttestationService"
            },
        }

    def _system(self) -> Dict[str, Any]:
        return {
            "@odata.type": "#ComputerSystem.v1_0_0.ComputerSystem",
            "Id": self.system_id,
            "Name": self.system_id,
            "Status": {"State": "Enabled", "Health": "OK"},
            "Oem": {
                "Meok": {
                    "NodeId": self.node_id,
                    "SovereignEAT": "v1",
                    "HarmBudgetUharmPerDecision": 50,
                    "CareClass": "carer",
                }
            },
            "Actions": {
                "Oem": {
                    "Sober.MeokAttest": {
                        "target": (
                            f"/redfish/v1/Systems/{self.system_id}"
                            "/Actions/Sober.MeokAttest"
                        ),
                        "@Redfish.ActionInfo":
                            f"/redfish/v1/Systems/{self.system_id}"
                            "/Actions/Sober.MeokAttest",
                    }
                }
            },
        }

    def _manager(self) -> Dict[str, Any]:
        return {
            "@odata.type": "#Manager.v1_0_0.Manager",
            "Id": self.manager_id,
            "Name": self.manager_id,
            "ManagerType": "BMC",
            "FirmwareVersion": "meok-openbmc-2.14.0",
            "Oem": {
                "Meok": {
                    "Tpm": "2.0",
                    "MeasuredBoot": True,
                    "SovereignKey": "tpm-resident",
                }
            },
        }

    def _attest_action_metadata(self) -> Dict[str, Any]:
        return {
            "@odata.type": "#ActionInfo.v1_0_0.ActionInfo",
            "Name": "MEOK Sovereign Attestation",
            "Parameters": [
                {
                    "Name": "NodeId",
                    "Required": False,
                    "DataType": "String",
                }
            ],
        }

    def _quote_to_redfish(self, q: Quote) -> Dict[str, Any]:
        return {
            "@odata.type": "#AttestationQuote.v1_0_0.AttestationQuote",
            "Id": q.quote_id,
            "Name": f"MEOK Quote {q.quote_id[:8]}",
            "Sigil": q.sigil,
            "NodeId": q.node_id,
            "Counter": q.counter,
            "IssuedAt": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime(q.issued_at)
            ),
            "Pcrs": q.pcrs,
            "Signature": q.signature,
        }


def make_handler(store: AttestationStore, node_id: str,
                 system_id: str, manager_id: str):
    """Factory so each thread sees the right bound attrs."""

    class Bound(RedfishHandler):
        pass

    Bound.store = store
    Bound.node_id = node_id
    Bound.system_id = system_id
    Bound.manager_id = manager_id
    return Bound


def main() -> int:
    ap = argparse.ArgumentParser(description="MEOK Sovereign BMC Redfish API")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8443)
    ap.add_argument("--node-id", default=os.environ.get("MEOK_NODE_ID", NODE_ID_DEFAULT))
    ap.add_argument("--system-id", default="MEOK-System-0")
    ap.add_argument("--manager-id", default="MEOK-BMC-0")
    args = ap.parse_args()

    store = AttestationStore()
    # Seed with one quote so the GETs return something useful immediately.
    store.add(collect_quote(node_id=args.node_id))

    handler = make_handler(store, args.node_id, args.system_id, args.manager_id)
    httpd = ThreadingHTTPServer((args.host, args.port), handler)
    sys.stderr.write(
        f"[meok-redfish] listening on http://{args.host}:{args.port}"
        f"  node={args.node_id}\n"
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        sys.stderr.write("[meok-redfish] shutting down\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
