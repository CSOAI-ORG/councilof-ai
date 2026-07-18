# Town Feed Contract — wire Kimi's Agent-47 UI to REAL signed data

`town_feed.py` (this dir) emits **`town_feed.json`**: the actual King-hive governed-vs-ungoverned
verdicts + the signed Policy-Lab result + the SIGIL/Bitcoin anchors. This replaces the town UI's
`Math.random()` fakes and hardcoded governance with **real, cryptographically-attested data.**

## Regenerate
```bash
# pull current data, then:
PL_VERDICTS=king_hive_verdicts.jsonl PL_POLICY=policy_lab_dora.jsonl PL_ANCHORS=anchors \
  PL_OUT=app/public/town_feed.json python3 town_feed.py
```
Run on a host with the data (or scp the inputs first). Drop the output at `app/public/town_feed.json`
so Vite serves it statically. (A cron can refresh it; or regenerate after each anchor run.)

## JSON shape (what the UI fetches)
```jsonc
{
  "generated_at": "ISO-8601",
  "scope": "IN-SIMULATION; only attestable verdicts; verify yourself…",   // show as a banner
  "summary": {
    "king_hive": {"total_rounds": 479, "attestable": 14, "wins": {"A":10,"B":4,"TIE":0}, "avg_margin": 0.042},
    "policy_lab": {"experiments": 1, "latest": "TREATMENT_WINS", "agents": "stub"},
    "anchors": {"count": 2, "latest_root": "d656…", "bitcoin": "pending-or-confirmed"}
  },
  "recent_verdicts": [ {"ts","winner","margin","prompt","king","queen","signed"} … up to 20 ],
  "policy_lab":      [ {"experiment_id","verdict","agents","attestable","merkle_root","signed","aggregate","scope"} ],
  "anchors":         [ {"anchor","root","n_attestable","ts_first","ts_last","ots_proof"} ],
  "verify": {"repo":"https://github.com/CSOAI-ORG/sigil-proofs","how":"git clone … && python3 verify_anchor.py …"}
}
```

## UI wiring (suggested, Kimi's call)
| Town UI element | Feed field |
|---|---|
| Live feed / notifications (currently `Math.random()` on 8s) | `recent_verdicts` (real signed A/B decisions) |
| Dashboard stat cards | `summary.king_hive` / `summary.policy_lab` / `summary.anchors` |
| Governance page (currently hardcoded votes) | `recent_verdicts` + `policy_lab` (real verdicts + experiment outcome) |
| New "Verify" affordance | `verify` (link out — "verify this town yourself, no trust required") |
| Scope banner | `scope` (keep the IN-SIMULATION label visible) |

Minimal change: `useTownStore` adds `fetch('/town_feed.json')` on load (+ interval), and the
random generators read from it instead of `Math.random()`.

## Honesty notes (carry into the UI)
- Show ONLY what the feed contains — it's already filtered to **attestable** verdicts; don't re-introduce fakes.
- Policy-Lab entries may be `agents:"stub"` — surface that label, don't hide it.
- Bitcoin anchors may be **pending** confirmation — say "pending" until `ots verify` confirms.
- For a FULLY-PUBLIC deploy, curate/redact `recent_verdicts[].prompt` (internal strategy text) —
  same commit-reveal discipline as `CSOAI-ORG/sigil-proofs`. The dev feed shows them for the demo.
