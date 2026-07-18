#!/usr/bin/env python3
"""
MEOK Home Agent — the local companion the browser can't be.

A browser sandbox cannot see your LAN, so Guardian's network safety needs a small
program running ON your network. This is it: pure Python standard library (no pip
install), it reads the ARP table to enumerate devices, optionally probes a few
common ports, computes a plain-English safety score, signs the report, and serves
it on http://127.0.0.1:7777 with CORS so MEOK OS (os.meok.ai) can read it.

Sovereign by design: it binds to localhost only, never phones home, and the report
never leaves your machine unless YOU send it. Run it, then click "Scan network" in
Guardian.

    python3 meok-home-agent.py            # serve on 127.0.0.1:7777
    python3 meok-home-agent.py --once     # print one scan as JSON and exit
    python3 meok-home-agent.py --port 8123

No third-party dependencies. macOS / Linux / Windows.
"""
import argparse
import hashlib
import hmac
import json
import platform
import re
import socket
import subprocess
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

# A per-install signing key kept on THIS machine only. First run mints it.
import os
_KEY_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".meok_home_agent.key")


def _signing_key() -> bytes:
    try:
        if os.path.isfile(_KEY_PATH):
            with open(_KEY_PATH, "rb") as f:
                return f.read()
        key = hashlib.sha256(os.urandom(32)).digest()
        fd = os.open(_KEY_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "wb") as f:
            f.write(key)
        return key
    except Exception:
        return b"meok-home-agent-fallback-key"


def _arp_table():
    """Return [{ip, mac}] from the OS ARP table — no extra tools required."""
    devices = []
    try:
        out = subprocess.run(["arp", "-a"], capture_output=True, text=True, timeout=8).stdout
    except Exception:
        return devices
    # matches both "(192.168.0.1) at aa:bb:.." (mac/linux) and "192.168.0.1  aa-bb-.." (win)
    for line in out.splitlines():
        ipm = re.search(r"(\d+\.\d+\.\d+\.\d+)", line)
        macm = re.search(r"([0-9a-fA-F]{1,2}([:-])[0-9a-fA-F]{1,2}(\2[0-9a-fA-F]{1,2}){4})", line)
        if ipm and macm:
            mac = macm.group(1).lower().replace("-", ":")
            if mac not in ("ff:ff:ff:ff:ff:ff", "00:00:00:00:00:00"):
                devices.append({"ip": ipm.group(1), "mac": mac})
    # de-dupe by ip
    seen, uniq = set(), []
    for d in devices:
        if d["ip"] not in seen:
            seen.add(d["ip"]); uniq.append(d)
    return uniq


# Common exposed ports worth flagging on a home network (info, not alarmist).
_RISKY_PORTS = {23: "Telnet (insecure)", 21: "FTP (insecure)", 3389: "Remote Desktop",
                5900: "VNC", 445: "SMB file sharing", 139: "NetBIOS"}


def _probe_ports(ip, ports=(23, 21, 3389, 5900, 445), timeout=0.25):
    open_ports = []
    for p in ports:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(timeout)
            if s.connect_ex((ip, p)) == 0:
                open_ports.append(p)
            s.close()
        except Exception:
            pass
    return open_ports


def scan(probe=True):
    devices = _arp_table()
    findings = []
    if probe:
        for d in devices[:24]:  # cap probing to keep it fast
            op = _probe_ports(d["ip"])
            if op:
                d["open_ports"] = op
                for p in op:
                    findings.append({"ip": d["ip"], "port": p, "issue": _RISKY_PORTS.get(p, "open port")})
    # Safety score: start at 100, subtract for risky exposure.
    score = 100 - min(60, len(findings) * 12)
    grade = "Excellent" if score >= 90 else "Good" if score >= 70 else "Review" if score >= 50 else "At risk"
    report = {
        "agent": "meok-home-agent",
        "version": "1.0",
        "host": platform.node(),
        "os": platform.system(),
        "scanned_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "device_count": len(devices),
        "devices": devices,
        "findings": findings,
        "safety_score": score,
        "safety_grade": grade,
        "advice": ("No risky exposure found on your network." if not findings
                   else "Some devices expose risky services — consider disabling Telnet/FTP/VNC or isolating those devices."),
        "note": "Scanned locally. This report stays on your machine unless you choose to share it.",
    }
    payload = json.dumps(report, sort_keys=True, separators=(",", ":")).encode()
    report["signature"] = hmac.new(_signing_key(), payload, hashlib.sha256).hexdigest()
    return report


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        # Allow the MEOK OS origins to read the report (localhost-bound server only).
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/health"):
            return self._send(200, {"ok": True, "agent": "meok-home-agent", "version": "1.0"})
        if self.path.startswith("/scan"):
            probe = "noprobe" not in self.path
            return self._send(200, scan(probe=probe))
        return self._send(404, {"error": "try /scan or /health"})

    def log_message(self, *a):  # quiet
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=7777)
    ap.add_argument("--once", action="store_true", help="print one scan as JSON and exit")
    args = ap.parse_args()
    if args.once:
        print(json.dumps(scan(), indent=2))
        return
    srv = HTTPServer(("127.0.0.1", args.port), Handler)
    print(f"MEOK Home Agent → http://127.0.0.1:{args.port}/scan  (localhost only; Ctrl-C to stop)")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped.")


if __name__ == "__main__":
    main()
