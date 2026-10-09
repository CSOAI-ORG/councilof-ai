#!/usr/bin/env python3
"""Full force 4: Glama claim-connector steps + mcp.so Submit a project + Smithery Publish href."""
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
    # ===== GLAMA claim-connector detail =====
    log("Glama", "open", "INSTALLED", open_url("https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc#claim-connector"))
    time.sleep(4)
    # extract claim-connector section
    log("Glama", "claim-section", "INSTALLED", js("""
      (function() {
        var el = document.querySelector('#claim-connector') || document.querySelector('[id*=claim]');
        if (!el) {
          var all = document.querySelectorAll('h1,h2,h3,div,section');
          for (var i = 0; i < all.length; i++) {
            if ((all[i].innerText||'').indexOf('How to claim') >= 0) { el = all[i]; break; }
          }
        }
        return el ? el.innerText.slice(0, 1200) : 'no-section';
      })()
    """)[:800])
    # all links in claim area
    log("Glama", "claim-links", "INSTALLED", js("""
      (function() {
        var out = [];
        var els = document.querySelectorAll('a, button');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim();
          var h = els[i].href || '';
          if (h.indexOf('claim') >= 0 || h.indexOf('verify') >= 0 || h.indexOf('dns') >= 0 || h.indexOf('github') >= 0 ||
              t.toLowerCase().indexOf('verify') >= 0 || t.toLowerCase().indexOf('dns') >= 0 || t.toLowerCase().indexOf('file') >= 0) {
            out.push({t: t.slice(0,50), href: h.slice(0,100)});
          }
        }
        return JSON.stringify(out.slice(0, 12));
      })()
    """)[:700])
    # click Verify ownership / Start claim / Verify
    r = js("""
      (function() {
        var els = document.querySelectorAll('a, button, [role=button]');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          if (t === 'verify ownership' || t === 'verify' || t === 'start claim' || t === 'claim now' || t === 'claim connector') {
            els[i].click(); return 'clicked:' + t;
          }
        }
        return 'no-verify-btn';
      })()
    """)
    log("Glama", "verify-click", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(3)
    log("Glama", "after-verify", "INSTALLED", js("location.href") + " | " + js("document.body.innerText.slice(0,800)")[:350])

    # ===== MCP.SO Submit a project =====
    log("mcp.so", "open", "INSTALLED", open_url("https://mcp.so/settings/submissions"))
    time.sleep(3)
    r = js("""
      (function() {
        var els = document.querySelectorAll('a, button');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          if (t.indexOf('submit a project') >= 0 || t === 'submit project' || t.indexOf('submit a') >= 0) {
            els[i].click(); return 'clicked:' + t;
          }
        }
        return 'no-submit-project';
      })()
    """)
    log("mcp.so", "submit-project", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(4)
    log("mcp.so", "page", "INSTALLED", js("location.href") + " | " + js("document.body.innerText.slice(0,600)")[:300])
    log("mcp.so", "form", "INSTALLED", js("""
      JSON.stringify([...document.querySelectorAll('input,textarea,select,button')].map(function(el){
        return {tag:el.tagName,type:el.type||'',name:el.name||'',ph:el.placeholder||'',t:(el.innerText||el.value||'').trim().slice(0,50)}
      }).slice(0,30))
    """)[:700])
    # fill GSPC
    r = js("""
      (function() {
        var n = 0;
        function fill(sel, val) {
          var els = document.querySelectorAll(sel);
          for (var i = 0; i < els.length; i++) {
            if (els[i] && !els[i].disabled && els[i].offsetParent !== null) {
              els[i].focus(); els[i].value = val;
              els[i].dispatchEvent(new Event('input', {bubbles:true}));
              els[i].dispatchEvent(new Event('change', {bubbles:true}));
              n++;
            }
          }
        }
        fill('input[name*=name]', 'GSPC');
        fill('input[name*=title]', 'GSPC');
        fill('input[type=url]', 'https://councilof.ai/mcp/free');
        fill('input[name*=url]', 'https://councilof.ai/mcp/free');
        fill('input[name*=website]', 'https://councilof.ai');
        fill('input[type=email]', 'nicholas@csoai.org');
        fill('textarea', 'GSPC is an open AI measurement board from CSOAI Ltd. 23 axes measured, Ed25519-signed cards, free MCP (14 tools) at https://councilof.ai/mcp/free. Measurement, not certification.');
        return 'filled:' + n;
      })()
    """)
    log("mcp.so", "fill", "INSTALLED", r)
    sub = js("""
      (function() {
        var els = document.querySelectorAll('button, input[type=submit]');
        for (var i = 0; i < els.length; i++) {
          var t = ((els[i].innerText || els[i].value || '') + '').toLowerCase();
          if ((t.indexOf('submit') >= 0 || t.indexOf('publish') >= 0 || t.indexOf('create') >= 0 || t.indexOf('send') >= 0) && !els[i].disabled) {
            els[i].click(); return 'clicked:' + t.trim().slice(0,40);
          }
        }
        return 'no-submit';
      })()
    """)
    log("mcp.so", "submit", "INSTALLED" if "clicked" in sub else "DISCOVERED", sub)
    time.sleep(3)
    log("mcp.so", "result", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])

    # ===== SMITHERY: get Publish href =====
    log("Smithery", "open", "INSTALLED", open_url("https://smithery.ai/console/toolbox"))
    time.sleep(3)
    log("Smithery", "publish-href", "INSTALLED", js("""
      (function() {
        var els = document.querySelectorAll('a');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          if (t === 'publish') return t + ' -> ' + (els[i].href || 'nohref');
        }
        return 'no-publish-link';
      })()
    """))
    # also dump sidebar links
    log("Smithery", "nav", "INSTALLED", js("""
      JSON.stringify([...document.querySelectorAll('a')].map(function(a){
        return {t:(a.innerText||'').trim().slice(0,30), h:(a.href||'').slice(0,70)}
      }).filter(function(x){return x.t}).slice(0,25))
    """)[:600])

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
