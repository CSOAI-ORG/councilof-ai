#!/usr/bin/env python3
"""Full force 3: Smithery real publish URL + Glama How-to-claim + mcp.so new submit."""
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
    # ===== SMITHERY: real publish URLs =====
    for url in [
        "https://smithery.ai/publish",
        "https://smithery.ai/console/publish",
        "https://smithery.ai/console/servers/new",
        "https://smithery.ai/server/new",
    ]:
        got = open_url(url)
        time.sleep(3)
        body = js("document.body.innerText.slice(0,400)")
        log("Smithery", "try", "INSTALLED", f"{got} :: {body[:180]}")
        if "404" not in body and "not found" not in body.lower():
            # fill + submit
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
                fill('input[name*=package]', 'csoai-gspc-mcp');
                fill('input[name*=repo]', 'https://councilof.ai');
                fill('textarea', 'GSPC is an open AI measurement board from CSOAI Ltd. 23 axes measured, free MCP (14 tools) at https://councilof.ai/mcp/free. Measurement, not certification.');
                return 'filled:' + n;
              })()
            """)
            log("Smithery", "fill", "INSTALLED", r)
            log("Smithery", "form", "INSTALLED", js("""
              JSON.stringify([...document.querySelectorAll('input,textarea,button')].map(function(el){
                return {tag:el.tagName,type:el.type||'',ph:el.placeholder||'',t:(el.innerText||el.value||'').trim().slice(0,40)}
              }).slice(0,25))
            """)[:500])
            sub = js("""
              (function() {
                var els = document.querySelectorAll('button, input[type=submit]');
                for (var i = 0; i < els.length; i++) {
                  var t = ((els[i].innerText || els[i].value || '') + '').toLowerCase();
                  if ((t.indexOf('publish') >= 0 || t.indexOf('submit') >= 0 || t.indexOf('create') >= 0 || t.indexOf('add') >= 0) && !els[i].disabled) {
                    els[i].click(); return 'clicked:' + t.trim().slice(0,40);
                  }
                }
                return 'no-submit';
              })()
            """)
            log("Smithery", "submit", "INSTALLED" if "clicked" in sub else "DISCOVERED", sub)
            time.sleep(3)
            log("Smithery", "result", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])
            break

    # ===== GLAMA: How to claim it section =====
    log("Glama", "open", "INSTALLED", open_url("https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc/admin"))
    time.sleep(4)
    # dump How to claim content
    log("Glama", "howto", "INSTALLED", js("""
      (function() {
        var out = [];
        var els = document.querySelectorAll('*');
        for (var i = 0; i < els.length && out.length < 20; i++) {
          var el = els[i];
          var t = (el.innerText || '').trim();
          if (t && t.length < 200 && (t.toLowerCase().indexOf('how to claim') >= 0 || t.toLowerCase().indexOf('dns') >= 0 || t.toLowerCase().indexOf('github') >= 0 || t.toLowerCase().indexOf('file') >= 0 || t.toLowerCase().indexOf('verify') >= 0)) {
            out.push({tag: el.tagName, t: t.slice(0,120), href: (el.href||'').slice(0,80)});
          }
        }
        return JSON.stringify(out.slice(0,12));
      })()
    """)[:800])
    # click any button/link in claim flow
    r = js("""
      (function() {
        var els = document.querySelectorAll('a, button, [role=button]');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          var h = (els[i].href || '').toLowerCase();
          if (t.indexOf('claim') >= 0 && t.indexOf('how') < 0 && t.indexOf('benefit') < 0 && t.length < 40) {
            els[i].click(); return 'clicked:' + t.slice(0,50) + ' href=' + (els[i].href||'').slice(0,60);
          }
          if (h.indexOf('claim') >= 0 || h.indexOf('verify') >= 0 || h.indexOf('dns') >= 0) {
            els[i].click(); return 'href:' + t.slice(0,40) + ' ' + (els[i].href||'').slice(0,60);
          }
        }
        return 'no-claim-action';
      })()
    """)
    log("Glama", "claim-action", "INSTALLED" if "clicked" in r or "href" in r else "DISCOVERED", r)
    time.sleep(3)
    log("Glama", "after", "INSTALLED", js("location.href") + " | " + js("document.body.innerText.slice(0,500)")[:250])

    # ===== MCP.SO: already logged in — new submission =====
    log("mcp.so", "open", "INSTALLED", open_url("https://mcp.so/settings/submissions?type=server"))
    time.sleep(3)
    log("mcp.so", "body", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])
    log("mcp.so", "form", "INSTALLED", js("""
      JSON.stringify([...document.querySelectorAll('input,textarea,button,a')].map(function(el){
        return {tag:el.tagName,type:el.type||'',ph:el.placeholder||'',t:(el.innerText||el.value||'').trim().slice(0,50),href:(el.href||'').slice(0,50)}
      }).filter(function(x){return x.t||x.ph}).slice(0,30))
    """)[:700])
    # click New / Add / Submit
    r = js("""
      (function() {
        var els = document.querySelectorAll('a, button');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          if (t === 'new' || t === 'new submission' || t === 'add' || t === 'add server' || t === 'submit' || t === 'submit a server' || t === 'create') {
            els[i].click(); return 'clicked:' + t;
          }
        }
        return 'no-new';
      })()
    """)
    log("mcp.so", "new", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(3)
    log("mcp.so", "after-new", "INSTALLED", js("location.href") + " | " + js("document.body.innerText.slice(0,400)")[:200])
    # fill if form appeared
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
        fill('textarea', 'GSPC is an open AI measurement board from CSOAI Ltd. 23 axes measured, free MCP (14 tools) at https://councilof.ai/mcp/free. Measurement, not certification.');
        return 'filled:' + n;
      })()
    """)
    log("mcp.so", "fill", "INSTALLED", r)
    sub = js("""
      (function() {
        var els = document.querySelectorAll('button, input[type=submit]');
        for (var i = 0; i < els.length; i++) {
          var t = ((els[i].innerText || els[i].value || '') + '').toLowerCase();
          if ((t.indexOf('submit') >= 0 || t.indexOf('publish') >= 0 || t.indexOf('create') >= 0) && !els[i].disabled) {
            els[i].click(); return 'clicked:' + t.trim().slice(0,40);
          }
        }
        return 'no-submit';
      })()
    """)
    log("mcp.so", "submit", "INSTALLED" if "clicked" in sub else "DISCOVERED", sub)
    time.sleep(3)
    log("mcp.so", "result", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
