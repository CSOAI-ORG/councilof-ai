# BACKLOG — TUI-6 visibility + standards (communications). 2026-09-05.

Every row carries the command that proves the row is real. A row with no proof command is not a
backlog item, it is an opinion. Rows are taken from the top; new rows are appended by the hunt.

## OPEN — found by hunting outward, 2026-09-05

| # | Row | PROOF | State |
|---|---|---|---|
| B-01 | **Three public Zenodo deposits carry RETIRED INTERNAL CODENAMES in their DOI-minted titles** — "SOVOS / SOV Space", "The SOVOS Flywheel", "The SOV Signal", all authored Templeman, Nicholas. `AGENTS.md` bans these from public output. A Zenodo title is permanent-ish: it is corrected by publishing a new version, never deleted. | `curl -sL "https://zenodo.org/api/records/?q=csoai&size=10" \| jq -r '.hits.hits[].metadata.title'` | **OWNER-ASK** — Zenodo credentials + a new version per record |
| B-02 | **The agent card does not reference the A2A signed-receipts extension.** The extension serves 200 at its canonical URL, but an agent discovering us via `/.well-known/agent-card.json` cannot find it — `ext: 0`. | `curl -s https://councilof.ai/.well-known/agent-card.json \| jq '[..\|strings\|select(test("signed-receipts"))] \| length'` → 0 | OPEN — repo change, takeable |
| B-03 | **`/api/feed.xml` is hand-typed and freezes counts.** Its top item is titled "22 axis · 22 measured"; its own comment says items are appended by hand. Superseded by the derived feeds in this lane, but the old feed still serves the frozen titles. | `curl -s https://councilof.ai/feed.xml \| grep -c "<item>"` and `grep -n "const ITEMS" functions/api/feed.xml.ts` | OPEN — retire or derive after the feeds land |
| B-04 | **Cloudflare 403s any UA prefixed `Python-urllib`, site-wide** — including `Python-urllib3`, the transport under `requests`. `urllib.request` is the zero-dependency way an agent reads a URL, against an estate whose offer is keyless reading. | `python3 -c "import urllib.request;urllib.request.urlopen('https://councilof.ai/api/gspc')"` → 403; same client with a GPTBot UA → 200 | **OWNER-ASK** — Cloudflare dashboard, not a repo change |
| B-05 | **`/honesty` hard-codes "335 signed measurement cards … all 335 verify"** in rendered page copy — a frozen count on the page that exists to state what we have not measured. | `curl -s https://councilof.ai/honesty/ \| grep -o "335 signed measurement cards"` | OPEN — outside this lane's FILE AREA, reported |
| B-06 | **No surface is confirmed live.** The spray log carries 24 `drafted` + 3 `queued`, every one owner-gated, and zero `live`. `/api/press.json` publishes `distribution_surfaces.live` as **null, not 0**, so the gap stays legible. | `jq '[.[].status]\|group_by(.)\|map({(.[0]):length})\|add' scripts/badger/_spray-log-v2.json` | **OWNER-ASK** — HF_TOKEN, kaggle.json |
| B-07 | **Wikidata Q141128616 exists with only 7 statements.** No web-feed URL, no source-code repository, no documentation URL, no official name — all of which we can source to a public artifact. | `curl -s "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q141128616&format=json&props=claims" \| jq '.entities.Q141128616.claims\|keys'` | OPEN — statements DRAFTED, owner submits (self-editing is a conflict of interest) |
| B-08 | **`/.well-known/scitt-configuration` is 404** while `/.well-known/scitt.json` is 200. Anything probing the conventional discovery path finds nothing. | `curl -s -o /dev/null -w '%{http_code}\n' https://councilof.ai/.well-known/scitt-configuration` → 404 | OPEN — takeable |
| B-09 | **`settled_usdc` is UNMEASURED and fail-closed by design** — "null until X402_PAY_TO + a facilitator are provisioned and a receipt settles". Two doors answer 200 (`/api/x402`, `/mcp`); neither has produced a settled receipt. | `curl -s https://councilof.ai/api/revenue \| jq '.settled_usdc\|{count,status}'` | **OWNER-ASK** — X402_PAY_TO + facilitator |
| B-10 | **`/press` served "This legacy page is temporarily withdrawn."** Withdrawing is right for copy nobody can stand behind and wrong forever. | `curl -s https://councilof.ai/press/ \| grep -c "temporarily withdrawn"` | **TAKEN** — derived `/press/` + `/api/press.json` in this lane |

## Rules this backlog obeys

- **Absent is not zero.** `surfaces live` is null while nothing is confirmed live; it does not
  become 0, because 0 reads as a measured result.
- **An owner-ask is a row, not a blocker.** It gets one line naming the credential and what it
  unlocks, then the next item is taken.
- **Nothing is posted under CSOAI's name on anyone else's repo, list or registry.** Wikidata
  statements, the OLP review and the I-D announcement are drafts; the owner sends.
