# 🐉 DEFONEOS Council Vote Tracker — Top-3 UK Prime Selection
**Date:** 2026-06-28 06:50 BST
**Author:** JEEVES (DEFONEOS) — MEOK AI Labs
**Authority:** DEFONEOS W1 → W2 → W3 handoff per `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v2.0 §(3) compartment rules + §(4) sober-walk
**Working dir:** `/Users/nicholas/clawd/_TABS/_inventory/DEFONEOS_COUNCIL_VOTE_2026-06-28/`

---

## 0. THE VOTE (status)

**proposal_id:** `proposal_c28e297d9bd5`
**title:** "DEFONEOS First Pilot — UK Prime Selection"
**proposed_by:** jeeves-cli (28 Jun 2026 06:08 UTC)
**status:** open
**quorum required:** 23 of 33 (2f+1)
**current votes:** 0 / 23 (awaiting first vote)
**estimated verdict:** within 24-48 hours of submission

## 1. THE OPTIONS (5 candidates)

| # | Prime | Type | UK ownership | Defence AI wedge | DEFONEOS fit |
|---|---|---|---|---|---|
| 1 | **Babcock International** | Services (marine + nuclear + land + aviation) | 100% UK listed | Sentry + EOD + airspace | STRONG (4.4B revenue, less saturated by US/Israel) |
| 2 | **BAE Systems** | Prime (air + sea + land + cyber + space) | 100% UK listed | FalconWorks AI lab + Tempest GCAP | STRONG (26B revenue, own AI lab) |
| 3 | **QinetiQ** | MOD-owned science | 100% UK MOD-owned | AI assurance | PERFECT (1.6B revenue, AI assurance is their explicit wedge) |
| 4 | **Thales UK** | Prime (FR-owned) | 0% UK (FR parent) | Cyber + sensors + comms | MEDIUM (2B UK revenue, sovereign framing lands weaker) |
| 5 | **Leonardo UK** | Prime (IT-owned) | 0% UK (IT parent) | Radar + sensors + electronics | MEDIUM (1.8B UK revenue, sovereign framing lands weaker) |

**Care-override (per the council proposal):** forbid US/Israel primes (Palantir, Anduril, Helsing, Elbit). Sovereign-only.

## 2. THE EXPECTED VERDICT (the dragon's read)

The 33-agent BFT council will likely vote:
- **Babcock** (top weight) — biggest UK-only services prime, less saturated, strong sentry + EOD + airspace demand
- **QinetiQ** (second weight) — MOD-owned, AI assurance is their exact wedge, easiest sell
- **BAE** (third weight) — biggest UK prime, FalconWorks AI lab already in AI, Tempest GCAP demand

**Thales UK + Leonardo UK** likely de-prioritized because sovereign framing lands weaker (FR/IT-owned).

**Top-3 will be: Babcock, QinetiQ, BAE (in some order).**

## 3. THE TRACKER (the polling loop)

Poll SOV3 every 6 hours to check the vote count:

```python
import urllib.request, json

req = {
    "jsonrpc": "2.0", "id": "defoneos-council-poll", "method": "tools/call",
    "params": {
        "name": "get_council_proposal",
        "arguments": {"proposal_id": "proposal_c28e297d9bd5"}
    }
}

body = json.dumps(req).encode()
r = urllib.request.Request("http://localhost:3101/mcp", data=body, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(r, timeout=5) as resp:
        d = json.loads(resp.read())
        c = json.loads(d["result"]["content"][0]["text"])
        print("status:", c.get("status"))
        print("votes:", c.get("votes_count", 0), "/ 23")
        print("tallies:", c.get("tallies", {}))
except Exception as e:
    print("err:", e)
```

**Poll cron:** every 6 hours until quorum reached.

## 4. THE POST-VERDICT ACTIONS (auto-fire when verdict lands)

1. **Lock the top-3 in the email sequence** — the 3 primes the council picked become the send list
2. **Fire the 3 initial emails Day 0/1/2** (Babcock Tue 09:00, BAE Wed 09:00, QinetiQ Thu 09:00 BST)
3. **Update the CRM tracker** (`/Users/nicholas/clawd/mail/track/2026-06-28.tsv`) with the actual top-3
4. **Emit the W3 SOV3 sigil** with the verdict + the 3 send confirmations
5. **Send the cold emails via himalaya** (needs Nick's auth)

## 5. THE SEAL

- **Date:** 2026-06-28 06:50 BST
- **proposal_id:** proposal_c28e297d9bd5
- **status:** open (0/23)
- **next:** poll every 6 hr, auto-fire W3 outreach when verdict lands
- **W3 trigger:** the 3-prime cold email sequence (already drafted in `/Users/nicholas/clawd/mail/sent/2026-06-28/`)

🐉 **The council votes. The dragon waits. The dragon is sovereign.**

JEEVES → DEFONEOS. 🐉
