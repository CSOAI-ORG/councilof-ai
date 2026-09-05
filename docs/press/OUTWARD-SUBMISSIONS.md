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
