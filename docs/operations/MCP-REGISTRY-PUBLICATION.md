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
