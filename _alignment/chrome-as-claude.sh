#!/bin/bash
# Drive the user's real logged-in Chrome via AppleScript
set -e
OUT=/Users/nicholas/clawd/_alignment/chrome-as-20261007.log
echo "=== $(date -u +%FT%TZ) ===" | tee -a "$OUT"

# 1) Claude Publish portal
osascript <<'AS' | tee -a "$OUT"
tell application "Google Chrome"
  activate
  if (count of windows) = 0 then make new window
  set w to window 1
  set t to make new tab at end of tabs of w with properties {URL:"https://claude.ai/admin-settings/directory/submissions/councilof-ai"}
  delay 4
  set pageTitle to title of t
  set pageURL to URL of t
  -- dump body text
  set bodyText to execute t javascript "document.body ? document.body.innerText.slice(0,1500) : 'no-body'"
  return "CLAUDE | " & pageTitle & " | " & pageURL & " | " & bodyText
end tell
AS

# 2) Snapshot buttons on that tab
osascript <<'AS' | tee -a "$OUT"
tell application "Google Chrome"
  set t to active tab of window 1
  set btns to execute t javascript "JSON.stringify([...document.querySelectorAll('button,a[role=button],input[type=submit]')].map(b=>({t:(b.innerText||b.value||'').trim().slice(0,40), d:b.disabled})).filter(x=>x.t))"
  return "CLAUDE_BTNS | " & btns
end tell
AS

# 3) Click Publish if present
osascript <<'AS' | tee -a "$OUT"
tell application "Google Chrome"
  set t to active tab of window 1
  set r to execute t javascript "
    (() => {
      for (const b of document.querySelectorAll('button, a[role=button], input[type=submit]')) {
        const t = (b.innerText||b.value||'').toLowerCase();
        if (t.includes('publish') && !b.disabled) { b.click(); return 'clicked:'+t.trim().slice(0,30); }
      }
      return 'no-publish-button';
    })()
  "
  delay 3
  set after to execute t javascript "document.body.innerText.slice(0,800)"
  return "CLAUDE_CLICK | " & r & " | " & after
end tell
AS

echo "=== done claude ===" | tee -a "$OUT"
