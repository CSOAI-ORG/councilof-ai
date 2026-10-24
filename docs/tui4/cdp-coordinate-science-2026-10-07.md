# TUI-4 CDP API-Key Coordinate & Route Science — 7 Oct 2026 (measured)

Owner-approved EAT session. Goal: create ONE Coinbase Developer Platform secret API key
(`csoai-x402-bazaar-index`), capture its secret **without it ever entering any transcript**,
write `~/.config/csoai/cdp.env` (mode 600), run `scripts/x402/cdp_index_settle.py` ($0.01
self-settle, owner-approved), verify CDP indexing.

**Status at handoff: NOT COMPLETE — 0 keys exist (page reloaded and verified empty). Modal
opens, name types, Create click not yet landed. One owner click finishes it (see §7).**

## What is PROVEN (reproduce, don't re-derive)

| Fact | Evidence |
|---|---|
| Target window: Chrome pid 49024, driver window_id **1192** (ids drift — re-find by title every run) | `list_windows` |
| `cua-driver` must be launched via `open …/CuaDriver.app` (LaunchServices) — raw `serve` = TCC gate `missing-accessibility` | status flags `--cua-internal-gate-*` |
| MCP computer_use client goes stale after daemon restarts → use CLI: `cua-driver call <tool> '<json>'` | session |
| click params: `element_token` + `pid` only (adding `window_id` → `conflicting_element_target`; no `pid` → required-field error) | session |
| **Background click route = AXPress**: works for links, checkboxes, browser chrome, modal-OPEN button; **does NOT activate the modal's Create** (or we never hit it — see §4) | multiple |
| **Foreground click (`delivery_mode=foreground`) coordinate space = RAW WINDOW-LOCAL pt** (origin = window top-left incl. tab strip; NO scaling; NOT global screen; negative globals fail) | (1027,715) closed modal = real hit |
| `type_text` + `delivery_mode=foreground` types REAL keystrokes into front window — **WORKS** after `osascript 'tell Chrome to activate'` (23/23 chars verified by vision) | `delivered_count:23` |
| Enter in the name field does NOT submit; Tab-order is unreliable (14 tabs to Cancel from body start) | sweep log |
| System Events (osascript) writes = TCC-blocked `-25211`; Chrome AppleScript (`activate`, `set index of window`, tab switch) = WORKS (no TCC) | session |
| `press_key`/`hotkey` need foreground delivery (background → `same_pid_keyboard_ambiguity`, Chrome owns ≥3 windows) | session |
| `drag` = `background_unavailable`; route params (`route`, `background_route`) silently ignored; `set_config` = protected-scope refusal | session |
| Vision coordinate estimates vary ±40 px between calls (±136 pt) — never trust a single vision reading; use it only for coarse bands | multiple |
| Zoom: `call zoom {window_id, x1..y2}` (region space ≈ input-px), returns `screenshot_png_b64`, output normalized to 500 px wide; full window = 500×H | session |
| transform: `local_pt = img_px × (AX_window_W/500, AX_window_H/imgH)`; window RESIZES live (1886×972 → 1700×954) — re-read AX frame every attempt | session |

## Modal geometry map (window 1700×954, 7 Oct ~12:00)

- Modal card (from vision %): top ≈34% (y≈326), bottom ≈63.7% (y≈608) — **but closures prove
  card extends past 608 and closes begin by y715** → treat 590 < button_row < 715 as the search band.
- **Closed-without-key (= backdrop/Cancel) probes:** (1027,715), (1142,757), (748,715), (838,715),
  (1019,543), (903,580)→old window, (1087,753)→bg era. Right-edge backdrop boundary: x≥1019 at y543.
- **Dead-zone probes (in-card, no reaction):** x{750,790,830,870,920,945,959,989,1000} ×
  y{528,543,555,558,570,575,583,590}. → buttons NOT in that box.
- **Untested band:** y ∈ (591, 714) × x ∈ (700, 1010) — NEXT session starts here.
- AX "Cancel" frame (local x888 w88, cy715.5) is **unretrusted**: it sits in the closed-probe
  y-band; either stale node or its y is right and x-derivation is wrong. Re-validate before use.

## Canonical attempt loop (what the hourly cron runs)

1. `open …/CuaDriver.app` until `cua-driver status` = running.
2. AppleScript: find tab whose title contains `API keys` (else
   `make new tab at end of tabs of window 1 with properties {URL: <api-keys url>}`),
   `set active tab index`, `set index of w to 1`, `activate`.
3. Re-find window by title via `list_windows` (never cache ids).
4. gws → if no `API key nickname` field: AX-click `Create secret API key`.
5. AX-click nickname → `osascript activate` → `type_text delivery_mode=foreground`
   `"csoai-x402-bazaar-index"` → **zoom + vision: confirm text, confirm Create CENTER %**.
6. Convert with FRESH AX window frame. Click grid around vision point AND the untested band
   (y591-714 step ~25, x 830/880/930/980), one click → 2.3 s → state check:
   - form open → dead zone, next
   - form closed + AX row `csoai` or real AXButton `Copy` (NEVER AXMenuItem!) → SUCCESS
   - form closed + nothing → backdrop/Cancel → restage (step 4) and continue
7. On SUCCESS: `printf 'CSOAI_CDP_SENTINEL…' | pbcopy` BEFORE clicking Copy; click Copy
   (element_token, role AXButton/AXLink only); `pbpaste` validated silently
   (len 40-512, `[A-Za-z0-9+/=_\-.]+`, ≠ sentinel) → append `CDP_API_KEY_SECRET=` to
   `~/.config/csoai/cdp.env` mode 600 **without printing it**.
8. Read Key ID from table (AX, Allowed in transcript — public identifier), append `CDP_API_KEY_ID=`.
9. `python3 scripts/x402/cdp_index_settle.py --dry-run` → then real run ($0.01, pre-approved
   by owner EAT 7 Oct) → record tx/settle receipt → verify listing/index state → append evidence
   to `docs/tui4/gap-register-2026-10-07.json` (`indexed`, never `measured`).
10. If ≥3 runs without success: stop clicking; post status; owner one-click fallback (§7).

## Hard rules (never violate)

- Secret NEVER enters transcript/context: no screenshots of success panel, no vision on it,
  clipboard validated by length/charset only.
- No `AXMenuItem` matches for Copy/Done (Chrome Edit menu false-positive).
- Table `Algorithm` cell must read **Ed25519** after creation; if ECDSA → delete key, recreate
  (Advanced settings is collapsed; algorithm choice lives there if any).
- Rekor/OTS/root claims unchanged by this work: Rekor witnessed `2791822965`; OTS
  `STAMPED_PENDING_BITCOIN`; public root 167; historical corpus 335; no anchors touched.
- Settlement = **internal self-funded probe**, classification `INTERNAL_SELF_FUNDED`,
  never revenue.

## §7 Owner one-click fallback (fastest path)

Modal is open on window 1192 with the name already typed: click **Create**, then on the
success panel click **Copy**, then say `copied` in chat → agent silently writes cdp.env and
runs the settle. (~10 seconds of owner time.)
