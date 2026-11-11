#!/usr/bin/env python3
"""Read-only public-source watch. No legal edits, submissions or automatic approvals.
Python 3.9+ and curl. Reports/snapshots are private by default and unsigned.
An HTTP check or a matching directory name is not legal assurance.
"""
from __future__ import annotations
import argparse
import concurrent.futures
import datetime as dt
import fcntl
import gzip
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlparse

VERSION = "0.2.1"
NORMALISER_VERSION = "visible-main/2"
ROOT = Path(__file__).resolve().parent
MAX_BYTES = 3_000_000
UA = "CouncilOfAI-GovernanceWatch/0.2 (+https://councilof.ai/contact/)"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def utcnow():
    return dt.datetime.now(dt.timezone.utc)


def iso(value):
    return value.isoformat(timespec="seconds").replace("+00:00", "Z")


class VisibleText(HTMLParser):
    """Stable main text; discard scripts, navigation and page chrome, not clauses."""
    DROP = {"script", "style", "noscript", "nav", "footer", "svg"}
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.all_text, self.main_text = [], []
        self.title, self.links = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        hidden = tag in self.DROP or "hidden" in attrs or attrs.get("aria-hidden") == "true"
        hidden = hidden or bool(re.search(r"display\s*:\s*none", attrs.get("style", ""), re.I))
        parent_hidden = any(x[1] for x in self.stack)
        if tag == "a" and not parent_hidden and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag not in self.VOID:
            self.stack.append((tag, hidden))
        if tag == "img" and not hidden and not parent_hidden and attrs.get("alt"):
            self.handle_data(attrs["alt"])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, text):
        if any(x[0] == "title" for x in self.stack):
            self.title.append(text)
        if any(x[1] for x in self.stack):
            return
        self.all_text.append(text)
        if any(x[0] == "main" for x in self.stack):
            self.main_text.append(text)

    def normalised(self):
        return re.sub(r"\s+", " ", " ".join(self.main_text or self.all_text)).strip()


def analyse(target, status, body, content_type, now=None):
    """Pure content validation. Returns observation, not a legal conclusion."""
    now = now or utcnow()
    text = body.decode("utf-8", "replace")
    out = {"validation": "OK", "issues": [], "facts": {}, "normalised_sha256": None}
    if status != 200:
        out["validation"] = "UNVERIFIED" if status not in (404, 410) else "HTTP_NOT_FOUND"
        return out
    if not body.strip():
        out.update(validation="INVALID_CONTENT", issues=["empty response"])
        return out
    kind = target.get("kind", "html")
    if kind == "json":
        try:
            data = json.loads(text)
            if not isinstance(data, dict):
                raise ValueError("expected a JSON object")
            for key in target.get("required_keys", []):
                if key not in data:
                    raise ValueError("missing JSON key: " + key)
            normal = json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
            if "json" not in content_type.lower():
                out["issues"].append("JSON served with unexpected Content-Type")
            if "did" in target["name"]:
                out["facts"]["did_id"] = data.get("id")
                methods = data.get("verificationMethod", [])
                keys = [{k: m[k] for k in ("publicKeyJwk", "publicKeyMultibase", "publicKeyBase58") if k in m}
                        for m in methods if isinstance(m, dict)]
                out["facts"]["public_keys_sha256"] = digest(json.dumps(keys, sort_keys=True).encode())
            if target["name"] == "memberships_json":
                out["facts"].update(as_of=data.get("as_of"), signed=data.get("signed"))
                rows = data.get("rows", [])
                out["facts"]["tracked_rows"] = [r for r in rows if r.get("id") in ("osaia", "lf", "linux-foundation", "oin", "lot", "cloudflare")]
        except (ValueError, TypeError) as exc:
            out.update(validation="INVALID_CONTENT", issues=["invalid JSON: " + str(exc)])
            return out
    elif kind == "security_txt":
        normal = "\n".join(line.strip() for line in text.splitlines() if line.strip())
        fields = {}
        for line in text.splitlines():
            if ":" in line and not line.lstrip().startswith("#"):
                key, value = line.split(":", 1)
                fields.setdefault(key.lower().strip(), []).append(value.strip())
        contacts = fields.get("contact", [])
        out["facts"]["contacts"] = contacts
        if not contacts or not all(v.startswith(("mailto:", "https:")) for v in contacts):
            out["issues"].append("missing or invalid Contact")
        expiry = fields.get("expires", [])
        try:
            if len(expiry) != 1:
                raise ValueError("exactly one Expires required")
            date = dt.datetime.fromisoformat(expiry[0].replace("Z", "+00:00"))
            if date.tzinfo is None:
                raise ValueError("timezone missing")
            out["facts"].update(expires=iso(date), days_to_expiry=(date - now).days)
            if date <= now:
                out["issues"].append("security.txt expired")
            elif (date - now).total_seconds() <= 30 * 86400:
                out["issues"].append("security.txt expires within 30 days")
        except (ValueError, TypeError) as exc:
            out["issues"].append("invalid Expires: " + str(exc))
    elif kind == "text":
        normal = re.sub(r"\s+", " ", text).strip()
    else:
        parser = VisibleText()
        parser.feed(text)
        normal = parser.normalised()
        title = " ".join(parser.title).strip()
        out["facts"]["title"] = title
        out["facts"]["contact_links"] = sorted(set(x for x in parser.links if x.startswith("mailto:")))
        if re.search(r"just a moment|access denied|attention required.*cloudflare", title, re.I):
            out.update(validation="UNVERIFIED", issues=["access challenge, not verified page content"])
        elif re.search(r"(?:\b404\b|page not found|page cannot be found)", title, re.I):
            out.update(validation="INVALID_CONTENT", issues=["soft 404: error document served with HTTP 200"])
        elif not normal:
            out.update(validation="INVALID_CONTENT", issues=["no readable page text"])
        if target["name"] == "membership_agreement":
            low = re.sub(r"\s+", " ", " ".join(parser.all_text)).strip().lower()
            out["facts"]["archive_join_conflict"] = "ready to join csoai?" in low and "no current version supersedes it." in low
        if target["name"] in ("privacy", "privacy_policy"):
            match = re.search(r"version\s+([0-9.]+)", normal, re.I)
            out["facts"]["notice_version"] = match.group(1).rstrip(".") if match else None
        if target.get("expect") and not all(s.casefold() in normal.casefold() for s in target["expect"]):
            out["issues"].append("expected source identity text not found; review required")
    out["normalised_sha256"] = digest(normal.encode())
    out["_normalised"] = normal
    if out["issues"] and out["validation"] == "OK":
        out["validation"] = "REVIEW"
    return out


def fetch_once(url):
    """GET follows HTTPS redirects to a terminal response, with TLS verification."""
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Only credential-free HTTPS public sources are permitted")
    with tempfile.TemporaryDirectory(prefix="governance-get-") as temp:
        dest = Path(temp) / "body"
        args = ["curl", "--proto", "=https", "--proto-redir", "=https", "--location", "--max-redirs", "8",
                "--connect-timeout", "8", "--max-time", "22", "--max-filesize", str(MAX_BYTES),
                "--silent", "--show-error", "--user-agent", UA, "--header", "Accept: application/json,text/html,text/plain,*/*;q=0.5",
                "--output", str(dest), "--write-out", "%{http_code}\n%{url_effective}\n%{content_type}\n%{num_redirects}\n", url]
        try:
            p = subprocess.run(args, capture_output=True, text=True, timeout=25, check=False)
            lines = p.stdout.splitlines()
            status = int(lines[0]) if lines and lines[0].isdigit() else 0
            body = dest.read_bytes() if dest.exists() else b""
            return {"status": status, "effective_url": lines[1] if len(lines) > 1 else url,
                    "content_type": lines[2] if len(lines) > 2 else "", "redirects": int(lines[3]) if len(lines) > 3 and lines[3].isdigit() else 0,
                    "transport_error": p.stderr.strip()[:350] if p.returncode else None, "curl_exit": p.returncode, "_body": body}
        except (subprocess.TimeoutExpired, OSError) as exc:
            return {"status": 0, "effective_url": url, "content_type": "", "redirects": 0,
                    "transport_error": type(exc).__name__, "curl_exit": None, "_body": b""}


def probe(target, fetcher=fetch_once, now=None):
    attempts = []
    final = {}
    for _ in range(2):
        res = fetcher(target["url"])
        analysis = analyse(target, res["status"], res["_body"], res["content_type"], now)
        if res.get("transport_error"):
            analysis["validation"] = "UNVERIFIED"
        attempts.append({"status": res["status"], "curl_exit": res.get("curl_exit"),
                         "validation": analysis["validation"], "error": res.get("transport_error")})
        final = {**res, **analysis}
        if analysis["validation"] in ("OK", "REVIEW"):
            break
    repeated = len(attempts) == 2 and all(x["validation"] in ("HTTP_NOT_FOUND", "INVALID_CONTENT") for x in attempts)
    final["state"] = "BROKEN_SURFACE" if repeated else ("VERIFIED_FETCH" if final["validation"] in ("OK", "REVIEW") else "UNVERIFIED")
    final.update(name=target["name"], url=target["url"], source_class=target.get("source_class", "csoai"),
                 attempts=attempts, bytes=len(final["_body"]), sha256=digest(final["_body"]))
    return final


def finding(kind, surface, details, url, owner):
    suffix = ":" + digest(details.encode())[:12] if kind == "REVIEW_ACTION" else ""
    return {"id": kind + ":" + surface + suffix, "type": kind, "surface": surface, "details": details,
            "source_url": url, "owner_role": owner, "state": "review_required", "auto_close": False}


def make_report(previous, results, stamp):
    """Keep unresolved items, but notify only new or changed actionable findings."""
    if isinstance(previous, dict) and "results" in previous:
        old_report = previous
        before = {r["name"]: r for r in previous.get("results", [])}
    else:
        before, old_report = previous or {}, {}
    findings, changes, unverified = [], [], []
    by = {r["name"]: r for r in results}
    for r in results:
        if r["state"] == "BROKEN_SURFACE":
            findings.append(finding("BROKEN_SURFACE", r["name"], "Two GET attempts failed content or missing-page validation", r["url"], "Web operations"))
        elif r["state"] == "UNVERIFIED":
            unverified.append({"surface": r["name"], "source_url": r["url"], "reason": r.get("transport_error") or r["validation"]})
        for issue in r.get("issues", []):
            if r["state"] == "VERIFIED_FETCH":
                findings.append(finding("REVIEW_ACTION", r["name"], issue, r["url"], "Governance / security owner"))
        old = before.get(r["name"], {})
        if old_report.get("normaliser_version") == NORMALISER_VERSION and old.get("normalised_sha256") and r.get("normalised_sha256") and r["state"] == "VERIFIED_FETCH" and old["normalised_sha256"] != r["normalised_sha256"]:
            changes.append({"surface": r["name"], "source_url": r["url"], "before": old["normalised_sha256"], "after": r["normalised_sha256"],
                            "assessment": "CONTENT_CHANGE_REQUIRES_REVIEW_NOT_LEGAL_CHANGE_PROOF"})
    agreement = by.get("membership_agreement", {})
    if agreement.get("facts", {}).get("archive_join_conflict"):
        findings.append(finding("HISTORICAL_AGREEMENT_STALE_CLAIM", "membership_agreement",
                                "Archive retains join invitation and no-supersession statement; assess contractual scope before editing", agreement["url"], "Legal and membership governance"))
    p, alias = by.get("privacy", {}), by.get("privacy_policy", {})
    if all(x.get("state") == "VERIFIED_FETCH" and x.get("normalised_sha256") for x in (p, alias)) and p["normalised_sha256"] != alias["normalised_sha256"]:
        findings.append(finding("PRIVACY_PARITY_REVIEW", "privacy_aliases", "The two notice routes have different main text; review disclosure parity without automatic edits", p["url"], "Data protection lead"))
    prior_ids = {f.get("id", f.get("type", "") + ":" + f.get("surface", "")): f for f in old_report.get("findings", [])}
    notified = dict(old_report.get("notified_signatures", {}))
    for key, old in prior_ids.items():
        if key not in notified:
            notified[key] = digest(str(old.get("details", "")).encode())
    notifications = []
    for f in findings:
        old = prior_ids.get(f["id"])
        # Preserve already-known legacy agreement issue during the 0.1 -> 0.2 migration.
        signature = digest(f["details"].encode())
        known_legacy = old is not None and old_report.get("monitor_version") == "0.1"
        if not known_legacy and notified.get(f["id"]) != signature:
            notifications.append(f)
        notified[f["id"]] = signature
    for gap in unverified:
        name = gap["surface"]
        prev = before.get(name, {})
        if prev.get("state") == "UNVERIFIED" and not any(f.get("surface") == name and f.get("type") == "MONITORING_GAP" for f in old_report.get("findings", [])):
            f = finding("MONITORING_GAP", name, "Source could not be verified on consecutive runs; manual source review needed, not an outage finding", gap["source_url"], "Governance watch operator")
            findings.append(f)
            notifications.append(f)
        elif prev.get("state") == "UNVERIFIED":
            findings.extend(f for f in old_report.get("findings", []) if f.get("surface") == name and f.get("type") == "MONITORING_GAP")
    for f in findings:
        notified[f["id"]] = digest(f["details"].encode())
    review_queue = list(old_report.get("review_queue", []))
    known_changes = {(c["surface"], c["before"], c["after"]) for c in review_queue}
    for change in changes:
        key = (change["surface"], change["before"], change["after"])
        if key not in known_changes:
            review_queue.append({**change, "first_observed": stamp, "state": "pending_review"})
    open_items = {f["id"]: f for f in old_report.get("open_review_items", [])}
    for f in findings:
        open_items[f["id"]] = {**f, "last_observed": stamp}
    # Unobserved issues remain in the private review register, not falsely marked closed.
    # A digest change is queued for assessment, never presented as a material legal change.
    return {"monitor_version": VERSION, "normaliser_version": NORMALISER_VERSION, "timestamp_utc": stamp, "previous_timestamp_utc": old_report.get("timestamp_utc"),
            "comparison": "normalised_content" if old_report.get("normaliser_version") == NORMALISER_VERSION and any(x.get("normalised_sha256") for x in before.values()) else "baseline_migration_no_content_change_claim",
            "findings": findings, "new_notifications": notifications, "changes_for_review": changes, "unverified_sources": unverified,
            "notified_signatures": notified, "review_queue": review_queue, "open_review_items": list(open_items.values()),
            "results": results, "signed": False,
            "limits": ["GET/body checks are observations, not legal compliance, membership approval, or key custody proof",
                       "Content changes require human materiality review; no raw-hash legal alerts",
                       "403/429/timeouts and challenges are unverified, not confirmed website outages",
                       "No email delivery, complaint submission, DNS edits, private agreement access or legal text publication",
                       "Checksums detect byte changes; they are not signatures or independent attestations"]}


def atomic_write(path, data):
    path = Path(path)
    fd, tmp = tempfile.mkstemp(prefix=".watch-", dir=str(path.parent))
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def load_targets(path):
    """Reject empty/malformed scope before fetching or promoting any report."""
    targets = json.loads(Path(path).read_text())
    if not isinstance(targets, list) or not targets:
        raise ValueError("source configuration must be a non-empty list")
    ids = set()
    for target in targets:
        if not isinstance(target, dict):
            raise ValueError("each source must be an object")
        name, url = target.get("name"), target.get("url")
        if not isinstance(name, str) or not re.fullmatch(r"[a-z0-9_]+", name) or name in ids:
            raise ValueError("invalid or duplicate target name")
        ids.add(name)
        if not isinstance(url, str):
            raise ValueError("target URL must be a string")
        u = urlparse(url)
        if u.scheme != "https" or not u.hostname or u.username or u.password:
            raise ValueError("target must be credential-free HTTPS")
        if target.get("kind", "html") not in ("html", "json", "text", "security_txt"):
            raise ValueError("unsupported source kind")
        for field in ("expect", "required_keys"):
            values = target.get(field, [])
            if not isinstance(values, list) or any(not isinstance(x, str) or not x for x in values):
                raise ValueError("source validation fields must be lists of non-empty strings")
    return targets


def check_previous_pair(out, previous):
    """Refuse an interrupted report/notification commit; never auto-repair history."""
    notification_path = out / "notifications.json"
    if previous is None:
        if notification_path.exists():
            raise ValueError("notification state exists without a matching latest report")
        return
    if not isinstance(previous, dict) or not isinstance(previous.get("results"), list):
        raise ValueError("invalid previous report")
    stamp = previous.get("timestamp_utc")
    if not isinstance(stamp, str) or not re.fullmatch(r"[0-9]{8}T[0-9]{6}(?:[0-9]{6})?Z", stamp):
        raise ValueError("invalid previous report timestamp")
    # Validate a real calendar time, not just a timestamp-shaped string.
    dt.datetime.strptime(stamp, "%Y%m%dT%H%M%S%fZ" if len(stamp) == 22 else "%Y%m%dT%H%M%SZ")
    notification = json.loads(notification_path.read_text())
    if (not isinstance(notification, dict) or notification.get("timestamp_utc") != stamp
            or notification.get("report") != stamp + ".json"
            or notification.get("new_findings") != previous.get("new_notifications")):
        raise ValueError("report and notification state disagree; owner review required")


def preflight_storage(out):
    """Test ordinary configured storage, without a fallback, cleanup or relocation."""
    # These are only this invocation's small disposable probes, never user files.
    # TemporaryDirectory uses the unchanged system temporary-directory selection.
    with tempfile.TemporaryDirectory(prefix="governance-preflight-") as temporary:
        probe_path = Path(temporary) / "probe"
        with probe_path.open("xb") as stream:
            stream.write(b"governance storage preflight\n")
            stream.flush()
            os.fsync(stream.fileno())
    fd, name = tempfile.mkstemp(prefix=".watch-preflight-", dir=str(out))
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(b"governance storage preflight\n")
            stream.flush()
            os.fsync(stream.fileno())
    finally:
        if os.path.exists(name):
            os.unlink(name)


def incomplete_notice(state, reason, error_type=None):
    """Emit failure to stderr even when disk cannot save a failure record."""
    notice = {"monitor_version": VERSION, "run_state": state,
              "observed_at": iso(utcnow()), "reason": reason,
              "collection_complete": False, "fresh_report_accepted": False,
              "origin_outage_established": False, "legal_change_established": False}
    if error_type:
        notice["error_type"] = error_type
    # Do not print exception messages: paths, URLs or private history can be embedded.
    print(json.dumps(notice, sort_keys=True), file=sys.stderr)


def main():
    """An incomplete run is nonzero, never an unchanged-success notification."""
    try:
        return run()
    except OSError as exc:
        incomplete_notice("INCOMPLETE", "LOCAL_IO_FAILURE", type(exc).__name__)
        return 3
    except (ValueError, TypeError, KeyError) as exc:
        incomplete_notice("INCOMPLETE", "CONFIGURATION_OR_EVIDENCE_INVALID", type(exc).__name__)
        return 3


def run():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(ROOT / "runs"))
    ap.add_argument("--sources", default=str(ROOT / "sources.json"))
    ap.add_argument("--summary", action="store_true", help="Print execution summary even when there is no new finding")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    with (out / ".watch.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            incomplete_notice("SKIPPED_BUSY", "EXISTING_COLLECTOR_LOCK")
            return 4
        previous = None
        if (out / "latest.json").exists():
            # Fail visibly on corrupt history rather than silently resetting alert state.
            previous = json.loads((out / "latest.json").read_text())
        check_previous_pair(out, previous)
        targets = load_targets(args.sources)
        preflight_storage(out)
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(probe, targets))
        stamp = utcnow().strftime("%Y%m%dT%H%M%S%fZ")
        archive = out / "snapshots"
        archive.mkdir(exist_ok=True)
        for result in results:
            raw = result.pop("_body")
            normal = result.pop("_normalised", "")
            blob = archive / (result["sha256"] + ".gz")
            if not blob.exists():
                atomic_write(blob, gzip.compress(raw, mtime=0))
            result["snapshot"] = "snapshots/" + blob.name
            if normal:
                txt = archive / (result["normalised_sha256"] + ".txt.gz")
                if not txt.exists():
                    atomic_write(txt, gzip.compress(normal.encode(), mtime=0))
                result["normalised_snapshot"] = "snapshots/" + txt.name
        report = make_report(previous, results, stamp)
        raw = (json.dumps(report, indent=2, sort_keys=True) + "\n").encode()
        path = out / (stamp + ".json")
        atomic_write(path, raw)
        atomic_write(out / (stamp + ".sha256"), (digest(raw) + "  " + path.name + "\n").encode())
        notification = {"timestamp_utc": stamp, "new_findings": report["new_notifications"], "report": path.name}
        atomic_write(out / "notifications.json", (json.dumps(notification, indent=2) + "\n").encode())
        # latest.json is the final commit point. A failed notification write cannot
        # replace the previous report. A failure here leaves a detectable mismatch.
        atomic_write(out / "latest.json", raw)
        if args.summary or report["new_notifications"]:
            print(json.dumps({"report": str(path), "sha256": digest(raw), "checked": len(results),
                "verified_fetches": sum(r["state"] == "VERIFIED_FETCH" for r in results),
                "broken": sum(r["state"] == "BROKEN_SURFACE" for r in results),
                "unverified": len(report["unverified_sources"]), "new_findings": report["new_notifications"],
                "content_changes_pending_review": len(report["changes_for_review"]), "signed": False}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
