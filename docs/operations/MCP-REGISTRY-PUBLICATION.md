# MCP registry publication and readback

The manual GitHub Actions publisher reads the generated
`distribution/mcp-registry/io.github.CSOAI-ORG-gspc/server.json`.
Its GitHub OIDC identity is for `io.github.CSOAI-ORG/gspc`. The
`ai.councilof/gspc` and `ai.councilof/gspc-free` domain names require the
existing domain-ownership flow; they are not aliases this job may publish.

## Check without credentials or publication

From the repository root:

```sh
SERVER_JSON=distribution/mcp-registry/io.github.CSOAI-ORG-gspc/server.json \
VER=1.4.4 EXPECTED_NAME=io.github.CSOAI-ORG/gspc \
node scripts/mcp-registry-publish.cjs --check
```

Use the version actually present in the reviewed manifest. Exit 0 means the
exact version's active publisher metadata matches; `is_latest` separately
reports whether the registry considers it latest. Exit 2 means that exact
name/version is absent. Exit 1 means mismatch, inactive/uncheckable state,
invalid input or failed transport. A 404 is the only absence response.
The check performs GET only and needs no token.

The comparison ignores only registry-owned annotations, not publisher fields.
It does not prove runtime tool availability, paid delivery, buyer acceptance,
search ranking or listing in another registry.

## Change metadata through the existing source owner

Do not hand-edit generated manifests. Update the existing distribution source
and renderer, select a new reviewed version and run their parity gates.
A current local file and an older published file may share a version; that is
a conflict, not a successful publication. Historical registry versions are
not overwritten by this helper.

The 29 October 2026 inspection found source version 1.4.4 and a different live
1.4.4: descriptions, npm package references and publisher metadata differed.
This observation is dated, not a statement of continuing live state.

After the protected source/release process accepts the change, the existing
release owner may manually dispatch `mcp-registry-publish.yml` on master with
that exact version. No schedule or automatic publication is added.
The job validates the selected namespace/version before requesting a credential,
uses the official v0.1 endpoints and keeps credentials out of step outputs.

A publish POST must be followed by an independent exact-version GET with
matching metadata and active status. A successful POST followed by a failed
readback is **unconfirmed**. Inspect the exact record before retrying; a lost
response does not prove that publication failed.

## Verification and coordination

`node --test scripts/mcp-registry-publish.node-test.cjs` uses synthetic responses,
performs no network calls and makes no publication. For the original-source
negative control, export the parent script to a temporary file and set
`LEGACY_PUBLISHER` to that path before running the same suite.

This change owns the publisher and its checks only. PR #3210 owns generated
tool/manifests work; #3179 owns catalogue links; #3596 buyer navigation;
#3598 and #3599 authority/evidence handoffs; #3602 capsule retention;
#3603 public wording; #3604 growth/custody corrections. Their source files,
signed objects, frozen methods, payment rails and private runtime are unchanged.

API and namespace contracts were checked against the official
[registry API](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md),
[live OpenAPI](https://registry.modelcontextprotocol.io/openapi.yaml) and
[publisher commands](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/cli/commands.md).

## Release closeout — 30 October 2026

PR #3608 is merged as `0580fd0ddec80a0fcc3b783d2da22cffafa47334`. The master publisher check and deployment 41042619207 passed. Immediate and delayed apex/production-alias readbacks passed on 30 October. See [the dated checklist and next-week plan](REGISTRY-FRIDAY-CLOSEOUT-2026-10-30.md) for exact scope, evidence and remaining registry dependencies. This resolves the publisher repair's release status; it does not assert corrected external listings or paid fulfilment.

## Release closeout — 21 November 2026

Version 1.5.0 replaces the 1.4.4 records, whose text no longer matched the server: they listed 19 tools while the doors served 54.

- PR #4532 (merged 2026-11-20 04:28Z as `4abc10be30`) moved `mcp/gspc-server/server.json` and `MCP_HTTP_SERVER_VERSION` to 1.5.0. It rendered both registry manifests from the live counts, and the renderer now also renders `ai.councilof-gspc-free`. Every door answered `initialize` with 1.5.0 once deploy run 44677344430 finished at 05:22Z on 20 November.
- The release owner published both names on 2026-11-21 at 01:43Z. The commands were `mcp-publisher-official login http --domain councilof.ai` and `mcp-publisher-official publish`. The signing key stays on the Oracle host, never in this repository.
- Readback at 01:44Z (`GET /v0/servers?search=ai.councilof`):
  - `ai.councilof/gspc` 1.5.0 is latest and active, reading "54 tools (49 free, 5 x402-metered)…".
  - `ai.councilof/gspc-free` 1.5.0 is latest and active, reading "49 free read-only tools…".
  - Both 1.4.4 records stay active and are no longer latest. Registry versions cannot be edited.
- Still open: the OASF records need re-signing (`node scripts/harness-x/sign-oasf.mjs --token-file <pod caller token>`). `parity_live.py` does not read the free listing, because `published_channels` has no entry for it.

## Next release: registry texts without counts (owner ruling, 21 November 2026)

A published registry version cannot be edited, and its version string cannot be published twice. The 1.5.0 texts state counts and the gspc entry lists the tool names, so they stay true only until the next tool change. The owner ruled on 21 November ("Next version + entry"). The count-free texts start with the next gateway version, not with a release of their own. The period when the 1.4.4 texts were out of date gets an entry in the corrections ledger.

- The texts are in `scripts/harness-x/registry-text.mjs`. While `mcp/gspc-server/server.json` says 1.5.0, the renderer writes exactly the 1.5.0 entries the registry holds. Once the version moves, it writes texts that name kinds of tool, with no number and no tool list. The entries then point at tools/list instead. `functions/mcp/registry-count-free.test.ts` holds this.
- The next publish needs a new version. Move `mcp/gspc-server/server.json` and `MCP_HTTP_SERVER_VERSION` in `functions/mcp/[[path]].ts` together, then re-render. A publish of 1.5.0 is refused by the registry.
- Publish both names in the same hour as the deploy that serves the new version, and read them back. Then deprecate 1.5.0 on both, with a message that points to tools/list.
