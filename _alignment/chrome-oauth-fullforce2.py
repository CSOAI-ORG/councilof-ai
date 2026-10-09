#!/usr/bin/env python3
"""Full force 2: Smithery Publish (logged in) + precise Glama claim + mcp.so Sign In."""
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
    # ===== SMITHERY PUBLISH (already logged in) =====
    log("Smithery", "open-console", "INSTALLED", open_url("https://smithery.ai/console/toolbox"))
    time.sleep(4)
    log("Smithery", "ns", "INSTALLED", js("document.body.innerText.slice(0,400)")[:200])
    # click Publish nav
    r = js("""
      (function() {
        var els = document.querySelectorAll('a, button');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          var h = (els[i].href || '');
          if (t === 'publish' || h.indexOf('/publish') >= 0 || h.indexOf('new') >= 0) {
            els[i].click();
            return 'clicked:' + t + ' ' + h.slice(0,60);
          }
        }
        return 'no-publish';
      })()
    """)
    log("Smithery", "publish-nav", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(4)
    log("Smithery", "publish-page", "INSTALLED", js("location.href") + " | " + js("document.body.innerText.slice(0,600)")[:300])
    # dump form
    log("Smithery", "form", "INSTALLED", js("""
      JSON.stringify([...document.querySelectorAll('input,textarea,select,button')].map(function(el){
        return {tag:el.tagName,type:el.type||'',name:el.name||'',id:el.id||'',ph:el.placeholder||'',t:(el.innerText||el.value||'').trim().slice(0,40)}
      }).slice(0,35))
    """)[:700])
    # fill GSPC if form
    js("""
      (function() {
        var n = 0;
        function fill(sel, val) {
          var els = document.querySelectorAll(sel);
          for (var i = 0; i < els.length; i++) {
            if (els[i] && !els[i].disabled) {
              els[i].focus();
              els[i].value = val;
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
        fill('textarea', 'GSPC is an open AI measurement board from CSOAI Ltd. 23 axes measured, Ed25519-signed cards, free MCP (14 tools) at https://councilof.ai/mcp/free. Measurement, not certification.');
        return 'filled:' + n;
      })()
    """)
    log("Smithery", "fill", "INSTALLED", js("document.body.innerText.slice(0,200)")[:150])
    r = js("""
      (function() {
        var els = document.querySelectorAll('button, input[type=submit]');
        for (var i = 0; i < els.length; i++) {
          var t = ((els[i].innerText || els[i].value || '') + '').toLowerCase();
          if ((t.indexOf('publish') >= 0 || t.indexOf('submit') >= 0 || t.indexOf('create') >= 0 || t.indexOf('save') >= 0) && !els[i].disabled) {
            els[i].click(); return 'clicked:' + t.trim().slice(0,40);
          }
        }
        return 'no-submit';
      })()
    """)
    log("Smithery", "submit", "INSTALLED" if "clicked" in r else "DISCOVERED", r)
    time.sleep(3)
    log("Smithery", "after", "INSTALLED", js("document.body.innerText.slice(0,500)")[:250])

    # ===== GLAMA: find Sign in to claim by outerHTML scan =====
    log("Glama", "open", "INSTALLED", open_url("https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc/admin"))
    time.sleep(4)
    # dump elements whose text includes claim/sign
    log("Glama", "claim-scan", "INSTALLED", js("""
      (function() {
        var out = [];
        var els = document.querySelectorAll('*');
        for (var i = 0; i < els.length && out.length < 15; i++) {
          var el = els[i];
          if (el.children.length > 2) continue;
          var t = (el.innerText || '').trim();
          if (t && t.length < 80 && (t.toLowerCase().indexOf('claim') >= 0 || t.toLowerCase().indexOf('sign in') >= 0)) {
            out.push({tag: el.tagName, t: t.slice(0,60), cls: (el.className||'').toString().slice(0,40), href: (el.href||'').slice(0,60)});
          }
        }
        return JSON.stringify(out);
      })()
    """)[:700])
    r = js("""
      (function() {
        var els = document.querySelectorAll('a, button, [role=button], [role=link]');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || els[i].getAttribute('aria-label') || '').trim().toLowerCase();
          if (t === 'sign in to claim' || t === 'sign in to claim this connector' || t === 'claim this connector') {
            els[i].click(); return 'EXACT:' + t;
          }
        }
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          if (t.indexOf('sign in to claim') === 0) { els[i].click(); return 'PREFIX:' + t.slice(0,50); }
        }
        return 'no-exact-claim';
      })()
    """)
    log("Glama", "claim", "INSTALLED" if "EXACT" in r or "PREFIX" in r else "DISCOVERED", r)
    time.sleep(4)
    log("Glama", "after", "INSTALLED", js("location.href") + " | " + js("document.body.innerText.slice(0,400)")[:200])
    r2 = js("""
      (function() {
        var els = document.querySelectorAll('a, button, [role=button]');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          if (t === 'continue with google' || t === 'sign in with google' || t === 'google') {
            els[i].click(); return 'google:' + t;
          }
        }
        return 'no-google';
      })()
    """)
    log("Glama", "google", "INSTALLED" if "google" in r2 else "DISCOVERED", r2)
    time.sleep(4)
    log("Glama", "final", "INSTALLED", js("document.body.innerText.slice(0,400)")[:200])

    # ===== MCP.SO exact Sign In =====
    log("mcp.so", "open", "INSTALLED", open_url("https://mcp.so/submit?type=server"))
    time.sleep(4)
    r = js("""
      (function() {
        var els = document.querySelectorAll('a, button, [role=button]');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          if (t === 'sign in' || t === 'sign in' || t === 'login') {
            els[i].click(); return 'EXACT:' + t;
          }
        }
        return 'no-signin';
      })()
    """)
    log("mcp.so", "signin", "INSTALLED" if "EXACT" in r else "DISCOVERED", r)
    time.sleep(4)
    log("mcp.so", "after", "INSTALLED", js("location.href") + " | " + js("document.body.innerText.slice(0,400)")[:200])
    r2 = js("""
      (function() {
        var els = document.querySelectorAll('a, button');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].innerText || '').trim().toLowerCase();
          if (t === 'continue with google' || t === 'continue with github' || t === 'sign in with google' || t === 'sign in with github') {
            els[i].click(); return 'oauth:' + t;
          }
        }
        return 'no-oauth';
      })()
    """)
    log("mcp.so", "oauth", "INSTALLED" if "oauth" in r2 else "DISCOVERED", r2)

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
