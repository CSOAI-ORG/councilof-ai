#!/usr/bin/env python3
"""Full force: precise OAuth claim clicks on Glama / Smithery / mcp.so in real Chrome."""
import subprocess, time
from datetime import datetime

def log(s, a, l, r):
    print(f"{datetime.utcnow().strftime('%H:%M:%S')} | {s} | {a} | {l} | {str(r)[:240]}", flush=True)

def as_run(script):
    p = subprocess.run(["/usr/bin/osascript", "-e", script], capture_output=True, text=True, timeout=45)
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
  delay 5
  set w's active tab index to (count of tabs of w)
  URL of active tab of w
end tell
''')

def dump_clickables():
    return js("""
      (function() {
        var out = [];
        var els = document.querySelectorAll('button, a, [role=button], input[type=submit]');
        for (var i = 0; i < els.length && out.length < 40; i++) {
          var b = els[i];
          var t = (b.innerText || b.value || b.getAttribute('aria-label') || '').trim().replace(/\\s+/g,' ').slice(0,60);
          if (t) out.push({t: t, tag: b.tagName, href: (b.href||'').slice(0,80), dis: !!b.disabled});
        }
        return JSON.stringify(out);
      })()
    """)

def click_exact_or_contains(needles, match='contains'):
    arr = ",".join('"%s"' % n.replace('"','') for n in needles)
    return js("""
      (function() {
        var needles = [%s];
        var mode = '%s';
        var els = document.querySelectorAll('button, a, [role=button], input[type=submit]');
        for (var i = 0; i < els.length; i++) {
          var b = els[i];
          if (b.disabled) continue;
          var t = (b.innerText || b.value || b.getAttribute('aria-label') || '').trim().replace(/\\s+/g,' ').toLowerCase();
          for (var j = 0; j < needles.length; j++) {
            var n = needles[j].toLowerCase();
            var hit = (mode === 'exact') ? (t === n) : (t.indexOf(n) >= 0);
            if (hit) {
              b.click();
              return 'clicked:[' + t.slice(0,60) + '] href=' + (b.href||'').slice(0,80);
            }
          }
        }
        return 'no-hit';
      })()
    """ % (arr, match))


def main():
    # ========== GLAMA claim ==========
    log("Glama", "open", "INSTALLED", open_url("https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc/admin"))
    time.sleep(4)
    log("Glama", "clickables", "INSTALLED", dump_clickables()[:700])
    # prefer exact "Sign in to claim"
    r = click_exact_or_contains(["Sign in to claim", "Sign in to Claim", "claim this connector", "Claim"], "contains")
    log("Glama", "claim-click", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(4)
    log("Glama", "after1", "INSTALLED", js("document.body.innerText.slice(0,600)")[:300])
    # if OAuth page appeared, click Google
    r2 = click_exact_or_contains(["Continue with Google", "Sign in with Google", "Google"], "contains")
    log("Glama", "google", "INSTALLED" if "clicked" in r2 else "DISCOVERED", r2)
    time.sleep(5)
    log("Glama", "after2", "INSTALLED", js("document.body.innerText.slice(0,600)")[:300])
    log("Glama", "url", "CALLED", js("location.href"))

    # ========== SMITHERY ==========
    log("Smithery", "open", "INSTALLED", open_url("https://smithery.ai/"))
    time.sleep(4)
    log("Smithery", "clickables", "INSTALLED", dump_clickables()[:700])
    r = click_exact_or_contains(["Continue with Google", "Sign in with Google", "Continue with GitHub", "Sign in", "Login", "Publish"], "contains")
    log("Smithery", "oauth-click", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(5)
    log("Smithery", "after", "INSTALLED", js("document.body.innerText.slice(0,600)")[:300])
    log("Smithery", "url", "CALLED", js("location.href"))
    # if login form, click Google again
    r2 = click_exact_or_contains(["Continue with Google", "Sign in with Google"], "contains")
    log("Smithery", "google2", "INSTALLED" if "clicked" in r2 else "DISCOVERED", r2)
    time.sleep(4)
    log("Smithery", "after2", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])

    # ========== MCP.SO ==========
    log("mcp.so", "open", "INSTALLED", open_url("https://mcp.so/submit?type=server"))
    time.sleep(4)
    log("mcp.so", "clickables", "INSTALLED", dump_clickables()[:700])
    r = click_exact_or_contains(["Sign In", "Sign in", "Login", "Continue with GitHub", "Continue with Google", "GitHub", "Google"], "contains")
    log("mcp.so", "oauth-click", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(5)
    log("mcp.so", "after", "INSTALLED", js("document.body.innerText.slice(0,600)")[:300])
    log("mcp.so", "url", "CALLED", js("location.href"))
    r2 = click_exact_or_contains(["Continue with Google", "Sign in with Google", "Continue with GitHub"], "contains")
    log("mcp.so", "oauth2", "INSTALLED" if "clicked" in r2 else "DISCOVERED", r2)
    time.sleep(4)
    log("mcp.so", "after2", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])

    # ========== LaunchStag Verify (if step3) ==========
    log("LaunchStag", "open", "INSTALLED", open_url("https://launchstag.com/claim/ca14035d-7e6e-421a-9eb4-0a1ee5d67768"))
    time.sleep(4)
    log("LaunchStag", "body", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
