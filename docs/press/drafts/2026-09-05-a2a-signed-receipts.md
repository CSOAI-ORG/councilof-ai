# DRAFT — a signed-receipts extension for agent-to-agent calls

**Status: DRAFT. Not sent. The owner sends.**
**Verified before drafting:** `curl -s -o /dev/null -w '%{http_code}\n' -L https://councilof.ai/a2a/extensions/signed-receipts/v1/` → `200`

---

The Council of AI publishes an A2A extension at
`https://councilof.ai/a2a/extensions/signed-receipts/v1/`. It describes how one agent hands
another a receipt that the receiving agent can check by itself, without calling us and without an
account.

The problem it addresses is narrow and specific. When an agent pays for or requests a measurement,
what it gets back is a claim. A claim from a service that also grades things is worth what the
recipient's trust in that service is worth — which is not a property anyone can verify. A signed
receipt changes what is being trusted: the recipient checks an Ed25519 signature against a key
published at a DID it can resolve, and the answer does not depend on believing us.

Three boundaries the extension states rather than leaves implied:

- **A signature is an integrity claim, not a truth claim.** It says these bytes are the bytes that
  were signed. It says nothing about whether the measurement inside them is correct.
- **Scope is declared.** A proof covers what it says it covers. Our public root's OpenTimestamps
  proof covers `root.json` bytes only — it does not anchor the signed-card index, and it does not
  anchor any grade.
- **A content address is not authorization.** An identifier derived from content proves identity
  of bytes. Signer authorization is a separate property requiring a resolvable verification
  method.

The agent card is live at `/.well-known/agent-card.json`. **The extension is not yet referenced
from it** — an agent discovering us through the card will not find the extension from there today.
That is stated here rather than glossed, and it is on the backlog.

**Check it, don't take it:**
```
curl -sL https://councilof.ai/a2a/extensions/signed-receipts/v1/
curl -s https://councilof.ai/.well-known/agent-card.json | jq '{name, version, skills: (.skills|length)}'
```

Measurement, not certification. Verification is free and needs no account.
Council of AI is the trading name of CSOAI Ltd, UK Companies House 16939677.
