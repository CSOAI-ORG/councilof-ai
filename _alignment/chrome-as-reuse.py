#!/usr/bin/env python3
"""Reuse the open Claude manage tab + open others via AppleScript (known working)."""
import subprocess, time, json
from datetime import datetime

def log(s, a, l, r):
    print(f"{datetime.utcnow().strftime('%H:%M:%S')} | {s} | {a} | {l} | {str(r)[:200]}", flush=True)


def as_run(script):
    p = subprocess.run(["/usr/bin/osascript", "-e", script], capture_output=True, text=True, timeout=45)
    return (p.stdout or "").strip(), (p.stderr or "").strip()


def js_in_chrome(js):
    # AppleScript string: wrap JS in double quotes, escape backslashes and quotes
    esc = js.replace("\\", "\\\\").replace('"', '\\"')
    out, err = as_run(f'''
tell application "Google Chrome"
  set t to active tab of window 1
  execute t javascript "{esc}"
end tell
''')
    return out or err


def open_url(url):
    esc = url.replace('"', '\\"')
    out, err = as_run(f'''
tell application "Google Chrome"
  activate
  if (count of windows) = 0 then make new window
  set w to window 1
  set t to make new tab at end of tabs of w with properties {{URL:"{esc}"}}
  delay 4
  set w's active tab index to (count of tabs of w)
  URL of active tab of w
end tell
''')
    return out or err


def main():
    # Find or open Claude manage
    out, err = as_run('''
tell application "Google Chrome"
  set found to ""
  repeat with w in windows
    repeat with t in tabs of w
      if (URL of t) contains "claude.ai/directory" then
        set w's active tab index to (index of t)
        set found to URL of t
      end if
    end repeat
  end repeat
  return found
end tell
''')
    log("Claude", "find-tab", "INSTALLED", out or err)
    if "claude" not in (out or ""):
        log("Claude", "open", "INSTALLED", open_url("https://claude.ai/directory/manage/councilof-ai"))
        time.sleep(4)

    # main content only
    body = js_in_chrome("document.querySelector('main') ? document.querySelector('main').innerText.slice(0,2000) : document.body.innerText.slice(-2000)")
    log("Claude", "main", "INSTALLED", body[:500])

    btns = js_in_chrome("JSON.stringify([...document.querySelectorAll('button,a,button[type=submit],input[type=submit]')].map(function(b){return {t:(b.innerText||b.value||'').trim().slice(0,60),tag:b.tagName,dis:!!b.disabled}}).filter(function(x){return x.t}).slice(0,50))")
    log("Claude", "btns", "INSTALLED", btns[:600])

    # inputs
    inputs = js_in_chrome("JSON.stringify([...document.querySelectorAll('input,textarea,select')].map(function(el){return {tag:el.tagName,type:el.type||'',name:el.name||'',id:el.id||'',val:(el.value||'').slice(0,40)}}).slice(0,30))")
    log("Claude", "inputs", "INSTALLED", inputs[:500])

    # click publish-ish
    pub = js_in_chrome("""
      (function() {
        var bs = document.querySelectorAll('button, a, input[type=submit]');
        for (var i = 0; i < bs.length; i++) {
          var b = bs[i];
          var t = ((b.innerText || b.value || '') + '').toLowerCase();
          if ((t.indexOf('publish') >= 0 || t.indexOf('submit') >= 0 || t.indexOf('save') >= 0 || t.indexOf('update') >= 0) && !b.disabled) {
            b.click();
            return 'clicked:' + t.trim().slice(0, 40);
          }
        }
        return 'no-publish';
      })()
    """)
    log("Claude", "click", "INSTALLED" if "clicked" in pub else "DISCOVERED", pub)
    time.sleep(3)
    after = js_in_chrome("document.querySelector('main') ? document.querySelector('main').innerText.slice(0,800) : document.body.innerText.slice(0,800)")
    log("Claude", "after", "INSTALLED", after[:350])

    # ===== Glama =====
    log("Glama", "open", "INSTALLED", open_url("https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc/admin"))
    time.sleep(3)
    body = js_in_chrome("document.body.innerText.slice(0,1500)")
    log("Glama", "body", "INSTALLED", body[:350])
    act = js_in_chrome("""
      (function() {
        var bs = document.querySelectorAll('button, a, input[type=submit]');
        for (var i = 0; i < bs.length; i++) {
          var t = ((bs[i].innerText || bs[i].value || '') + '').toLowerCase();
          if ((t.indexOf('save') >= 0 || t.indexOf('update') >= 0 || t.indexOf('claim') >= 0 || t.indexOf('publish') >= 0 || t.indexOf('sign in') >= 0) && !bs[i].disabled) {
            bs[i].click(); return 'clicked:' + t.trim().slice(0,40);
          }
        }
        return 'no-action';
      })()
    """)
    log("Glama", "act", "INSTALLED" if "clicked" in act else "DISCOVERED", act)

    # ===== Smithery =====
    log("Smithery", "open", "INSTALLED", open_url("https://smithery.ai/"))
    time.sleep(3)
    body = js_in_chrome("document.body.innerText.slice(0,1200)")
    log("Smithery", "body", "INSTALLED", body[:300])
    act = js_in_chrome("""
      (function() {
        var bs = document.querySelectorAll('button, a');
        for (var i = 0; i < bs.length; i++) {
          var t = ((bs[i].innerText || bs[i].value || '') + '').toLowerCase();
          if ((t.indexOf('publish') >= 0 || t.indexOf('sign in') >= 0 || t.indexOf('login') >= 0 || t.indexOf('add server') >= 0) && !bs[i].disabled) {
            bs[i].click(); return 'clicked:' + t.trim().slice(0,40);
          }
        }
        return 'no-action';
      })()
    """)
    log("Smithery", "act", "INSTALLED" if "clicked" in act else "DISCOVERED", act)

    # ===== mcp.so =====
    log("mcp.so", "open", "INSTALLED", open_url("https://mcp.so/submit?type=server"))
    time.sleep(3)
    body = js_in_chrome("document.body.innerText.slice(0,1200)")
    log("mcp.so", "body", "INSTALLED", body[:300])

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
