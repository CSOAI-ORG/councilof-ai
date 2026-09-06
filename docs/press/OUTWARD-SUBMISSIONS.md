# Outward submissions — where a stranger could find us, and does not

Every row was probed on **2026-09-05** with the command in its own line. Nothing here has been
submitted: a directory form is filled by a person in a browser, and posting under CSOAI's name is
the owner's. Each row carries the text ready to paste, so submitting is a copy, not a drafting job.

**Format.** `SUBMIT` = an open form, no password account needed to fill it.
`ACCOUNT` = a password-only sign-up stands in the way; one line, then move on.

---

## SUBMIT — OECD.AI Catalogue of Tools & Metrics for Trustworthy AI

```
curl -s -o /dev/null -w '%{http_code}\n' -L https://oecd.ai/en/catalogue/tools/submit      # 200
curl -sL "https://oecd.ai/en/catalogue/tools?search=CSOAI" | grep -ci csoai                # 0
```

**Why this one first.** It is an intergovernmental catalogue that procurement, regulators and
policy researchers actually read, submission is free, and **we are not in it** — 0 mentions on
its own search. It is the single largest gap between "we measure AI systems in public" and "a
regulator can find us without being told we exist".

**What it unlocks.** A permanent, citable listing beside the tools our own board measures against,
reachable by people who will never read a repo.

**Ready text — tool description (paste as-is):**

> **Council of AI — GSPC measurement board.** A free, public, keyless measurement board for AI
> systems. 22 axes carry a graded run; 14 are behavioural (a fleet of models answers a frozen
> bank, graded deterministically) and 8 are deterministic-fact runs graded by rule with no model
> and no judgement. Every published figure is derived from a signed artifact at request time,
> never typed, and each measurement links to the Ed25519 card behind it, which anyone can verify
> offline with the verifier we publish — no account, no key, no fee, permanently.
>
> The board publishes what it has NOT measured with equal prominence: UNMEASURED is a first-class
> state, never a hidden zero. A public corrections ledger records every figure we got wrong, how
> it was caught (usually by our own instrument), and the fix.
>
> This is measurement, not certification. We do not certify, accredit, or issue conformity
> assessments, and a grade is never sold.
>
> Board: https://councilof.ai/api/gspc · Verify: https://councilof.ai/gspc-verify ·
> Corrections: https://councilof.ai/api/corrections · Operator: CSOAI Ltd, UK Companies House
> 16939677.

**Fields it will ask for, with the answer already derived:**

| field | value | proof |
|---|---|---|
| Type of tool | Procedural / technical — measurement & benchmarking | — |
| Licence | CC-BY-4.0 (board data) | `curl -s https://councilof.ai/api/gspc \| jq -r .license` |
| Maturity | In production, free | — |
| Country | United Kingdom | Companies House 16939677 |
| Link | https://councilof.ai | — |

---

## SUBMIT — mcpservers.org

```
curl -s -o /dev/null -w '%{http_code}\n' -L https://mcpservers.org/submit                  # 200
```
**Why.** Our MCP door is live and listed in the official registry, but a developer browsing a
directory will not find it. **What it unlocks.** Discovery by MCP client users.

**Ready text:** *Council of AI — GSPC.* Remote MCP server (HTTP) exposing the live AI-measurement
board: seven free read-only tools (board totals, per-axis reads, card verification, inclusion
proofs) plus metered evidence tools over x402. Verification is free and needs no account.
`POST https://councilof.ai/mcp` · registry id `io.github.CSOAI-ORG/gspc`.

---

## SUBMIT — mcp.so

```
curl -s -o /dev/null -w '%{http_code}\n' -L https://mcp.so/submit                          # 200
```
**Why / unlocks / text:** as mcpservers.org above.

---

## SUBMIT — awesome-mcp-servers (pull request, not an account)

```
curl -s -o /dev/null -w '%{http_code}\n' -L https://github.com/punkpeye/awesome-mcp-servers   # 200
```
**Owner-gated by policy, not by credentials.** This is a PR to somebody else's repository, and
this estate does not open PRs under CSOAI's name on other people's repos. The one-line entry is
ready; a human decides whether to send it.

> `[Council of AI — GSPC](https://councilof.ai/mcp)` — free, keyless AI-measurement board: board
> totals, per-axis reads, and offline-verifiable Ed25519 measurement cards.

---

## ACCOUNT — pulsemcp.com

```
curl -s -o /dev/null -w '%{http_code}\n' -L https://www.pulsemcp.com/submit                # 403
```
`ACCOUNT pulsemcp https://www.pulsemcp.com/submit — directory submission is behind a 403 to
automated clients; a browser session is required. Unlocks: MCP directory discovery.` One line,
next item.

---

## Not pursued, and why

- **Newsletters** (e.g. State of AI). A newsletter placement is a pitch to an editor, not a
  submission form. Pitching under CSOAI's name is the owner's, and there is nothing to automate.
- **Any directory that charges.** Verification is free forever here; paying for a listing that
  describes free verification is not a line worth crossing, and payment is owner-gated anyway.
- **Anything requiring a claim we cannot source.** Several directories ask for user counts or
  funding. `/api/revenue` holds every count null until a receipt settles and there is no counter
  behind the others; a form field is not a reason to invent one. Leave blank, or do not submit.

## Re-run the whole probe

```
for u in https://oecd.ai/en/catalogue/tools/submit https://mcpservers.org/submit \
         https://mcp.so/submit https://www.pulsemcp.com/submit \
         https://github.com/punkpeye/awesome-mcp-servers; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 20 "$u")" "$u"
done
```

---

## STATUS BOARD — 20 directories probed, 1 submitted (updated 2026-09-06)

| surface | outcome | why |
|---|---|---|
| **mcpservers.org** | **SUBMITTED** | account-free, fee-free, captcha-free. "Submission Successful… reviewed within 12 hours." |
| OECD.AI catalogue | **pre-filled, awaiting owner** | reCAPTCHA + a personal certification checkbox |
| mcp.so | owner ask | paid account exists; the paid submission route is not discoverable in the UI |
| pulsemcp | owner ask | HTTP 403, "API-based access… contact hello@pulsemcp.com" |
| MCP Hub | blocked | **HTTP 402 Payment Required** at the protocol level |
| AI Incident Database | **refused on fit** | open form, but it is a corpus for reporting AI *incidents*. We have none. See below. |
| Product Hunt · toolify.ai | blocked | 403 + reCAPTCHA |
| glama.ai | **already listed** | `/mcp/servers/CSOAI-ORG/councilof-ai` with get_axis, board_totals, verify_card |
| mcp-get.com · opentools.com | blocked | 404 — no submission surface exists |
| mcpmarket.com · futuretools.io | blocked | paid tier / reCAPTCHA |

**The pattern, measured rather than assumed:** of 20 directories, exactly **one** accepted an
account-free submission. This market is mostly paid placement or human-gated. "Submit to
directories" is not a volume activity.

### Why the AI Incident Database was refused

Its form is open, uncaptcha'd, accountless and takes 12 fields. It is also a database for
reporting **AI incidents**, an evidence base other researchers rely on. We have no incident to
report, and filing a measurement-board listing there would pollute someone else's corpus. A form
being open is not an invitation. If one of our own published figures ever causes harm, that is the
row that belongs there — and the corrections ledger is where it would start.

---

## OECD.AI — the exact values, so this survives a browser restart

A tab is pre-filled in the `~/.hermes/browser-profile` Chrome and verified by reading each field
back. If that tab is lost, paste these:

| field | value |
|---|---|
| Name of the tool | `Council of AI — GSPC measurement board` |
| Website | `https://councilof.ai` |
| Github | `https://github.com/CSOAI-ORG/councilof-ai` |
| Email | `nicholas@csoai.org` |
| Your relation | *I work in or am affiliated to the organisation that created the tool* |
| Licence | CC-BY-4.0 (board data) |
| Country | United Kingdom (Companies House 16939677) |

**Excerpt (paste verbatim):**

> A free, public, keyless measurement board for AI systems. Every published figure is derived from
> a signed artifact at request time, never typed, and each measurement links to the Ed25519 card
> behind it, which anyone can verify offline — no account, no key, no fee. UNMEASURED is published
> with equal prominence, and a public corrections ledger records every figure we got wrong, how it
> was caught, and the fix. Measurement, not certification.

**Left to the owner, deliberately:** the "I certify that all information included in this…"
checkbox (a personal certification, not an agent's to tick), the reCAPTCHA (an anti-bot control,
not ours to defeat), and Submit. Optional fields left blank: Benefits, Enforcements, Keywords.
