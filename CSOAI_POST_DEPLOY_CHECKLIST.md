# POST-DEPLOY CHECKLIST — owner fires after `vercel --prod`

> **Run after the 1-owner-move (`bash scripts/ship-everything.sh` + Vercel deploy).**
> Each step verifiable by web-inspect. ~5 minutes.

## A. Distribution (per channel)

### A1. PyPI (277 Python packages)
```bash
# Pick 5 random flagship packages and verify they're live on PyPI
for pkg in cobol-bridge-mcp iso20022-bridge-mcp hl7-fhir-bridge-mcp miCA-crypto-mcp solvency-ii-mcp; do
  pip download --no-deps --dest /tmp/$pkg-test "$pkg" 2>&1 | head -3
done
# Expected: 5 successful downloads
```
- [ ] 5/5 packages downloadable from PyPI
- [ ] Each shows version + license correctly
- [ ] No 404 in PyPI JSON: `curl -s https://pypi.org/pypi/cobol-bridge-mcp/json | jq .info.version`

### A2. npm (33 TypeScript packages — only after the OPTIONAL publish-all-ts-mcps.sh step)
```bash
# If NPM_TOKEN was set:
npm view @csoai-org/oscal-generator-mcp
# Expected: returns version + license
```
- [ ] npm registry returned a version (if npm was set)
- [ ] OR: skip — npm is optional; PyPI is the primary

### A3. MCP official registry (479 server.json entries)
```bash
# Pick 3 random server.json and verify they're on registry.modelcontextprotocol.io
for slug in cobol-bridge-mcp x402-flow oscal-generator-mcp; do
  curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=$slug" | jq '.servers[0]'
done
# Expected: 3 server entries
```
- [ ] 3/3 resolvable
- [ ] `packages[0].registryType` is `pypi` for each
- [ ] Each has `name` starting with `io.github.CSOAI-ORG/`

### A4. Vercel / csoai.org (141 HTML surfaces)
```bash
# Hit csoai.org and verify 200 + the A+++++ branding is there
curl -s -o /dev/null -w "%{http_code}\n" https://csoai.org/
# Expected: 200

curl -s https://csoai.org/csoai-os/oscal-verifier.html | grep -c "100/100 A+++++"
# Expected: at least 3 occurrences

curl -s https://csoai.org/csoai-os/catapult.html | grep -c "Book a 30-min pilot call"
# Expected: at least 1 (the CTA)

curl -s https://csoai.org/csoai-os/ | head -50 | grep -c "A+++++"
# Expected: at least 5
```
- [ ] csoai.org returns 200
- [ ] 141 surfaces land at `https://csoai.org/csoai-os/<file>.html`
- [ ] A+++++ appears on every surface (sample 5 random ones)
- [ ] Catapult CTA returns the "Book a 30-min pilot call" mailto

### A5. Smithery + Glama auto-crawl
```bash
# Smithery discovers our npm + GitHub via its MCP registry.
# This is automatic — they crawl within 24-72 hours of PyPI publish.
# Check status:
curl -s https://smithery.ai/search?q=CSOAI 2>&1 | head -20
# OR: search.smithery.ai for "cobol-bridge-mcp"
```
- [ ] Within 24-72h, Smithery lists cobol-bridge-mcp (and others)
- [ ] Within 24-72h, Glama lists cobol-bridge-mcp (and others)

## B. Live demo infrastructure

### B1. OSCAL proof verifies in-browser
```bash
# Open csoai.org/csoai-os/oscal-verifier.html?demo=1
# Expected: auto-loads the OSCAL JSON + sig, shows 554 components, status flips green
# Manual verify: Open DevTools Network tab → no requests after page load (100% offline)
```
- [ ] Demo mode auto-loads
- [ ] Status shows "100/100 A+++++ · structurally valid"
- [ ] Network panel: zero requests since page-load

### B2. Council View vote simulation
```bash
# Open csoai.org/csoai-os/council-view.html
# Click "▶ Run live vote"
# Expected: 8 stages animate in <2s, ending in "✓ committed"
```
- [ ] 36 nodes initially
- [ ] Vote completes in <3 seconds
- [ ] Final line: "✓ committed — decision signed Ed25519"

### B3. SIGIL Stream
```bash
# Open csoai.org/csoai-os/sigil-stream.html
# Click "▶ Start"
# Expected: SIGIL events stream at 1-3/second
```
- [ ] Stream begins on click
- [ ] Each event is Ed25519-signed (sha visible)
- [ ] Count increments every ~600-1200ms

## C. Answer-engine discovery layer

### C1. 5 upstream PRs
```bash
python3 /Users/nicholas/clawd/_m4/_upstream_pr_tracker.py
# Expected: 5 PRs listed (PR #1, #20, #42, #45, #50)
```
- [ ] All 5 PRs resolve (not "NOT_FOUND")
- [ ] Initial state: 5 OPEN, 0 MERGED (T+0)

### C2. Profile README on GitHub
```bash
curl -s https://raw.githubusercontent.com/CSOAI-ORG/CSOAI-ORG/main/README.md | grep -c "100/100 A+++++"
# Expected: at least 3
```
- [ ] Profile README has A+++++

### C3. 32 branded repos
```bash
gh repo view CSOAI-ORG/cobol-bridge-mcp --json description,repositoryTopics --jq '{description, topics: .repositoryTopics[].name}'
# Expected: description contains "100/100 A+++++" and topics include a-100-100
```
- [ ] Sample 5 flagship repos: all have A+++++ positioning

## D. The promotion / outreach

### D1. The 3 design-partner emails
```bash
# Verify the email drafts are still in the bundle
ls ~/Desktop/CSOAI_MEOK_HANDOFF_2026-06-26/strategy/OUTREACH_EMAILS_2026-06-29.md
# Sent (Tue + Wed by owner): Monzo (Tue 10:00), Lloyds (Tue 14:00), Cera (Wed 10:00)
```
- [ ] Email 1 sent (Monzo)
- [ ] Email 2 sent (Lloyds)
- [ ] Email 3 sent (Cera)
- [ ] Reply to any inbound (book via Calendar)

### D2. The 3 demo videos
- [ ] cobol-bridge-demo.mp4 uploaded to csoai-os/assets/ (Tue EOD)
- [ ] bft-council-demo.mp4 uploaded (Tue EOD)
- [ ] oscal-verifier-demo.mp4 uploaded (Wed EOD)

### D3. The launch sequence
```bash
# This script is dry-run-verified:
python3 /Users/nicholas/clawd/sovereign-temple-live/LAUNCH_SEQUENCE_2026_07_04.py --dry-run
# Expected: 8/8 ✓ in 0.3s. Hermes' script.
```
- [ ] Dry-run: 8/8 ✓
- [ ] Armed for Sat 4 Jul 09:00 BST

## E. Launch-day pre-launch (Sat 04:00 BST)

- [ ] All 7 Layer-1 surfaces accessible at csoai.org/csoai-os/<>.html
- [ ] The OSCAL proof returns valid for demo verify
- [ ] The 3 demo videos are embedded + playing
- [ ] The 5 upstream PRs still tracked
- [ ] BFT council vote script is armed (LAUNCH_SEQUENCE is staged)
- [ ] Twitter / LinkedIn posts are staged + ready to fire

## License

MIT © 2026 MEOK AI Labs · CSOAI Ltd (UK 16939677)

— M4 (the engineering lane)
