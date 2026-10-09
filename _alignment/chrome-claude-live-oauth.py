#!/usr/bin/env python3
"""Confirm Claude listing live + try Google OAuth on Glama/Smithery in real Chrome."""
import subprocess, time
from datetime import datetime

def log(s, a, l, r):
    print(f"{datetime.utcnow().strftime('%H:%M:%S')} | {s} | {a} | {l} | {str(r)[:220]}", flush=True)

def as_run(script):
    p = subprocess.run(["/usr/bin/osascript", "-e", script], capture_output=True, text=True, timeout=45)
    return (p.stdout or "").strip() or (p.stderr or "").strip()

def js(js):
    esc = js.replace("\\", "\\\\").replace('"', '\\"')
    return as_run(f'tell application "Google Chrome"\n  execute active tab of window 1 javascript "{esc}"\nend tell\n')

def open_url(url):
    esc = url.replace('"', '\\"')
    return as_run(f'''
tell application "Google Chrome"
  activate
  if (count of windows) = 0 then make new window
  set w to window 1
  make new tab at end of tabs of w with properties {{URL:"{esc}"}}
  delay 4
  set w's active tab index to (count of tabs of w)
  URL of active tab of w
end tell
''')

def click_text(*needles):
    # build JS with simple needles
    arr = ",".join('"' + n.replace('"', '') + '"' for n in needles)
    return js("""
      (function() {
        var needles = [%s];
        var bs = document.querySelectorAll('button, a, input[type=submit]');
        for (var i = 0; i < bs.length; i++) {
          var t = ((bs[i].innerText || bs[i].value || bs[i].getAttribute('aria-label') || '') + '').toLowerCase();
          for (var j = 0; j < needles.length; j++) {
            if (t.indexOf(needles[j]) >= 0 && !bs[i].disabled) {
              bs[i].click();
              return 'clicked:' + t.trim().slice(0, 50);
            }
          }
        }
        return 'no-click';
      })()
    """ % arr)

def main():
    # 1) Claude: View listing
    open_url("https://claude.ai/directory/manage/councilof-ai")
    time.sleep(4)
    main_txt = js("document.querySelector('main') ? document.querySelector('main').innerText.slice(0,800) : ''")
    log("Claude", "status", "INDEXED", main_txt[:300])
    r = click_text("view listing")
    log("Claude", "view-listing", "INSTALLED", r)
    time.sleep(3)
    url = js("location.href")
    body = js("document.body.innerText.slice(0,600)")
    log("Claude", "live-page", "CALLED", f"{url} :: {body[:250]}")

    # 2) Glama claim via Google
    open_url("https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc/admin")
    time.sleep(3)
    body = js("document.body.innerText.slice(0,800)")
    log("Glama", "body", "INSTALLED", body[:250])
    r = click_text("sign in", "google", "continue with google", "claim")
    log("Glama", "oauth-or-claim", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(3)
    log("Glama", "after", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])

    # 3) Smithery Google
    open_url("https://smithery.ai/")
    time.sleep(3)
    r = click_text("continue with google", "sign in", "login", "publish")
    log("Smithery", "oauth", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(3)
    log("Smithery", "after", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])

    # 4) mcp.so sign in
    open_url("https://mcp.so/submit?type=server")
    time.sleep(3)
    r = click_text("sign in", "login", "github", "google")
    log("mcp.so", "oauth", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(3)
    log("mcp.so", "after", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])

    print("DONE", flush=True)

if __name__ == "__main__":
    main()
