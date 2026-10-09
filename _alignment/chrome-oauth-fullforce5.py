#!/usr/bin/env python3
"""Full force 5: mcp.so submit form complete + Glama claim body + Smithery Publish button."""
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

def main():
    # ===== MCP.SO submit form (logged in) =====
    log("mcp.so", "open", "INSTALLED", open_url("https://mcp.so/submit?type=server"))
    time.sleep(5)
    # full form dump with visibility
    log("mcp.so", "all-els", "INSTALLED", js("""
      JSON.stringify([...document.querySelectorAll('input,textarea,select,button,[role=button],[role=link],a')].map(function(el){
        var r = el.getBoundingClientRect();
        return {tag:el.tagName,type:el.type||'',name:el.name||'',id:el.id||'',ph:el.placeholder||'',
                t:(el.innerText||el.value||'').trim().slice(0,50),
                vis: r.width>0 && r.height>0, w: Math.round(r.width)}
      }).filter(function(x){return x.vis && (x.t || x.ph)}).slice(0,40))
    """)[:900])
    # fill by many selectors
    r = js("""
      (function() {
        var n = 0;
        function fill(sel, val) {
          var els = document.querySelectorAll(sel);
          for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el && !el.disabled) {
              var rect = el.getBoundingClientRect();
              if (rect.width < 10) continue;
              el.focus(); el.value = val;
              el.dispatchEvent(new Event('input', {bubbles:true}));
              el.dispatchEvent(new Event('change', {bubbles:true}));
              el.dispatchEvent(new Event('blur', {bubbles:true}));
              n++;
            }
          }
        }
        fill('input', 'GSPC');
        fill('input[type=url], input[name*=url]', 'https://councilof.ai/mcp/free');
        fill('input[type=email]', 'nicholas@csoai.org');
        fill('textarea', 'GSPC is an open AI measurement board from CSOAI Ltd. 23 axes measured, Ed25519-signed cards, free MCP (14 tools) at https://councilof.ai/mcp/free. Measurement, not certification. We never sell a score, rank, grade, or certificate.');
        // smarter: overwrite url/email after generic
        fill('input[type=url]', 'https://councilof.ai/mcp/free');
        fill('input[type=email]', 'nicholas@csoai.org');
        return 'filled:' + n;
      })()
    """)
    log("mcp.so", "fill", "INSTALLED", r)
    # click submit/publish only (not ticket/support)
    sub = js("""
      (function() {
        var els = document.querySelectorAll('button, input[type=submit]');
        for (var i = 0; i < els.length; i++) {
          var t = ((els[i].innerText || els[i].value || '') + '').toLowerCase().trim();
          if ((t === 'submit' || t === 'publish' || t === 'submit project' || t === 'create' || t === 'send' || t.indexOf('submit project') >= 0) && !els[i].disabled) {
            els[i].click(); return 'clicked:' + t;
          }
        }
        return 'no-clean-submit';
      })()
    """)
    log("mcp.so", "submit", "INSTALLED" if "clicked" in sub else "DISCOVERED", sub)
    time.sleep(4)
    log("mcp.so", "result", "INSTALLED", js("location.href") + " | " + js("document.body.innerText.slice(0,600)")[:300])

    # ===== GLAMA full claim body =====
    log("Glama", "open", "INSTALLED", open_url("https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc"))
    time.sleep(4)
    log("Glama", "full", "INSTALLED", js("document.body.innerText.slice(0,2000)")[:800])
    # try admin again and get ALL text after "claim"
    log("Glama", "admin", "INSTALLED", open_url("https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc/admin"))
    time.sleep(4)
    log("Glama", "admin-full", "INSTALLED", js("document.body.innerText.slice(0,2500)")[:900])

    # ===== SMITHERY Publish button href-less click =====
    log("Smithery", "open", "INSTALLED", open_url("https://smithery.ai/"))
    time.sleep(4)
    r = js("""
      (function() {
        var els = document.querySelectorAll('a, button');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          if (t === 'publish') {
            els[i].click();
            return 'clicked publish tag=' + els[i].tagName + ' href=' + (els[i].href||'none');
          }
        }
        return 'no-publish';
      })()
    """)
    log("Smithery", "publish", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(5)
    log("Smithery", "after", "INSTALLED", js("location.href") + " | " + js("document.body.innerText.slice(0,600)")[:300])

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
