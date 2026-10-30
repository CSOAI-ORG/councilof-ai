# REGISTRY SUBMISSION RECORD — eight target directories, what each one actually requires

**Researched:** 2026-10-29 · **State:** **one of eight is agent-doable without an account; seven are owner-gated.**
**Nothing was submitted.** No account was created, no credential was minted, no listing was published.

---

## The short answer

The work plan's premise — "all rolling, all free, all agent-doable" — **is wrong for seven of the eight targets.**
Seven require an account, a business verification, a paid plan, or a device authorisation that only a human can
complete. One does not.

| # | Target | Account needed | Agent-doable without an account | The gate |
|---|---|---|---|---|
| 1 | **MCP Registry** | no | **yes, after one DNS or HTTP step** | a DNS TXT record, or a `/.well-known/mcp-registry-auth` file, on a domain the estate controls |
| 2 | AWS Agent Registry | yes | no | AWS account + IAM + an approval inside the account |
| 3 | AAIF project proposals | yes | no | GitHub login |
| 4 | Agentic SOC Alliance | yes | no | partner form; and CSOAI's fit as a **non-security** vendor is unestablished |
| 5 | CDF AI SIG | yes | no | a GitHub PR **plus** a Slack/TOC join |
| 6 | Smithery | yes | no | an API key with the `servers:write` scope, and a namespace |
| 7 | Claude Connector Directory | yes, **paid plan** | no | a paid Anthropic plan |
| 8 | OpenAI / Codex | yes | no | business verification |

---

## 1. MCP Registry — the one that is agent-doable

**Verified live, 2026-10-29:**

- `https://modelcontextprotocol.io/registry` — **200**
- `https://modelcontextprotocol.io/registry/authentication.md` — **200**
- `https://registry.modelcontextprotocol.io/v0/servers` — **200**, returns the live server list
- `mcp-publisher` (the official CLI, public npm package) — installed successfully in a scratch directory

**What the authentication document says, verbatim in substance:**

- **GitHub-based auth** → the server's name in `server.json` **MUST** be `io.github.username/*` or
  `io.github.orgname/*` (e.g. `io.github.alice/weather-server`).
- **Domain-based auth** → the name **MUST** be `com.example.*/*`, the reverse-DNS form of your domain
  (e.g. `io.modelcontextprotocol/everything`).
- **DNS auth** → publish a TXT record `v=MCPv1; k=ed25519; p=<PUBLIC_KEY>` (or `k=ecdsap384`), wait for propagation,
  then `mcp-publisher login dns --domain "${MY_DOMAIN}" --private-key "${PRIVATE_KEY}"`. The CLI also supports
  `google-kms` and `azure-key-vault` key backends.

**Why it still needs the owner.** Publishing to a **reverse-DNS name** requires a DNS TXT record on a domain the estate
controls. The estate's registrar/DNS path for `csoai.org` / `www.csoai.org` is owner-gated, and the live DNS gap is
already recorded (see the credential and DNS state document). The `io.github.*` route instead needs **GitHub device
authorisation**, which is interactive.

**The one command the owner is left with, once the TXT record is up:**

```bash
mcp-publisher login dns --domain "csoai.org" --private-key "${PRIVATE_KEY}"
mcp-publisher publish
```

**Not done.** No DNS record was created, no login was performed, no server was published.

---

## 2–8. The seven that need a human

**2. AWS Agent Registry.** It is **not a public directory**: it is a private, per-organisation catalogue inside an AWS
account, and an entry needs an account, an IAM identity and an approval. The premise in the work plan that it is a
free, rolling, public directory is wrong. *No URL was independently re-opened in this pass — the public search tool was
failing — so no URL is cited here rather than a guessed one.*

**3. AAIF project proposals.** Requires a GitHub login and an authenticated pull request against the proposals
repository.

**4. Agentic SOC Alliance.** A partner form, not a directory. Separately: **CSOAI is not a security vendor**, and the
alliance's membership criteria assume one. Whether CSOAI qualifies at all is an owner judgement, and the record does
not assert that it does.

**5. CDF AI SIG.** Two steps, not one: a pull request against the SIG repository **and** a join of the CDF Slack/TOC
channels. The second step is a human joining a workspace.

**6. Smithery.** `PUT /servers/{qualifiedName}/releases` with an API key carrying the **`servers:write`** scope, and a
namespace to publish under. Docs: `https://smithery.ai/docs` (**200**, verified). The API key is a credential the agent
must not mint.

**7. Claude Connector Directory.** Requires a **paid** plan on Anthropic's side. Docs entry point:
`https://docs.anthropic.com/en/docs/claude-code` (**200**, verified).

**8. OpenAI / Codex.** Requires **business verification**. Two concrete blockers beyond the account, both measured in
this repository:

- **There is no `distribution/` directory in this repository.** The only plugin package present is `plugins/gspc/`, and
  its `plugin.json` carries **no `$schema`** and **no `extensions.com.openai`** block — the two things the OpenAI
  submission path expects to read.
- **The name form is a live choice.** An `io.github.*` name requires GitHub device authorisation; the DNS/HTTP auth
  route maps to a **reverse-DNS** name.

Docs entry point: `https://platform.openai.com/docs` (**200**, verified).

---

## A licence defect found on the way

**The npm package and the plugin manifest declare a licence the repository does not have.**

| Where | Declared |
|---|---|
| `plugins/gspc/plugin.json` → `license` | **Apache-2.0** |
| npm `csoai-gspc-mcp@0.2.4` (published 2026-10-28) | **Apache-2.0** |
| this repository's `LICENSE` | **MIT** |

And the **published npm tarball contains no LICENSE file at all**, so a consumer installing it receives neither the
MIT terms nor the Apache-2.0 terms it was advertised under.

**This was NOT changed.** A licence declaration is the owner's statement, not an agent's, and MIT and Apache-2.0 are
different grants. It is recorded here as a defect with the exact three locations.

---

## What this means for the plan

The plan's "all rolling, all free, all agent-doable" line is **withdrawn for seven of eight targets**. The honest
form is: **one directory can be published once a DNS TXT record exists** (and the DNS path is owner-gated); the other
seven are **account openings**, which are owner work with no agent shortcut.

---

**Measurement, never a certification.** This record says which URLs answered, what each target requires, and what was
not done. It does not claim any listing exists, and no listing was created.
