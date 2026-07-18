# Publish pack — defoneos-sign-mcp (owner-run)

Everything below is **for you (or an operator) to run** — creating public repos, `npm publish`, and MCP-registry listing are outward-facing account actions, so they're deliberately left un-executed. Copy-paste in order. Prereqs: `gh auth status` green, `npm whoami` = the CSOAI-owning npm account, Node ≥18.

## 0 · Preflight (safe to run — read-only)
```bash
cd ~/clawd/defoneos-sign-mcp
node --check server.js && npm test            # expect 24 passed, 0 failed
grep -REn 'sk-[A-Za-z0-9]{20}|AIza[A-Za-z0-9]{20}|BEGIN (RSA |EC )?PRIVATE' . --exclude-dir=node_modules || echo "clean"
ls -a ~/.defoneos 2>/dev/null && echo "NOTE: ~/.defoneos/sign.key is your PRIVATE key — it lives OUTSIDE this repo; never commit it"
```
`.gitignore` (add before first push so a key can never leak):
```bash
printf 'node_modules/\n*.key\n.env\n.defoneos/\n' > .gitignore
```

## 1 · GitHub public repo (CSOAI-ORG)
```bash
git init -b main 2>/dev/null; git add .; git commit -m "defoneos-sign-mcp v1.0.0 — sovereign signing MCP (sign/verify/system_card/public_key)"
gh repo create CSOAI-ORG/defoneos-sign-mcp --public --source=. --remote=origin --push \
  --description "Sign any AI/scientific output into an offline-verifiable DEFONEOS Ed25519 artifact — the sovereign assurance layer on top. Verifies at defoneos.vercel.app/verify.html, no server."
gh repo edit CSOAI-ORG/defoneos-sign-mcp --add-topic mcp --add-topic ed25519 --add-topic ai-governance --add-topic provenance --add-topic assurance --add-topic defoneos --add-topic csoai
```
(server.json already points repository.url at this slug — no edit needed.)

## 2 · npm publish
```bash
npm whoami                                    # must be the account that owns/【scope】
npm publish --access public                   # name: defoneos-sign-mcp (unscoped) — check it's free: npm view defoneos-sign-mcp
```
If the bare name is taken, scope it: set package.json name to `@csoai/defoneos-sign-mcp`, then `npm publish --access public`, and update server.json packages[0].identifier to match.
Smoke-test the published bin:
```bash
npx -y defoneos-sign-mcp </dev/null   # should print the "[defoneos-sign] up · key SOV:… " banner then exit on EOF
```

## 3 · MCP registry listing
```bash
# install once: https://github.com/modelcontextprotocol/registry (mcp-publisher)
mcp-publisher login github
mcp-publisher publish            # reads server.json in this dir
```
server.json is schema-valid (`io.csoai/defoneos-sign`, npm package `defoneos-sign-mcp`, stdio). After publish, any MCP host can one-tap install it.

## 4 · Post-publish wiring (optional, high value)
- Add an **install badge/link** on `defoneos.vercel.app` (badges.html / index.html): "Add the signing MCP → `claude mcp add defoneos-sign …`" so the dome and the MCP cross-reference.
- Point `verify.html` copy at the MCP ("receipts also come from the DEFONEOS signing MCP") — the loop is one story.

## Rollback
```bash
npm unpublish defoneos-sign-mcp@1.0.0    # within 72h only (npm policy)
gh repo delete CSOAI-ORG/defoneos-sign-mcp --yes
```

## Honesty / safety notes
- The sovereign signing key (`~/.defoneos/sign.key`) is generated on first run and **must never be committed or published**. The public repo ships code only; each install mints its own key. If you want a *stable org identity* across machines, distribute that one key out-of-band (secure channel) — do not put it in git/npm.
- Publishing is public + largely irreversible (npm unpublish is 72h-limited). Review `npm pack --dry-run` file list before step 2.
