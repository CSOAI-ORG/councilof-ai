"""
GET /api/watchdog/data_lake — Production data lake status
Phase 500 · CSOAI Ltd UK 16939677 · MIT
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib import cors_headers


def handler(req):
    method = getattr(req, "method", "GET")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})
    if method != "GET":
        return _resp(405, {"error": "method_not_allowed"})

    # Try to import the data_lake module and report its status.
    payload: dict = {"ok": True, "data_lake": "unavailable", "reason": ""}
    try:
        _HERE = os.path.dirname(os.path.abspath(__file__))
        _API = os.path.dirname(_HERE)
        _ROOT = os.path.dirname(_API)
        if _ROOT not in sys.path:
            sys.path.insert(0, _ROOT)
        import data_lake  # type: ignore

        status = data_lake.backend_status()
        payload = {
            "ok": True,
            "data_lake": "available",
            "protocol": status.get("protocol"),
            "version": status.get("version"),
            "backends": status["payload"]["backends"],
            "primary_backend": status["payload"]["primary_backend"],
            "graph_backend": status["payload"]["graph_backend"],
            "row_counts": status["payload"]["row_counts"],
            "sqlite_path": status["payload"]["sqlite_path"],
            "care_floor": data_lake.CARE_FLOOR,
            "bft_quorum": data_lake.BFT_QUORUM,
            "crown_lineage": data_lake.CROWN_LINEAGE,
            "sigil_algo": data_lake.SIGIL_ALGO,
            "phase": "500",
            "degraded_persistence": (
                not status["payload"]["backends"]["postgres"]["available"]
            ),
        }
    except Exception as e:
        payload = {
            "ok": False,
            "data_lake": "import_error",
            "error": f"{type(e).__name__}: {e}",
            "phase": "500",
        }
    return _resp(200, payload)


def _resp(status, body):
    out = json.dumps(body).encode()
    return type("Resp", (), {
        "status_code": status,
        "headers": cors_headers(),
        "body": out,
        "body_str": out.decode(),
    })()


def app(environ, start_response):
    method = environ.get("REQUEST_METHOD", "GET")
    fake = type("Req", (), {"method": method})()
    resp = handler(fake)
    start_response(f"{resp.status_code} OK", list(resp.headers.items()))
    return [resp.body]
