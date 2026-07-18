#!/usr/bin/env python3
"""Update Namecheap nameservers to Vercel via Kimi WebBridge."""
import argparse
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

WEBBRIDGE = "http://127.0.0.1:10086/command"
SESSION = "namecheap-dns"
VERCEL_NS = ["ns1.vercel-dns.com", "ns2.vercel-dns.com"]


def _send(action: str, args: dict, session: str = SESSION):
    payload = json.dumps({"action": action, "args": args, "session": session}).encode()
    req = urllib.request.Request(WEBBRIDGE, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def _eval(code: str):
    resp = _send("evaluate", {"code": code})
    if not resp.get("ok"):
        raise RuntimeError(resp.get("error", {}).get("message", "unknown"))
    return resp["data"]["value"]


def _navigate(domain: str):
    url = f"https://ap.www.namecheap.com/Domains/DomainControlPanel/{domain}/domain"
    resp = _send("navigate", {"url": url})
    if not resp.get("ok"):
        raise RuntimeError(resp.get("error", {}).get("message", "unknown"))
    # wait for domain-specific page to render
    for _ in range(30):
        time.sleep(0.5)
        try:
            state = _eval(f"""
            (() => {{
              const h = document.querySelector('h1');
              const heading = h ? h.textContent.trim() : '';
              const nsChosen = Array.from(document.querySelectorAll('.select2-chosen'))
                .map(s => s.textContent.trim())
                .some(t => /Namecheap (Basic|Backup|Web Hosting|Premium)DNS|Custom DNS/.test(t));
              return {{heading: heading, nsChosen: nsChosen}};
            }})()
            """)
            if state.get("heading") == domain and state.get("nsChosen"):
                return
        except Exception:
            pass
    raise RuntimeError("page did not load")


def _open_dropdown():
    code = """
    (() => {
      const chosen = Array.from(document.querySelectorAll('.select2-chosen'))
        .find(s => /Namecheap (Basic|Backup|Web Hosting|Premium)DNS|Custom DNS/.test(s.textContent.trim()));
      if (!chosen) return 'no nameserver select';
      const container = chosen.closest('.select2-container');
      if (!container) return 'no container';
      if (window.jQuery) {
        jQuery(container).select2('open');
        return 'opened';
      }
      return 'no jquery';
    })()
    """
    return _eval(code)


def _select_custom():
    code = """
    (() => {
      const opt = Array.from(document.querySelectorAll('.select2-results li'))
        .find(li => li.textContent.trim() === 'Custom DNS');
      if (!opt) return 'custom option not found';
      if (window.jQuery) {
        jQuery(opt).trigger('mouseup');
        return 'selected custom';
      }
      opt.dispatchEvent(new MouseEvent('mouseup', {bubbles:true}));
      return 'selected custom (native)';
    })()
    """
    return _eval(code)


def _fill_and_save():
    code = """
    (() => {
      const inputs = Array.from(document.querySelectorAll('input[placeholder*="Nameserver"]'));
      if (inputs.length < 2) return 'inputs missing: ' + inputs.length;
      inputs[0].value = 'ns1.vercel-dns.com';
      inputs[1].value = 'ns2.vercel-dns.com';
      inputs[0].dispatchEvent(new Event('input', {bubbles:true}));
      inputs[1].dispatchEvent(new Event('input', {bubbles:true}));
      const save = document.querySelector('.inline-actions .save, a.save, .icon-check');
      if (!save) return 'save not found';
      save.click();
      return 'saved';
    })()
    """
    return _eval(code)


def _current_state():
    code = """
    (() => {
      const chosen = Array.from(document.querySelectorAll('.select2-chosen'))
        .find(s => /Namecheap (Basic|Backup|Web Hosting|Premium)DNS|Custom DNS/.test(s.textContent.trim()));
      const inputs = Array.from(document.querySelectorAll('input[placeholder*="Nameserver"]'));
      return {
        chosen: chosen ? chosen.textContent.trim() : null,
        values: inputs.map(i => i.value.trim())
      };
    })()
    """
    return _eval(code)


def fix_domain(domain: str, dry_run: bool = False):
    print(f"\n[+] {domain}")
    _navigate(domain)
    state = _current_state()
    print(f"    current: {state}")
    if state.get("chosen") == "Custom DNS" and set(state.get("values", [])) == set(VERCEL_NS):
        print("    already correct")
        return True
    if dry_run:
        print("    dry-run: would set to", VERCEL_NS)
        return True
    res = _open_dropdown()
    print(f"    open: {res}")
    time.sleep(0.8)
    res = _select_custom()
    print(f"    select: {res}")
    time.sleep(0.8)
    res = _fill_and_save()
    print(f"    save: {res}")
    # wait for the page to reload and reflect the new nameservers
    for _ in range(20):
        time.sleep(1)
        state = _current_state()
        print(f"    after: {state}")
        if state.get("chosen") == "Custom DNS" and set(state.get("values", [])) == set(VERCEL_NS):
            return True
    return False


def _get_vercel_domains_with_mismatch():
    ctx = ssl._create_unverified_context()
    token_path = Path.home() / "Library/Application Support/com.vercel.cli/auth.json"
    token = json.loads(token_path.read_text())["token"]
    headers = {"Authorization": f"Bearer {token}"}
    team = "teamId=team_4IkNIyYl7TtEOi9aoz17SUO7"
    url = f"https://api.vercel.com/v5/domains?{team}&limit=100"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
        resp = json.loads(r.read().decode())
    target = set(VERCEL_NS)
    domains = []
    for d in resp.get("domains", []):
        intended = set(d.get("intendedNameservers", []) or [])
        actual = set(d.get("nameservers", []) or [])
        if intended == target and actual != intended:
            domains.append(d["name"])
    return domains


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--domains", nargs="+", help="Specific domains to fix")
    parser.add_argument("--all", action="store_true", help="Fix all Vercel-intended domains with mismatched NS")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    domains = args.domains
    if args.all:
        domains = _get_vercel_domains_with_mismatch()
    if not domains:
        print("No domains specified")
        sys.exit(1)

    ok = []
    fail = []
    for d in domains:
        try:
            if fix_domain(d, dry_run=args.dry_run):
                ok.append(d)
            else:
                fail.append(d)
        except Exception as e:
            print(f"    ERROR: {e}")
            fail.append(d)
    print(f"\nDone: {len(ok)} ok, {len(fail)} failed")
    if fail:
        print("Failed:", ", ".join(fail))
        sys.exit(1)


if __name__ == "__main__":
    main()
