# CSOAI end-to-end handover and execution blueprint

**Checked:** 21 September 2026, Europe/London  
**Purpose:** a factual operating handover for the next release and evidence cycle. It separates what is publicly served from local, reviewable work and from blocked work. It does not treat a local commit, a crawler notification, an outgoing email, a directory listing, or a queue count as customer use, revenue, signing, anchoring, or certification.

## Operating rule

Use one release chain for every public change:

`measured input → focused source change → local validation → clean release candidate → authorised publisher → anonymous served readback → dated receipt`

A result is **LIVE** only after the final readback. GSPC remains measurement, not certification.

## 1. Current reality

| State | Surface or artifact | Verified fact | Evidence / readback |
|---|---|---|---|
| **LIVE** | Council of AI core | `https://councilof.ai/api/gspc` returned HTTP 200 during this handover check and parsed to 23 axes. `https://councilof.ai/mcp` and `/.well-known/agent-card.json` also returned HTTP 200. | Live HTTP check on 21 September; API response was 70,527 bytes. |
| **LIVE** | New public GitHub identity | `https://github.com/CouncilofAI-CSOAI` is the public account. Four browser-published commits are live: profile README `646417250b868d514f263a54f598df6bcd253c86`, profile `PUBLIC_ENDPOINTS.json` `fecbe6cca6b91733adfa1d403438369ab47554d3`, evidence README `90a8d6657e72d123bb23179944284b81d3cc648f`, and evidence `PUBLIC_ENDPOINTS.json` `42379b88ce4d386c79b04c4b7bab0879ff4c2ec2`. | Anonymous raw readback returned HTTP 200 and exact bytes for all four files at 17:43:08Z. [Publication readback](/Users/nicholas/clawd/_alignment/CSOAI_PUBLIC_GITHUB_READBACK_2026-09-21.json) |
| **LIVE** | Pinned SAFE discussion note | The note is public and version-pinned on Hugging Face at commit `c6021da678f886bf3c4eeb74a8b096661a03dfc0`; SHA-256 is `2a61e0457b1637ccef5be67aaa652669715ce974df6427512e9a0899f8c074e4`. It is explicitly unsigned. | [SAFE/public-core receipt](/Users/nicholas/clawd/_alignment/CSOAI_PUBLIC_CORE_PUBLISH_AND_SAFE_EMAIL_RECEIPT_2026-09-21.md) |
| **LOCAL READY (UNSENT)** | SAFE RFC follow-up | A recipient-ready local draft exists for Mike Woster, copied to Candy Tan and Stephano Cetola. Recipient audit corrected the local draft; its SHA-256 is `9ff8074770778bc9f0ed0fa87b1e5e173c619e57a0be624a495d95bab18a3fa3`. A fresh current Sent-thread check found no subsequent CSOAI follow-up. | [Local draft](/Users/nicholas/clawd/_alignment/drafts/SAFE_RFC_FOLLOWUP_TO_MIKE_2026-09-21.md). It must remain unsent until the thread is checked immediately before sending and Nicholas gives explicit send confirmation. |
| **LIVE (notification only)** | IndexNow | The existing seven-URL batch reached Yandex, which replied `{"success":true}`. | [IndexNow receipt](/Users/nicholas/clawd/_alignment/INDEXNOW_RECEIPT_2026-09-21.md); this does not prove indexing, rank, traffic, or use. |
| **LOCAL READY** | Public-release base | A frozen release bundle exists at `/Users/nicholas/clawd/_alignment/councilof-ai-public-release-20260921.bundle`, SHA-256 `dcee777728adcff16d43ce0a8ecf8ac3d4f054b7593b7b538df280790219fdb1`. Its reviewed base includes `a75dfac11` and `1378d76a7`. | 95 focused tests, sitemap truth guard, client build and whitespace check were recorded for that reviewed base. |
| **LOCAL READY** | Public release corrections | Four local-only patches are prepared: `a42a5d6a020e7e1afc7d1f5b33936fdf6076b3a5` corrects feed/MCP discovery; `cbe0bc971758afa12640c704d34d572e32c5a564` corrects generic public GitHub links; `61cce41583cbc5ff44ea367aea98e2de3652525a` aligns discovery copy to 13 tools = 9 free + 4 metered and uses a valid zero-payer example; `365a2a31392526b5b4742a0b2689d2c569e32fb9` retires the unavailable offline-receipt verifier claim. | All four are local only: not pushed and not deployed. The footer patch’s 3 focused tests and the feed patch’s static contract/whitespace checks passed; no full runtime MCP-suite result is claimed. |
| **LOCAL READY** | Public release readback | `/Users/nicholas/clawd/_alignment/tools/csoai_public_release_readback.py` is an unauthenticated, read-only public-surface checker that writes a local receipt only. | Latest receipt, [18:22:50Z](/Users/nicholas/clawd/_alignment/runtime/public-release-readback/latest.json), found six actual served defects. It does not publish, sign, anchor, pay, deploy, or establish traffic or use. |
| **LOCAL AUTOMATIC** | Mill status recorder | Commit `7e2d5646a1061f671d95fbc0cb5bf2ff27f7ea39` on `codex/mill-local-receipt-20260921` replaces the failing hourly GitHub dispatch with a local receipt recorder. | At 18:00:02Z, the hourly cron created `20260921T180002Z-e5ac45ff1c85e268140e2f9382928087326ed3498716005e3cfdebfff0dd7cd0.json`; its full SHA-256 matches its filename. It records 2,377 signed and 1,620 unsigned queue entries, `UNAVAILABLE_GITHUB_DISPATCH`, `NOT_ISSUED`, and `LOCAL_ONLY`. This proves scheduled local receipt generation only. |
| **LIVE** | Reciprocal GitHub documentation | The reciprocal README and endpoint updates are included in the four browser-published commits above. | [Anonymous byte readback](/Users/nicholas/clawd/_alignment/CSOAI_PUBLIC_GITHUB_READBACK_2026-09-21.json) confirms all four public files. Earlier local prep commits are historical references only. |
| **LOCAL STAGED** | Frameworks-drum bundle | `/Users/nicholas/clawd/_evacuation/runpod-bundles/20260921-frameworks-drum/` contains 825 files, 2,436,434 bytes, with `MANIFEST.sha256`. | This larger bundle remains local staging; it is distinct from the curated RunPod handoff below. |
| **REMOTE VERIFIED** | Curated RunPod handoff | A curated copy from `/Users/nicholas/clawd/_alignment/runpod-handoffs/2026-09-21` is stored at `/workspace/mac-evac-20260912/csoai-handoffs/2026-09-21/2026-09-21`. | Remote `sha256sum -c SHA256SUMS` passed all 12 listed content files plus `SHA256SUMS` and `README`; receipt output was `REMOTE_BUNDLE_OK` at 684K. Local originals remain. No full dirty worktree, credentials, or caches were copied. |
| **BLOCKED** | Production deployment | The reviewed release requires an authorised clean publisher, preregistered credentials, prerendering, and readback. The available direct publisher is unsafe because it can deploy dirty/non-master bytes while labelling them `master`. | [Public release handoff](/Users/nicholas/clawd/_alignment/CSOAI_PUBLIC_RELEASE_HANDOFF_2026-09-21.md) |
| **BLOCKED (legacy); LIVE (audit-only)** | Watchdog / RunPod control path | The legacy five-minute watchdog remains scheduled and fails: it continues attempting RunPod SSH and legacy GitHub authentication, and its `harnesses_alive` typo invalidates the intended liveness condition. | A parallel audit-only LaunchAgent is installed and bootstrapped: `/Users/nicholas/Library/LaunchAgents/ai.csoai.watchdog-audit.plist`, label `ai.csoai.watchdog-audit`, `RunAtLoad` plus `StartInterval` 300. Script SHA-256: `3381a62aef995d6745353d90fe8703de078ac4a3f52a2913872f502ed31b45eb`. Its 17:59:51Z receipt reported public endpoints OK, RunPod control-plane runtime `RUNNING`, and every mutation field `not attempted` / `not used`; `launchctl` reported 2 runs and last exit 0. This is a parallel safe audit scheduler only, not a repair of the legacy cron line. [Watchdog handover](/Users/nicholas/clawd/_alignment/CSOAI_WATCHDOG_AUDIT_HANDOVER_2026-09-21.md) |

## 2. Source-of-truth map

| Purpose | Canonical surface | Do not confuse it with |
|---|---|---|
| Current public GSPC board | `https://councilof.ai/api/gspc` | A local card queue, a mirror, or a static screenshot. |
| Public service and agent discovery | `https://councilof.ai/mcp` and `https://councilof.ai/.well-known/agent-card.json` | The human MCP catalogue, which remains part of the unserved release candidate. |
| Public continuity identity | `https://github.com/CouncilofAI-CSOAI` | A source-code or deployment authority. |
| Public evidence continuity mirror | `https://github.com/CouncilofAI-CSOAI/csoai-public-evidence` | The exact deployed Councilof.ai source. |
| RFC discussion artifact | The pinned Hugging Face SAFE note | An accepted working-group contribution or signed statement. |
| Local signing-queue observation | `/Users/nicholas/clawd/_alignment/runtime/mill-signing-status/` | A signature, witness, anchor, publication, or customer outcome. |
| Local release escrow | `/Users/nicholas/clawd/_alignment/councilof-ai-public-release-20260921.bundle` | A deployed production release. |

## 3. Release packages and their gates

### A. Public discovery and catalogue release

The reviewed base release fixes the human/protocol split:

- `/mcp` stays the Streamable HTTP protocol endpoint.
- `/mcps/` and `/mcps/:slug` become the human discovery catalogue.
- Catalogue count derives from the 292 rows rather than a hard-coded “291+” claim.
- Machine-readable discovery documents are added to the generated sitemap.
- Sitemap validation rejects URLs that robots would block.

**Current condition:** the frozen bundle is reviewable, but the latest unauthenticated served-output readback at 18:22:50Z found six live defects:

1. MCP discovery metadata retains stale human-facing count wording.
2. `https://councilof.ai/api/feed.xml` self-identifies as the non-canonical `/feed.xml`.
3. Public HTML retains generic `github.com/CSOAI-ORG` references.
4. The x402 discovery document retains an unavailable legacy source reference.
5. The x402 discovery document contains a non-copyable Unicode-ellipsis payer placeholder.
6. The sitemap omits one or more expected discovery endpoints: `.well-known/mcp.json`, `.well-known/mcp/server-card.json`, and `.well-known/x402.json`.

The currently active worktree has later commits and seven uncommitted large data changes; it is no longer the same clean release candidate. Do not deploy it as though it were the frozen bundle.

**Release gate:** reconstruct a clean checkout at the frozen reviewed base, decide which later patches belong, run the recorded build and sitemap checks, complete prerendering, then use one authorised publisher and run `csoai_public_release_readback.py` against production. A result is not released as repaired until the new anonymous receipt resolves the six relevant defects and the normal two-minute readback remains consistent.

### B. Public GitHub identity release

The two current public repositories are deliberately small: a public profile and an evidence continuity mirror. They are not a replacement source repository, and neither should run automation.

**Security already applied:** `main` deletion and force-push protections are active; GitHub Actions are disabled in both repositories. No legacy GitHub credential was copied to the new account.

**Publication status:** the four browser commits are already public and were confirmed through anonymous raw byte readback. The earlier local prep commits are historical reference only. Future content changes still require exact text review, a browser publication step, and a new anonymous readback; do not create or reuse a broad OAuth/PAT token merely to push them.

### C. Signing and evidence release

The local recorder gives an honest queue observation. Its latest receipt records:

- unsigned queue: 1,620 files;
- signed queue: 2,377 files;
- dispatch: unavailable;
- signing: not issued;
- publication: local only.

The next signing rail must be a separately reviewed operation that takes a selected, immutable input set and produces a verifiable output receipt. It must not quietly convert the existing local queue count into a public claim.

### D. RunPod storage

A curated handoff copy from `/Users/nicholas/clawd/_alignment/runpod-handoffs/2026-09-21` is remotely stored at `/workspace/mac-evac-20260912/csoai-handoffs/2026-09-21/2026-09-21`. Remote `sha256sum -c SHA256SUMS` passed all 12 listed content files plus the manifest and README, with `REMOTE_BUNDLE_OK` at 684K. Local originals remain.

This establishes a verified curated off-Mac handoff. It does not claim that the full dirty worktree, credentials, caches, or the separate 825-file frameworks-drum staging bundle were copied. Those remain separate retention and transfer decisions.

## 4. Automation state

| Loop | Actual status | Required repair / evidence |
|---|---|---|
| Hourly `permissionless-fire-mill.sh` | The new executable path creates a local status receipt rather than failing at the old GitHub call. Cron generated a fresh receipt at 18:00:02Z: `20260921T180002Z-e5ac45ff1c85e268140e2f9382928087326ed3498716005e3cfdebfff0dd7cd0.json`, whose full SHA-256 matches its filename. | It records 2,377 signed / 1,620 unsigned queue entries and states dispatch unavailable, signature not issued, publication local only. This proves automatic local receipt generation, not signing, anchoring, publication, or worker processing. |
| Legacy five-minute `watchdog_asi_v2.py` | The unsafe legacy cron line remains scheduled and continues its SSH/GitHub attempts. Separately, the audit-only LaunchAgent `ai.csoai.watchdog-audit` is installed, bootstrapped, and has two successful runs. | The LaunchAgent's fresh 17:59:51Z receipt is evidence only: public endpoints OK, RunPod control-plane runtime `RUNNING`, mutations not attempted/not used. The legacy line still needs a controlled retirement; do not describe it as repaired. [Watchdog handover](/Users/nicholas/clawd/_alignment/CSOAI_WATCHDOG_AUDIT_HANDOVER_2026-09-21.md) |
| One-minute standing cycle and fifteen-minute mirror fanout | Scheduled entries exist in local crontab, but no fresh output receipt was reviewed in this handover. | Locate each exact output path, confirm a fresh timestamp and bounded result, or mark it failed. Never infer activity from a cron line. |
| RunPod worker | Not verified reachable through the current control path. | Record a new authenticated, read-only health probe before any attempt to restart, resize, or alter the pod. |

## 5. Next 10 actions, in dependency order

1. **Freeze the current facts.** Keep this handover, the frozen bundle, local receipts, and the three focused source branches intact. Do not clean, reset, or merge the large dirty worktree.
2. **Choose the account boundary.** The new GitHub account is a user account, not an organisation. Owner decides whether it remains that way; separately verify `nicholas@csoai.org`, email privacy, recovery, and 2FA.
3. **Preserve the GitHub publication receipt.** The four browser commits are already live and have anonymous byte proof in [CSOAI_PUBLIC_GITHUB_READBACK_2026-09-21.json](/Users/nicholas/clawd/_alignment/CSOAI_PUBLIC_GITHUB_READBACK_2026-09-21.json). Do not republish the historical local prep commits. Any later change starts a new reviewed publication/readback cycle.
4. **Make a clean release source.** Start from the frozen bundle / reviewed base rather than the current dirty distribution worktree. Triage the seven later file changes one by one and retain only changes that have a written evidence purpose.
5. **Re-run release validation in the clean source.** Select the four local-only public-release patches deliberately, then run the client build, sitemap truth guard, focused MCP/catalogue tests, and whitespace check. Obtain a working prerender environment for `/mcps/` routes.
6. **Resolve the publishing authority.** Owner chooses one reviewed Cloudflare publisher with exact credentials, target project, bindings, and an audit log. Retire the unsafe dirty direct-publisher path from the release process without deleting historical material.
7. **Deploy one reviewed release only.** After the source, validation, publisher and owner authorisation gates are satisfied, deploy the chosen candidate. Then run the unauthenticated `csoai_public_release_readback.py` tool and inspect its local receipt against the six known defects, followed by the normal two-minute anonymous readback of `/mcps/`, one catalogue record, `/mcp`, `/robots.txt`, `/sitemap.xml`, the three `.well-known` documents, and `/dashboard/?tab=distribution`.
8. **Retire the legacy watchdog through a controlled scheduler change.** The parallel audit-only LaunchAgent is installed and healthy, but the old SSH/GitHub cron line remains active. Resolve the `crontab <file>` write failure, read back the exact resulting crontab after retiring only that legacy line, and retain the LaunchAgent receipt. Do not describe the legacy watchdog as repaired until its unsafe line is demonstrably absent.
9. **Verify scheduled receipts.** Check the next hourly mill receipt and one fresh output from each standing/mirror cycle. Record missing receipts as failures; do not repair by inventing an activity claim.
10. **Maintain the verified off-Mac handoff.** Add only reviewed, curated material to the existing RunPod handoff, update `SHA256SUMS`, and repeat remote verification after each transfer. Keep local originals; consider any cleanup only under a retention list and never as a substitute for a verified full-estate backup.

## 6. Ownership and no-go boundaries

### Owner-only decisions

- public content publication, deployment, directory submission, and external messaging;
- business-email verification, 2FA, recovery, account structure, and any token/credential creation;
- Cloudflare publisher credentials, target bindings, and production release approval;
- signing keys, witness/anchor services, wallets, payment rails, pricing, or new SKUs;
- deletion, history rewriting, or archival of old repositories and worktrees.

### Safe operator work before those decisions

- read-only public checks;
- isolated source patches with focused validation;
- local receipt generation that labels its state honestly;
- release-bundle and manifest integrity checks;
- bounded audit of public links, sitemap, feed, agent card, and API responses.

### Explicit no-go list

- Do not deploy from `council-direct-publisher-20260920` or any dirty checkout.
- Do not use Vercel for CSOAI / Councilof.ai.
- Do not copy the legacy GitHub CLI credential to the new account or grant broad OAuth scopes.
- Do not relabel historical source URLs or MCP registry IDs as the new profile without a durable replacement.
- Do not call local signed-queue files or GitHub web-flow signatures CSOAI signing, independent witnessing, Bitcoin anchoring, certification, or market adoption.
- Do not send more RFC/standards follow-ups unless there is a concrete recipient, verified new content, and a complete reviewed body.

## 7. Exact verification commands and public URLs

These commands are read-only or local integrity checks. Run them from a clean terminal; save their output alongside the date.

```bash
# Unauthenticated served-output audit. It writes a local receipt only.
python3 /Users/nicholas/clawd/_alignment/tools/csoai_public_release_readback.py
cat /Users/nicholas/clawd/_alignment/runtime/public-release-readback/latest.json

# Current public core
python3 - <<'PY'
import json, urllib.request
for url in (
    'https://councilof.ai/api/gspc',
    'https://councilof.ai/mcp',
    'https://councilof.ai/.well-known/agent-card.json',
):
    with urllib.request.urlopen(url, timeout=20) as response:
        body = response.read()
        print(url, response.status, len(body))
        if url.endswith('/api/gspc'):
            print('axes=', len(json.loads(body)['axes']))
PY

# Published GitHub continuity files, pinned to the verified browser commits
curl -fsSL https://raw.githubusercontent.com/CouncilofAI-CSOAI/CouncilofAI-CSOAI/646417250b868d514f263a54f598df6bcd253c86/README.md | shasum -a 256
curl -fsSL https://raw.githubusercontent.com/CouncilofAI-CSOAI/CouncilofAI-CSOAI/fecbe6cca6b91733adfa1d403438369ab47554d3/PUBLIC_ENDPOINTS.json | shasum -a 256
curl -fsSL https://raw.githubusercontent.com/CouncilofAI-CSOAI/csoai-public-evidence/90a8d6657e72d123bb23179944284b81d3cc648f/README.md | shasum -a 256
curl -fsSL https://raw.githubusercontent.com/CouncilofAI-CSOAI/csoai-public-evidence/42379b88ce4d386c79b04c4b7bab0879ff4c2ec2/PUBLIC_ENDPOINTS.json | shasum -a 256

# Frozen release and local mill-receipt integrity
shasum -a 256 /Users/nicholas/clawd/_alignment/councilof-ai-public-release-20260921.bundle
shasum -a 256 /Users/nicholas/clawd/_alignment/runtime/mill-signing-status/20260921T180002Z-e5ac45ff1c85e268140e2f9382928087326ed3498716005e3cfdebfff0dd7cd0.json

# Parallel audit-only watchdog LaunchAgent state and immutable script bytes
launchctl print gui/$(id -u)/ai.csoai.watchdog-audit
shasum -a 256 /Users/nicholas/.local/bin/csoai-watchdog-audit

# Separate local framework-bundle integrity
cd /Users/nicholas/clawd/_evacuation/runpod-bundles/20260921-frameworks-drum
shasum -a 256 -c MANIFEST.sha256

# On the established RunPod SSH session: verified curated-handoff integrity
cd /workspace/mac-evac-20260912/csoai-handoffs/2026-09-21/2026-09-21
sha256sum -c SHA256SUMS

# Focused local branch integrity
for worktree in \
  /Users/nicholas/clawd/wt-footer-public-source-mirror-20260921 \
  /Users/nicholas/clawd/wt-feed-mcp-public-pointer-20260921 \
  /Users/nicholas/clawd/wt-mill-local-receipt-20260921; do
  git -C "$worktree" status --short --branch
  git -C "$worktree" show -s --format='%H %s' HEAD
done
```

Public readback targets after a correctly authorised release:

- `https://councilof.ai/mcps/`
- `https://councilof.ai/mcps/a2a-governance-bridge-mcp`
- `https://councilof.ai/mcp`
- `https://councilof.ai/robots.txt`
- `https://councilof.ai/sitemap.xml`
- `https://councilof.ai/.well-known/mcp.json`
- `https://councilof.ai/.well-known/mcp/server-card.json`
- `https://councilof.ai/.well-known/x402.json`
- `https://councilof.ai/dashboard/?tab=distribution`

## 8. Handover condition

The business has a working public core, a clear public identity with four anonymously verified public GitHub files, a pinned SAFE discussion note, a recipient-ready unsent RFC follow-up draft, a frozen release base, four local-only public-release corrections, a read-only served-output audit identifying six live defects, a verified curated off-Mac RunPod handoff, and a running parallel audit-only watchdog LaunchAgent. It does **not** yet have a safe completed production release, a verified full-estate backup, a repaired legacy watchdog, an active signing/anchoring pipeline, an RFC follow-up send confirmation, resolution of the six served defects, or proof of independent adoption or repeat payment. The dependency order above is the shortest truthful route to those outcomes.
