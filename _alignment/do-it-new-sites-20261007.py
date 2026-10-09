#!/usr/bin/env python3
"""DO IT — real Chrome, remaining NEW sites, brand pack fill + submit. No talk."""
import subprocess, time
from datetime import datetime

def log(s, a, l, r):
    print(f"{datetime.utcnow().strftime('%H:%M:%S')} | {s} | {a} | {l} | {str(r)[:200]}", flush=True)

def as_run(script):
    p = subprocess.run(["/usr/bin/osascript", "-e", script], capture_output=True, text=True, timeout=50)
    return (p.stdout or "").strip() or (p.stderr or "").strip()

def js(code):
    esc = code.replace("\\", "\\\\").replace('"', '\\"')
    return as_run(f'tell application "Google Chrome"\n  execute active tab of window 1 javascript "{esc}"\nend tell\n')

def open_url(url):
    esc = url.replace('"', '\\"')
    return as_run(f'''
tell application "Google Chrome"
  activate
  if (count of windows) = 0 then make new window
  set w to window 1
  make new tab at end of tabs of w with properties {{URL:"{esc}"}}
  delay 6
  set w's active tab index to (count of tabs of w)
  URL of active tab of w
end tell
''')

FILL_JS = r"""
(function() {
  var n = 0;
  function fill(sel, val) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el || el.disabled) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      el.focus();
      el.value = val;
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
      el.dispatchEvent(new Event('blur', {bubbles:true}));
      n++;
    }
  }
  fill('input[type=email]', 'nicholas@csoai.org');
  fill('input[type=url]', 'https://councilof.ai');
  fill('input[name*=name]', 'GSPC');
  fill('input[name*=title]', 'GSPC — Open AI Measurement Board');
  fill('input[name*=tagline]', 'Open AI measurement board — measure, never certify');
  fill('input[name*=url]', 'https://councilof.ai');
  fill('input[name*=website]', 'https://councilof.ai');
  fill('input[name*=company]', 'CSOAI Ltd');
  fill('input[name*=product]', 'GSPC');
  fill('textarea', 'GSPC is an open AI measurement board from CSOAI Ltd (UK, Companies House 16939677). 23 axes measured across Governance, Safety, Provenance and Continuity. Signed Ed25519 cards, free MCP (14 tools) at https://councilof.ai/mcp/free. Measurement, not certification — we never sell a score, rank, grade, or certificate.');
  return 'filled:' + n;
})()
"""

SUBMIT_JS = r"""
(function() {
  var els = document.querySelectorAll('button, input[type=submit], a.btn, [role=button]');
  for (var i = 0; i < els.length; i++) {
    var t = ((els[i].innerText || els[i].value || '') + '').toLowerCase().trim();
    if (els[i].disabled) continue;
    if (t === 'submit' || t === 'publish' || t === 'send' || t === 'launch' || t === 'add' ||
        t === 'add app' || t === 'add product' || t === 'get listed' || t === 'continue' ||
        t.indexOf('submit ') === 0 || t.indexOf('add your') >= 0 || t.indexOf('launch tool') >= 0) {
      els[i].click();
      return 'clicked:' + t.slice(0,40);
    }
  }
  return 'no-submit';
})()
"""

SITES = [
    ("TAAFT", "https://theresanaiforthat.com/submit/"),
    ("AlternativeTo", "https://alternativeto.net/manage/add/"),
    ("OpenTools", "https://opentools.ai/friends/launch-tool"),
    ("Slashdot", "https://slashdot.org/submit"),
    ("Futurepedia", "https://www.futurepedia.io/submit-tool"),
    ("Futurepedia2", "https://www.futurepedia.io/"),
    ("Wellfound", "https://wellfound.com/apply"),
    ("Crunchbase", "https://www.crunchbase.com/organization/csoai"),
    ("Medium", "https://medium.com/new-story"),
]


def main():
    for name, url in SITES:
        try:
            got = open_url(url)
            time.sleep(3)
            body = js("document.body ? document.body.innerText.slice(0,500) : 'none'")
            title = js("document.title")
            low = (title + body).lower()
            if "just a moment" in low or "cloudflare" in low or "security verification" in low:
                log(name, "goto", "BLOCKED", f"CF {title}")
                continue
            if "404" in low or "not found" in low or "domain for sale" in low:
                log(name, "goto", "DEAD", title)
                continue
            if ("sign in" in low or "log in" in low or "create account" in low) and "submit" not in body[:100].lower():
                log(name, "goto", "NEED-LOGIN", f"{title} :: {body[:120].replace(chr(10),' ')}")
                continue
            n = js(FILL_JS)
            log(name, "fill", "INSTALLED", f"{got} {n} {body[:100].replace(chr(10),' ')}")
            sub = js(SUBMIT_JS)
            time.sleep(3)
            after = js("document.body.innerText.slice(0,400)")
            ok = any(k in after.lower() for k in ["thank", "submitted", "received", "success", "pending", "review", "queued"])
            ladder = "INDEXED" if ("clicked" in sub and ok) else ("PARTIAL" if "clicked" in sub or "filled:" in n else "DISCOVERED")
            log(name, "FINAL", ladder, f"sub={sub} ok={ok} {js('location.href')} :: {after[:120].replace(chr(10),' ')}")
        except Exception as e:
            log(name, "ERR", "DISCOVERED", str(e)[:150])
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
