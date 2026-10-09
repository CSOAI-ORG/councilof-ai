#!/usr/bin/env python3
"""Drive user's real Chrome via JXA (osascript -l JavaScript). Use their logins."""
import subprocess, json, time, sys

JXA_RUN = "/usr/bin/osascript"


def chrome_js(js: str, timeout=30):
    # JXA: run JS in active tab of Chrome window 1
    script = f'''
    const Chrome = Application("Google Chrome");
    Chrome.includeStandardAdditions = true;
    const w = Chrome.windows[0];
    const t = w.activeTab;
    const r = t.execute({{javascript: {json.dumps(js)}}});
    r;
    '''
    p = subprocess.run([JXA_RUN, "-l", "JavaScript", "-e", script], capture_output=True, text=True, timeout=timeout)
    return (p.stdout or "") + (p.stderr or "")


def chrome_open(url):
    script = f'''
    const Chrome = Application("Google Chrome");
    Chrome.activate();
    if (Chrome.windows.length === 0) Chrome.makeNewWindow();
    const w = Chrome.windows[0];
    const t = Chrome.Tab({{URL: {json.dumps(url)}}});
    w.tabs.push(t);
    delay(3);
    w.activeTab.url();
    '''
    p = subprocess.run([JXA_RUN, "-l", "JavaScript", "-e", script], capture_output=True, text=True, timeout=30)
    return (p.stdout or "").strip() + (p.stderr or "").strip()


def rec(surface, action, ladder, receipt):
    ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ") if False else ""
    print(f"{surface} | {action} | {ladder} | {str(receipt)[:200]}", flush=True)


from datetime import datetime

def log(surface, action, ladder, receipt):
    ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"{ts} | {surface} | {action} | {ladder} | {str(receipt)[:220]}", flush=True)


def main():
    # ===== 1. Claude manage page =====
    url = chrome_open("https://claude.ai/directory/manage/councilof-ai")
    log("Claude", "open", "INSTALLED", url)
    time.sleep(4)
    body = chrome_js("document.body ? document.body.innerText.slice(0,2500) : 'none'")
    log("Claude", "body", "INSTALLED", body[:400])
    btns = chrome_js("JSON.stringify([...document.querySelectorAll('button,a,input[type=submit]')].map(b=>({t:(b.innerText||b.value||'').trim().slice(0,50),tag:b.tagName})).filter(x=>x.t).slice(0,40))")
    log("Claude", "btns", "INSTALLED", btns[:500])
    # try publish
    pub = chrome_js("""
      (() => {
        for (const b of document.querySelectorAll('button,a,input[type=submit]')) {
          const t = ((b.innerText||b.value||'')+'').toLowerCase();
          if (t.includes('publish') && !b.disabled) { b.click(); return 'clicked:'+t.trim().slice(0,40); }
        }
        return 'no-publish';
      })()
    """)
    log("Claude", "publish", "INSTALLED" if "clicked" in pub else "DISCOVERED", pub)
    time.sleep(3)
    after = chrome_js("document.body.innerText.slice(0,800)")
    log("Claude", "after", "INSTALLED", after[:300])

    # ===== 2. Glama admin =====
    url = chrome_open("https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc/admin")
    log("Glama", "open", "INSTALLED", url)
    time.sleep(3)
    body = chrome_js("document.body ? document.body.innerText.slice(0,1500) : 'none'")
    log("Glama", "body", "INSTALLED", body[:350])
    # try save/update/claim
    act = chrome_js("""
      (() => {
        for (const b of document.querySelectorAll('button,a,input[type=submit]')) {
          const t = ((b.innerText||b.value||'')+'').toLowerCase();
          if ((t.includes('save') || t.includes('update') || t.includes('claim') || t.includes('publish')) && !b.disabled) {
            b.click(); return 'clicked:'+t.trim().slice(0,40);
          }
        }
        return 'no-action';
      })()
    """)
    log("Glama", "action", "INSTALLED" if "clicked" in act else "DISCOVERED", act)

    # ===== 3. Smithery =====
    url = chrome_open("https://smithery.ai/")
    log("Smithery", "open", "INSTALLED", url)
    time.sleep(3)
    body = chrome_js("document.body ? document.body.innerText.slice(0,1200) : 'none'")
    log("Smithery", "body", "INSTALLED", body[:300])
    act = chrome_js("""
      (() => {
        for (const b of document.querySelectorAll('button,a')) {
          const t = ((b.innerText||b.value||'')+'').toLowerCase();
          if ((t.includes('publish') || t.includes('login') || t.includes('sign in') || t.includes('sign in with')) && !b.disabled) {
            b.click(); return 'clicked:'+t.trim().slice(0,40);
          }
        }
        return 'no-action';
      })()
    """)
    log("Smithery", "action", "INSTALLED" if "clicked" in act else "DISCOVERED", act)

    # ===== 4. LaunchStag step3 (badge verify page) =====
    url = chrome_open("https://launchstag.com/claim/ca14035d-7e6e-421a-9eb4-0a1ee5d67768")
    log("LaunchStag", "open", "INSTALLED", url)
    time.sleep(3)
    body = chrome_js("document.body ? document.body.innerText.slice(0,1200) : 'none'")
    log("LaunchStag", "body", "INSTALLED", body[:350])

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
