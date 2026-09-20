# MCP Registry — DNS Namespace Verification & Migration Evidence

Retrieval date: **2026-09-20**. Primary sources only: official docs site
(`modelcontextprotocol.io/registry/*`) and the official registry repo
(`github.com/modelcontextprotocol/registry`, `main` branch, tree SHA `d1dcaf3fb36338d45ccdba98b5b8aea915e7d50d`).

---

## 1. DNS-based namespace ownership verification (e.g. `ai.councilof/*`, `com.councilof/*`)

**Source:** https://modelcontextprotocol.io/registry/authentication
(repo source: https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/authentication.mdx)

**Exact TXT record format (Ed25519 path, official generation command):**

> ```
> echo "${MY_DOMAIN}. IN TXT \"v=MCPv1; k=ed25519; p=${PUBLIC_KEY}\""
> ```
> where `PUBLIC_KEY="$(openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)"`
> (key generated with `openssl genpkey -algorithm Ed25519 -out key.pem`).

**Which DNS name the record goes on — the apex, explicitly NOT a selector:**

> "The TXT record must be placed on the **apex** of your domain (e.g. `example.com`), **not** under a selector like `_mcp-auth.example.com` or `_mcp-registry.example.com`. MCP DNS auth follows SPF-style placement (apex), not DKIM-style (selector). If you put the record under a selector, the registry will not see it and authentication will fail with a generic signature error."

**Value format:** `v=MCPv1; k=ed25519; p=<base64 public key>` (Ed25519) or
`v=MCPv1; k=ecdsap384; p=<base64 compressed public key>` (ECDSA P-384). Cloud signing
via Google KMS (Ed25519) and Azure Key Vault (ECDSA P-384) is also documented with the
same record format.

**Login command:**

> `mcp-publisher login dns --domain "${MY_DOMAIN}" --private-key "${PRIVATE_KEY}"`
> (Ed25519 private key as 64-char hex; ECDSA P-384 requires `--algorithm ecdsap384` —
> per https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/cli/commands.md)

**Namespace granted** (CLI commands reference, same file):

> "Verifies domain ownership via DNS TXT record — Grants access to `com.example.*` namespaces"

So for `councilof.ai`, a TXT record on the apex `councilof.ai` grants the reverse-DNS
namespace `ai.councilof/*`. (Note: primary docs phrase the grant as `com.example.*`
without explicitly stating subdomain coverage; subdomain-namespace scope is **UNVERIFIED**
from primary docs.)

---

## 2. Documented "namespace migration" route (moving a listing between namespaces/orgs)

**No such route is documented in any primary source.** Exhaustive reading of the
publisher-facing primary docs (authentication.mdx, quickstart.mdx, versioning.mdx,
faq.mdx, official-registry-requirements.md, cli/commands.md, api/CHANGELOG.md,
design/roadmap.md) finds no rename/transfer/migration operation for a server listing.
What exists instead:

**Source:** https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/versioning.mdx

> "The version string **MUST** be unique for each publication of the server. Once published, the version string (and other metadata) cannot be changed."

**Source:** https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/faq.mdx

> "### How do I update my server metadata?
> Submit a new `server.json` with a unique version string. Once published, version metadata is immutable (similar to npm)."

> "### Can I delete/unpublish my server?
> Yes, you can change your server's status to `deleted` using the `mcp-publisher status` command … **Note**: Server metadata is never permanently removed from the registry. The `deleted` status hides the server from discovery but preserves the historical record."

The CLI surface has only `init`, `login`, `logout`, `publish`, `status`, `validate`
(commands.md; quickstart `--help` transcript) — no rename/move/migrate command.

**The only occurrence of the word "migration" in a namespace-adjacent context** is in
the API changelog (`Unreleased` section,
https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/CHANGELOG.md):

> "`statusMessage` - Optional message explaining status change (e.g., deprecation reason, migration guidance)"

That is a free-text message field on the status endpoint — publishers can *write*
migration guidance into a deprecation notice. It is not a migration mechanism, and it
is in the **Unreleased** section as of retrieval date.

**Related primary evidence that names are identity:** the 2025-09-16 changelog entry
notes consistent server identification was introduced partly because "Each server
version had a unique ID, preventing version history tracking **and server renaming**"
— i.e., renaming was still not enabled even after that change; endpoints were later
restructured to key on `{serverName}` (2025-09-29 changelog), making the name the
primary identifier. No subsequent entry adds a rename operation.

**Verdict for this item: UNVERIFIED → effectively absent.** Primary documentation does
not establish any namespace migration route; the documented path is publish-under-new-name
plus `status deleted/deprecated` on the old name.

---

## 3. GitHub-based namespace (`io.github.CSOAI-ORG/*`) vs DNS-based namespace

**Source:** https://modelcontextprotocol.io/registry/authentication (authentication.mdx)

> "Which authentication method you choose determines the namespace of your server's name.
> If you choose GitHub-based authentication, your server's name in `server.json` **MUST** be of the form `io.github.username/*` (or `io.github.orgname/*`).
> If you choose domain-based authentication, your server's name in `server.json` **MUST** be of the form `com.example.*/*`, where `com.example` is the reverse-DNS form of your domain name."

| Authentication | Name Format | Example |
|---|---|---|
| GitHub-based | `io.github.username/*` or `io.github.orgname/*` | `io.github.alice/weather-server` |
| domain-based | `com.example.*/*` | `io.modelcontextprotocol/everything` |

**Org namespace ownership rule (directly relevant to `io.github.CSOAI-ORG/*`):**

> "To publish under an **organization** namespace (`io.github.<orgname>/*`), you must be an **Owner** of that organization. Ordinary org membership is no longer sufficient: the registry checks your membership role and only grants the org namespace to admins."

> "GitHub authentication always grants your personal namespace, `io.github.<your-username>/*`."

PAT requirements for org publishing: classic PAT needs `read:org`; fine-grained PAT needs
**Organization permissions → Members → Read-only**. "Either way the token needs **no**
repository scopes — the registry never reads or writes your code."

Domain namespaces are proven by DNS TXT (apex, §1) or HTTP `/.well-known/mcp-registry-auth`
with identical `v=MCPv1; k=…; p=…` content. Namespace scope per auth method is enforced on
every publish ("You do not have permission to publish this server" — quickstart
troubleshooting table).

---

## 4. Current publishing flow version as of September 2026

**Registry status:** still preview.

> "The MCP Registry is currently in preview. Breaking changes or data resets may occur before general availability."
> — banner on all docs pages (authentication.mdx, quickstart.mdx, versioning.mdx, faq.mdx)

**API versions** (https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/CHANGELOG.md, entry 2025-10-17; roadmap notes v0.1 freeze on 2025-10-24):

> "Introduced `/v0.1/` as a stable API version while `/v0/` continues as the development version. … Both versions will be maintained until a future v1.0 release"

Quickstart verifies publication with:
> `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.my-username/weather"`

**server.json schema version** (quickstart.mdx and versioning.mdx):
> `"$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json"`

**CLI:** `mcp-publisher` (Go binary from `modelcontextprotocol/registry` releases; install
via `brew install mcp-publisher` or release tarball). Commands: `init`, `login`, `logout`,
`publish`, `status`, `validate` (commands.md). Flow: add ownership marker to package
(`mcpName` in package.json for npm) → publish package → `mcp-publisher init` →
`mcp-publisher login <github|github-oidc|dns|http>` → bump unique `version` →
`mcp-publisher publish`. Published versions are immutable; updates = new version string.

---

## Verdict

**Claim: "MCP Registry supports a DNS namespace migration route." → NO.**

Primary documentation (as retrieved 2026-09-20) contains no namespace migration, rename, or
transfer route — DNS-based or otherwise. Deciding quotes:

1. "Once published, the version string (and other metadata) cannot be changed."
   (versioning.mdx)
2. "Submit a new `server.json` with a unique version string. Once published, version
   metadata is immutable (similar to npm)." (faq.mdx)
3. The only "migration" string in primary docs is an unreleased free-text
   `statusMessage` field ("e.g., deprecation reason, migration guidance" — API CHANGELOG,
   Unreleased), which is a deprecation notice, not a migration mechanism.
4. The documented de-listing path is status-only: "Server metadata is never permanently
   removed from the registry." (faq.mdx)

What DNS verification *does* support: claiming a reverse-DNS namespace (`ai.councilof/*`)
via an apex TXT record `v=MCPv1; k=ed25519; p=<base64 pubkey>` and publishing *new* names
under it. Moving an existing listing (e.g. from `io.github.CSOAI-ORG/*` to
`ai.councilof/*`) would be, per the docs, a fresh publish under the new name plus
`mcp-publisher status --status deleted/deprecated` on the old one — not a migration.
