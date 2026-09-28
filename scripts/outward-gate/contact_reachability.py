#!/usr/bin/env python3
"""Contact reachability: would this address accept mail? Asked before any note is sent.

MEASURES only. For each address it:
  0. looks the address up in our hard-bounce ledger (built from real bounce notices),
  1. resolves MX (falling back to A, per RFC 5321 s5.1),
  2. opens SMTP on port 25 and asks RCPT TO for the address,
  3. in a second session, asks RCPT TO for a random address at the same domain (the must-fail control),
  4. QUITs. It never sends DATA, so no message is ever delivered.
At most one connection per second.

Known limit (measured 28 Sep 2026): Exchange Online without directory-based edge blocking answers
"250 Recipient OK" for a mailbox that does not exist and bounces later (hello@gotrust.be -> 550 5.1.10).
RCPT acceptance therefore never proves a mailbox exists; only a rejected control makes it evidence.
The bounce ledger is what catches that case after its first bounce.

Verdicts:
  BOUNCED_BEFORE the address is in the hard-bounce ledger -> do not send
  ACCEPTS       real address 250, control 5xx -> the server distinguishes mailboxes and took this one
  ACCEPT_ALL    both 250 -> the server takes anything; existence UNMEASURED
  ACCEPTS_UNCONTROLLED  real 250, control 4xx/error -> existence UNMEASURED
  REJECTED      real address 5xx (e.g. 550 5.1.10 unknown recipient) -> do not send
  TEMPFAIL      4xx (greylisting, rate limit) -> UNMEASURED, retry later
  NO_MAIL_HOST  no MX and no A -> do not send
  UNREACHABLE   no MX host answered on port 25 (egress blocked?) -> UNMEASURED
  SENDER_REFUSED  the server refused OUR connecting host before, or instead of, judging the address
                (e.g. "500 no reverse DNS for <our IP>" at MAIL FROM) -> existence UNMEASURED; re-check from a
                host with reverse DNS. Measured 28 Sep 2026: lists.aaif.io and lists.x402.org refuse the pod so.

Only BOUNCED_BEFORE, REJECTED and NO_MAIL_HOST block a send; everything else is reported, never guessed.

    python3 contact_reachability.py [--ledger FILE] addr [addr ...]   # one JSON line per address
    python3 contact_reachability.py --security-txt URL ... # addresses from security.txt Contact: lines
Exit 2 if any address is blocking, else 0.
"""
import json, re, secrets, smtplib, socket, subprocess, sys, time, urllib.request

HELO = "csoai.org"
MAIL_FROM = "nicholas@csoai.org"
ADDR = re.compile(r"^[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
BLOCKING = {"BOUNCED_BEFORE", "REJECTED", "NO_MAIL_HOST"}
LEDGER = "/workspace/inbox/bounce-ledger.jsonl"
_last = [0.0]
CLIENT_REFUSAL = re.compile(r"reverse DNS|\brDNS\b|PTR record|client host|your IP|"
                            r"spamhaus|blocklist|blacklist|relay access denied|not permitted to relay", re.I)


def mx_lines(domain):
    """'pref host' lines for the MX set, or None when no lookup could be made at all.

    dig first; where dig is not installed (the build pod, measured 28 Sep 2026) DNS-over-HTTPS. A missing
    resolver used to fall through silently to the A record, so the probe asked the web host instead of the MX."""
    try:
        return subprocess.run(["dig", "+short", "MX", domain], capture_output=True, text=True, timeout=15).stdout.splitlines()
    except FileNotFoundError:
        pass
    except Exception:
        return None
    try:
        req = urllib.request.Request("https://cloudflare-dns.com/dns-query?type=MX&name=" + domain,
                                     headers={"accept": "application/dns-json", "User-Agent": "CSOAI-outward-gate/0.1"})
        j = json.loads(urllib.request.urlopen(req, timeout=15).read())
        if j.get("Status") not in (0, 3):
            return None
        return [a["data"] for a in j.get("Answer", []) if a.get("type") == 15]
    except Exception:
        return None


def mail_hosts(domain):
    lines = mx_lines(domain)
    if lines is None:
        return [], "MX_LOOKUP_FAILED"
    mx = sorted((int(p), h.rstrip(".")) for p, h in (l.split() for l in lines if len(l.split()) == 2))
    hosts = [h for _, h in mx if h]
    if hosts:
        return hosts, "MX"
    try:
        socket.getaddrinfo(domain, 25)
        return [domain], "A"
    except Exception:
        return [], None


def rcpt(host, addr):
    wait = 1.0 - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    _last[0] = time.time()
    s = smtplib.SMTP(timeout=20)
    s.connect(host, 25)
    try:
        code, msg = s.ehlo(HELO)
        stage = "EHLO"
        if code < 400:
            code, msg = s.mail(MAIL_FROM)
            stage = "MAIL FROM"
        if code < 400:
            code, msg = s.rcpt(addr)
            stage = "RCPT"
        return code, msg.decode(errors="replace"), stage
    finally:
        try:
            s.quit()
        except Exception:
            s.close()


def verdict(c1, m1, stage, c2):
    """One address's verdict from the first session (code, text, stage reached) and the control's RCPT code.

    A refusal before RCPT (EHLO or MAIL FROM), or one whose text is about the connecting client (no reverse DNS,
    a blocklisted IP, relaying denied to our host), says nothing about the recipient: SENDER_REFUSED, never
    REJECTED. Only a 5xx answered to RCPT itself, about the address, is a verdict on the mailbox."""
    if 200 <= c1 < 300:
        return "ACCEPT_ALL" if c2 and 200 <= c2 < 300 else "ACCEPTS" if c2 and 500 <= c2 < 600 else "ACCEPTS_UNCONTROLLED"
    if stage != "RCPT" or CLIENT_REFUSAL.search(m1 or ""):
        return "SENDER_REFUSED"
    if 500 <= c1 < 600:
        return "REJECTED"
    return "TEMPFAIL"


def load_ledger(path):
    try:
        return {r["address"].lower(): r for r in map(json.loads, open(path)) if r.get("address")}
    except FileNotFoundError:
        return None


def check(addr, ledger=None):
    r = {"address": addr, "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    if ledger is None:
        r["ledger"] = "UNMEASURED (no bounce ledger)"
    elif (addr or "").lower() in ledger:
        b = ledger[addr.lower()]
        return {**r, "verdict": "BOUNCED_BEFORE", "evidence": f"hard bounce {b.get('status')} on {b.get('date')} (bounce message {b.get('bounce_id')})"}
    if not ADDR.match(addr or ""):
        return {**r, "verdict": "NO_MAIL_HOST", "evidence": "not a syntactically valid address"}
    domain = addr.rsplit("@", 1)[1].lower()
    hosts, via = mail_hosts(domain)
    if via == "MX_LOOKUP_FAILED":
        return {**r, "verdict": "UNREACHABLE", "evidence": f"{domain}: no MX lookup could be made (no dig, DoH failed)"}
    if not hosts:
        return {**r, "verdict": "NO_MAIL_HOST", "evidence": f"{domain}: no MX and no A record"}
    control = f"csoai-probe-{secrets.token_hex(6)}@{domain}"
    errors = []
    for h in hosts[:3]:
        try:
            c1, m1, st1 = rcpt(h, addr)
            c2, m2, _ = rcpt(h, control) if 200 <= c1 < 300 else (None, "", None)
        except Exception as e:
            errors.append(f"{h}: {type(e).__name__}: {e}")
            continue
        v = verdict(c1, m1, st1, c2)
        ev = f"{via} {h}: {st1} for {addr} -> {c1} {m1[:160]}; control -> {c2} {m2[:80]}"
        return {**r, "verdict": v, "mail_host": h, "evidence": ev}
    return {**r, "verdict": "UNREACHABLE", "evidence": "; ".join(errors)[:400]}


def security_txt_contacts(url):
    body = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "CSOAI-outward-gate/0.1"}), timeout=20).read().decode(errors="replace")
    return [m.group(1) for m in re.finditer(r"(?im)^Contact:\s*mailto:(\S+)", body)]


def main(argv):
    addrs, ledger_path = [], LEDGER
    if argv[:1] == ["--ledger"]:
        ledger_path, argv = argv[1], argv[2:]
    ledger = load_ledger(ledger_path)
    if argv[:1] == ["--security-txt"]:
        for u in argv[1:]:
            addrs += security_txt_contacts(u)
    else:
        addrs = argv
    if not addrs:
        print(__doc__)
        return 1
    blocked = False
    for a in dict.fromkeys(addrs):
        res = check(a, ledger)
        blocked |= res["verdict"] in BLOCKING
        print(json.dumps(res), flush=True)
    return 2 if blocked else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
