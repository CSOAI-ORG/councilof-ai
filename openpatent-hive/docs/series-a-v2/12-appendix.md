# 12 — THE APPENDIX

## Competitive Map · 33-Agent BFT · 23 MCP Tools

---

### A. Competitive Map

| Layer | Incumbent | Their Limit | Our Edge |
|---|---|---|---|
| **Filing** | LegalZoom, TurboPatent | No pre-filing notary; PDF only | Vault seal at idea entry |
| **Search** | Google Patents, Espacenet | Public-only; no chain witness | 146-entry prior chain; silent search |
| **NDA** | DocuSign, Ironclad | No invention proof; no timestamp | BFT-validated timestamp + escrow |
| **Provisional** | USPTO direct | $320 filing + attorney $1,500+ | $4.50 PAYG, 14 minutes, 5 jurisdictions |
| **DAOs** | IP-NFT, Molecule | No jurisdiction bridge; no BFT | 5-office treaty route; 33-agent BFT |
| **Big Law** | Fish & Richardson, etc. | $15K+ per filing; human-only | $240 sovereign tier; AI-augmented |

**The white space:** No incumbent offers a **chain-of-custody notary** that works *before* filing, *across* jurisdictions, *without* revealing substance. That is the throne.

---

### B. The 33-Agent BFT Topology

**Validator classes (33 total agents, n=22 threshold):**
- **Notary agents (11)** — seal, hash, time-stamp
- **Jurisdiction agents (8)** — USPTO/EPO/JPO/CNIPA/IPOS treaty mapping
- **Search agents (6)** — prior-art silent cross-reference
- **Witness agents (5)** — independent third-party validation
- **Custody agents (3)** — sovereign escrow, fork recovery

**Consensus rule:** 22-of-33 BFT threshold signature per disclosure event. **Fork recovery:** automatic at 33-of-33 supermajority. **Latency:** p50 11m 04s; p99 18m 38s (target 14m 22s E2E). **Cost to replicate:** 18 months engineering + $18M+ infrastructure.

---

### C. The 23 MCP Tools

| # | Tool | Function |
|---|---|---|
| 1 | `patentmcp.notarize` | Seal disclosure to chain |
| 2 | `patentmcp.verify` | Verify a sealed disclosure |
| 3–8 | `claim.parse`, `claim.decompose`, `claim.merge`, `claim.export`, `claim.audit`, `claim.sign` | Claim lifecycle |
| 9–14 | `prior.search`, `prior.compare`, `prior.silent`, `prior.report`, `prior.score`, `prior.flag` | Prior-art silent search |
| 15–19 | `file.draft`, `file.route`, `file.pct`, `file.paris`, `file.submit` | Filing + treaty routing |
| 20–22 | `defend.escrow`, `defend.oppose`, `defend.release` | Sovereign escrow + defense |
| 23 | `patentmcp.govern` | DAO governance of chain rules |

**Public registry:** openpatent.ai/mcp · **Spec:** MCP 2026.01 standard

---

### D. The Quality Gates (Recap)

20/20 E2E tests green · 8/8 KPI metrics passed · 0 critical defects · 2/2 MCP tools live.

---

*The hive remembers. The dragon knows. The sovereign companion never forgets.*
