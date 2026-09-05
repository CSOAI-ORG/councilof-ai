/**
 * GET /badge.md — the badge, as something you can actually paste.
 *
 * WHY THIS EXISTS. /api/badge has been live and reliable for a while, and /badge renders a page
 * about it — but that page is the React shell, so the served HTML contains no snippet at all.
 * An answer engine reading the bytes finds nothing to quote, and a human reading the page has
 * nothing to copy. A badge nobody is handed is not a distribution channel; it is an endpoint.
 * This file is the plain-text, no-JavaScript, crawler-visible version: every snippet is in the
 * response body, so it works for a reader, a scraper and an agent identically.
 *
 * WHAT IT WILL NOT DO. There is no "certified" badge and there never will be — the estate
 * measures and does not certify, and a badge that implied a conformity mark would be the exact
 * failure this project exists to measure in others. An unmeasured subject renders honestly as
 * "unmeasured" in grey rather than as a flattering zero, and that variant is documented here
 * beside the others rather than quietly omitted.
 *
 * NO CLOCK, NO FROZEN COUNT. This file hard-codes no number. Every badge URL below resolves
 * against the live board when it renders, so a snippet pasted today cannot drift into a lie
 * tomorrow: if the board changes, the reader's badge changes with it.
 */

const SITE = "https://councilof.ai";
const LID =
  "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.";

export function onRequestGet(): Response {
  const body = `# Badges — copy and paste

The badge renders live from \`GET ${SITE}/api/gspc\`. Nothing below hard-codes a number, so a
badge you paste today cannot drift into a false claim tomorrow — if the board changes, your
badge changes with it. No account, no key, no sign-up, and no rate limit to negotiate.

**Lid:** ${LID}

---

## The board's own count

\`\`\`markdown
[![GSPC](${SITE}/api/badge)](${SITE}/gspc-verify)
\`\`\`

## One axis, live

\`\`\`markdown
[![governance](${SITE}/api/badge?axis=governance)](${SITE}/api/gspc)
\`\`\`

Any axis the board carries works: \`governance\`, \`safety\`, \`provenance\`, \`continuity\`,
\`conformance\`, \`openness\`, \`machinery-conformity\`, \`care\`, \`cross-reality\`,
\`detector-interop\`, \`art5-safeguard\`, \`swarm\`, \`affect\`, \`jail\`, and the
deterministic-fact axes. An axis that is not measured renders **unmeasured** in grey. An axis
whose lead is a tie renders as a tie. Neither is dressed up.

## One signed card

\`\`\`markdown
[![card](${SITE}/api/badge?card=YOUR_CARD_SHA256)](${SITE}/gspc-verify)
\`\`\`

This reflects whether that card carries a signature. It does **not** assert that the card
verifies — running the check is your job, and the point is that you can:
<${SITE}/signed/HOW-TO-VERIFY.md>.

## Your own measured count

\`\`\`markdown
[![measured](${SITE}/api/badge?measured=9&label=yourproject)](${SITE}/api/gspc)
\`\`\`

## shields.io endpoint

\`\`\`markdown
![GSPC](https://img.shields.io/endpoint?url=${encodeURIComponent(`${SITE}/badge/gspc.svg?format=shields`)})
\`\`\`

---

## What the colours mean

| render | meaning |
|---|---|
| green | measured, and the lead is statistically separated |
| lime | measured, but the point-estimate lead is a tie — a real distinction, shown not hidden |
| grey | **unmeasured** — a declared slot with no run behind it, never a fabricated zero |

## What no badge here will ever say

There is no "certified" badge, no "approved" badge, no conformity mark, and no badge you can
buy. A card is evidence of what specific bytes scored on a frozen bank at a specific time — not
an approval, a rating, or a safety guarantee. **No slot is for sale.**

## If you would rather read the numbers directly

- Live board (authority): <${SITE}/api/gspc> — one GET, no key, answers in well under a second
- Verify a card, free and with no account: <${SITE}/gspc-verify>
- Transparency root: <${SITE}/root.json> · what changed, as a feed: <${SITE}/feed.xml>
- Every frozen bank as its own repository: <https://huggingface.co/csoai>
- Python reader and card verifier: \`pip install "csoai-gspc[verify]"\`
- MCP server: \`claude mcp add gspc -- npx -y csoai-gspc-mcp\`

Issued by CSOAI Ltd (England & Wales, Companies House 16939677), 3rd Floor, 86–90 Paul Street,
London EC2A 4NE. Measurement, not certification.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=600",
      "x-csoai-doctrine": "measurement, not certification",
    },
  });
}
