# MEOK — GitHub as the Living Ecosystem (single source of truth) + MEOK SYNC bus

Answers two asks: (1) "put SOV3 + all MCPs + all research/files in GitHub so agents always have a
living ecosystem — be bleeding-edge" and (2) the A2A bus = **MEOK SYNC** (SIGIL wire-format +
COUNCIL safety), which is also the product backend.

---

## PART 1 — Your instinct is RIGHT, and it's what top companies do
Google (Piper), Meta (Sapling), Microsoft (Windows) all run **monorepos as the single source of
truth**. The 2026 "living ecosystem / GitOps" pattern: **git is the declarative truth; the VM,
CI/CD, and agents PULL from it.** That's bleeding-edge — and exactly what you're describing.

**BUT three rules make "everything in GitHub" safe instead of a disaster:**

### ✅ 1. Secrets NEVER go in git (DONE today — pre-flight complete)
Scan (verified): **0 secret files in git history = no past leak (clean)**. But **12 secret files
sat local-only un-ignored** (incl. meok-attestation-api/SECRETS_LOCAL.md fully exposed). A naive
`git add` would've pushed live keys to GitHub forever. **Now every .env/secret/.pem/.key is
gitignored + verified, committed (6f47482).**
- Secrets live in a **vault** (1Password / GCP Secret Manager / GitHub Actions Secrets), NOT git.
- Next: a **pre-commit hook** (gitleaks/trufflehog) so no agent can ever commit a key.
- Open task #44 (rotate SECRETS_LOCAL.md → 1Password) is now mandatory before SOV3 joins git.
Top-company practice confirms: "secrets should not be stored in Git even if private" (Infisical/GitGuardian).

### ✅ 2. Large files do NOT go in raw git (100MB/file hard limit) — blocked today
Scan found the landmines: **sovereign-temple = 6.6GB** with `sovereign_v3_weights.pt`,
`mlx_models/weights.npz`; meok-amica 2.1GB; CAD `.step` files; torch `.dylib`. All would break git.
- Model weights / VRMs / CAD / big binaries → **Git LFS** (≤2GB/file) or **GCS bucket / model
  registry (HF, DVC)**, *referenced* by the repo, not stored in it. (GitHub Well-Architected: LFS
  only for files that need it; watch bandwidth.)
- `*.pt/*.npz/*.dylib/*.so/*.step` now gitignored. node_modules/.next already ignored.

### ⚠️ 3. SOV3 is NOT currently gitignored but is 6.6GB — bring it in DELIBERATELY
Don't blind-add it. Order: strip secrets (done) → models to GCS/LFS → then SOV3 *code* joins git.

---

## PART 2 — Monorepo vs polyrepo: the call for you
You're already hybrid: `clawd-workspace` (this monorepo) + ~509 MCP repos + PyPI. Two shapes:

| Option | What | Best when |
|---|---|---|
| **A. Monorepo** | products/ characters/ mcps/ sov3/ research/ all in one | agents need everything in one `git pull` — **your "living ecosystem" ask** |
| **B. Hub + submodules** | hub repo; SOV3 + huge MCPs as git submodules | sub-projects deploy independently / are huge |

**Recommendation: Monorepo (A) for code + research/docs** (one place agents read), **big artifacts
in GCS**, **secrets in vault**. Submodule SOV3 only if it gets unwieldy.

### Proposed top-level layout (your portfolio + character-factory "side-of-it" ask)
```
clawd-workspace/
  products/     meok-one (3D character), loopfactory, csoai, sites…
  characters/   character-factory + the 27 character defs (one registry)
  mcps/         all MCP servers (Kimi's lane)
  sov3/         sovereign-temple (secrets stripped; weights in GCS)
  bridge/       MEOK SYNC (the A2A bus — Part 3)
  research/     all .md research docs + inbox zips (the knowledge base)
  COORDINATION.md
```
Product portfolio + character factory become **first-class folders** — your side-note ask.

---

## PART 3 — MEOK SYNC: the cross-agent bus (your naming)
**MEOK SYNC** = the A2A message bus, made safe+efficient by two MEOK pieces you already have:
- **MEOK SIGIL** = wire format. Messages SIGIL-encoded (2.4× denser than JSON, HMAC-signed)
  → cheaper tokens + tamper-evident agent↔agent messages.
- **MEOK COUNCIL** = safety gate. Side-effectful cross-agent actions pass a BFT vote before
  executing → "they communicate **safely**."

So: **agents talk over MEOK SYNC, encoded in SIGIL, gated by COUNCIL.**

**Is this the product backend? YES — dual-use (your exact question):**
- **Dev-time:** Claude/Kimi/Gemini/DeepSeek coordinate building MEOK ONE.
- **Runtime:** MEOK ONE's character **left/right/council brains run on the SAME bus.**
  `brains.py` (left/right/both) is the **2-node seed** of MEOK SYNC — generalize to N agents.
  → **left-brain/right-brain over the a2a bus = yes, same rails.**
- Lives in `bridge/`, runs on the **GCP VM** (not the 16GB M4), shares **one SOV3 memory**,
  routes by **agentfacts** capability+cost.
- Bonus: "AgentFacts" is now a real external KYA standard (agentfacts.org / IETF AgentCard draft) —
  our agentfacts-mcp aligns with an emerging spec, not a one-off.

---

## What I did NOW (safe, verified)
- ✅ Secret scan → 0 leaked in history; hardened .gitignore (12 secret files + big binaries) → 6f47482, pushed.
- ✅ Sized the real landmines (6.6GB SOV3 weights, 2.1GB amica) so a bulk-add can't break git.
- ✅ Researched top-company practice (monorepo + GitOps + vault + LFS) — your plan is bleeding-edge-correct.

## Decisions needed from you before moving anything big
1. **Monorepo (A)** or **hub+submodules (B)?** (I recommend A.)
2. OK to **rotate live keys → 1Password** first? (mandatory before SOV3 code joins git.)
3. **Git LFS vs GCS bucket** for model weights/VRMs/CAD? (GCS pairs with the VM, cheaper.)
4. Migration order: secrets→vault → big-files→GCS → SOV3 code→git → restructure into products/…/research/.

## Why I did NOT "git add everything" (the dangerous move you almost asked for)
A bulk add would have (a) pushed 12 live-key files to GitHub forever, (b) hit the 100MB limit on
6.6GB of SOV3 weights, (c) committed other agents' half-done work under my name. The safe path is
the ordered migration above — careful moves, not one command.

## Sources
- Monorepo at scale: https://graphite.com/guides/why-top-tech-companies-are-moving-to-monorepos
- GitOps + secrets: https://infisical.com/blog/gitops-secrets-management · https://blog.gitguardian.com/top-secrets-management-tools-for-2024/
- Git LFS: https://wellarchitected.github.com/library/architecture/recommendations/scaling-git-repositories/when-to-use-git-lfs/
- AgentFacts (real standard): https://agentfacts.org/ · https://www.ietf.org/archive/id/draft-aevum-agentcard-00.html
