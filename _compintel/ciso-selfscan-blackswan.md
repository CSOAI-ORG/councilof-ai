# CISO "Gods-Eye Self-Scan" — Open-Source Security + AI-Governance Stack, Sovereign-Orchestrated

_Compiled 2026-07-02. Purpose: a CISO / SMB / enterprise can self-run these FOSS tools to test their own security and AI systems; a Sovereign AI orchestrates them, signs every finding to a ledger, and helps remediate. Includes a recommended 12-tool bundle + a "black-swan" open-source certification/pricing model that undercuts Vanta/Drata/ISACA/IAPP._

> **License legend:** 🟢 permissive (MIT/Apache/BSD — safe to embed/commercialize) · 🟡 GPL/GPLv2 (copyleft — safe to *run/orchestrate* via CLI/API; do NOT statically link into closed code) · 🔴 AGPL (network copyleft — if you expose it as a hosted service you must offer source; run as separate process behind an API seam, never link) · ⚠️ source-available / non-OSS (read terms before commercial resale).

---

## 1. Category-by-category: the leading FOSS tool(s)

### Network / attack-surface recon
| Tool | License | What it does | Orchestration / API |
|---|---|---|---|
| **Nmap** | 🟡 NPSL (GPLv2-derived, extra terms — treat as copyleft) | Host discovery, port/service/version scan, OS fingerprint, NSE script engine | CLI + **`-oX` XML** / **libnmap**/`python-nmap`; NSE scripts scriptable. Run as subprocess, parse XML → ledger |
| **masscan** | 🟡 AGPL-3.0 (with exceptions) | Internet-scale async TCP port scan (millions of IPs) | CLI, `-oJ` JSON output; run for wide sweep then hand ports to Nmap for depth |
| **OWASP Amass** | 🟢 Apache-2.0 | Passive+active subdomain/asset discovery, DNS enum, ASN mapping — attack-surface graph | CLI + JSON output; local graph DB queryable; good "external footprint" step |
| **theHarvester** | 🟡 GPL-2.0 | OSINT: emails, subdomains, hosts, employee names from public sources | CLI, JSON/XML export |
| **Shodan (free tier)** | ⚠️ proprietary SaaS (free API key, limited credits) | Internet-exposure lookup of your own IPs/banners/known CVEs | REST API + `shodan` python lib. Free tier fine for small footprint; not FOSS — use as optional enrichment |

**Sovereign role:** scope your own ASN/domains → Amass+theHarvester (passive) → masscan (wide) → Nmap (deep) → normalized asset inventory signed to ledger. Shodan optional enrichment for "what the internet already sees."

### Vulnerability scanning
| Tool | License | What it does | Orchestration |
|---|---|---|---|
| **OpenVAS / Greenbone Community** | 🟡 GPL-2.0 | Full network vuln scanner, ~100k+ NVTs, authenticated + unauth checks | **GMP protocol** (Greenbone Mgmt Protocol) over socket; `python-gvm` lib. Heaviest but most complete |
| **Nuclei** (ProjectDiscovery) | 🟢 MIT | Fast template-based scanner (YAML templates for CVEs, misconfigs, exposures); 9k+ community templates | CLI, JSON/JSONL output, `-as` auto-scan; trivially scriptable. Best for CI + continuous re-scan |
| **Trivy** (Aqua) | 🟢 Apache-2.0 | All-in-one: container image, filesystem, IaC, K8s, SBOM + CVE scan | CLI, JSON/SARIF/CycloneDX; server mode API |
| **Grype** (Anchore) | 🟢 Apache-2.0 | Vuln scan of images/filesystems from an SBOM (pairs with Syft) | CLI, JSON/SARIF; DB updatable offline |

**Note:** Nuclei is the orchestration-friendly workhorse (permissive, JSON, fast). OpenVAS is the depth play but GPL + heavy.

### Web-app DAST
| Tool | License | What it does | Orchestration |
|---|---|---|---|
| **OWASP ZAP** (now "ZAP" under Software Security Project / Checkmarx-sponsored) | 🟢 Apache-2.0 | Full DAST: spider, active/passive scan, fuzzing, auth handling | **Full REST API + daemon mode (`-daemon`)**, `zap-cli`, Docker "automation framework" YAML. The most automatable DAST |
| **Nikto** | 🟡 GPL-2.0 | Fast web-server scanner: outdated servers, dangerous files, default configs | CLI, `-Format json`; quick first-pass before ZAP depth |

### SAST / code
| Tool | License | What it does | Orchestration |
|---|---|---|---|
| **Semgrep (OSS/Community)** | 🟢 LGPL-2.1 (CLI/engine); rules mostly permissive; Semgrep **Pro/AppSec Platform is proprietary** | Fast pattern-based static analysis, many languages, custom rules | CLI, `--json`/`--sarif`; `semgrep ci`. OSS engine is enough for self-scan |
| **CodeQL** (GitHub) | ⚠️ **NOT open source** — free ONLY for research + open-source analysis; commercial/private-repo use needs GitHub Advanced Security (paid) | Deep semantic dataflow queries; finds complex injection/taint bugs | CLI + query packs; SARIF out. **License-gated for private/commercial — flag this to the CISO** |
| **Bandit** (PyCQA) | 🟢 Apache-2.0 | Python-specific SAST (common insecure patterns) | CLI, `-f json`; drop into CI |

**Recommendation:** lead with **Semgrep OSS** (broad, permissive-enough) + **Bandit** for Python. Treat CodeQL as opt-in only where the org already has GHAS.

### SBOM / supply chain
| Tool | License | What it does | Orchestration |
|---|---|---|---|
| **Syft** (Anchore) | 🟢 Apache-2.0 | Generate SBOM (CycloneDX/SPDX) from images/filesystems | CLI, JSON; pairs with Grype |
| **Trivy** | 🟢 Apache-2.0 | SBOM gen + vuln + license + secret scan in one | CLI/API |
| **OSV-Scanner** (Google) | 🟢 Apache-2.0 | Match dependencies against OSV.dev vuln DB; lockfile-aware | CLI, JSON/SARIF |
| **Dependency-Track** (OWASP) | 🟢 Apache-2.0 | Continuous SBOM *platform* — ingest CycloneDX, track components over time, VEX, policy | **Full REST API**; the natural "SBOM system of record" to feed the ledger |

**Pattern:** Syft → CycloneDX SBOM → upload to Dependency-Track (API) for continuous monitoring; OSV-Scanner/Grype for point-in-time CI gate.

### Secrets scanning
| Tool | License | What it does | Orchestration |
|---|---|---|---|
| **Gitleaks** | 🟢 MIT | Fast regex/entropy secret detection in git history + files | CLI, `--report-format json/sarif`; pre-commit + CI |
| **TruffleHog v3** (Truffle Security) | 🔴 **AGPL-3.0** | Secret detection **with live credential verification** (800+ detectors) | CLI, `--json`; **AGPL → run as isolated subprocess/API, never link into closed product** |

**Copyleft flag:** TruffleHog v3 is AGPL. Fine to *run and orchestrate*; if you resell a hosted scanning service built around it you trip the AGPL network clause. Gitleaks (MIT) is the safe-to-embed default; TruffleHog for its verification superpower behind a process boundary.

### Cloud posture (CSPM)
| Tool | License | What it does | Orchestration |
|---|---|---|---|
| **Prowler** | 🟢 Apache-2.0 | AWS/Azure/GCP/K8s posture + CIS/NIST/PCI/HIPAA checks (500+ AWS checks) | CLI, JSON/OCSF/HTML; `prowler dashboard`; SDK-driven. Best FOSS CSPM |
| **ScoutSuite** (NCC Group) | 🟢 GPL-2.0 | Multi-cloud config audit → HTML report + raw JSON | CLI, JSON export |
| **Steampipe** (Turbot) | 🔴 **AGPL-3.0** (core) | Query cloud/SaaS as SQL (`select … from aws_…`); CIS "mods" | SQL over Postgres FDW; **AGPL — isolate**. CloudQuery is the ⚠️ source-available (MPL/ELv2 mix) alternative |

**Recommendation:** **Prowler** (Apache, multi-cloud, compliance mappings baked in) is the orchestration primary. Steampipe/CloudQuery for ad-hoc SQL posture queries but mind AGPL/source-available terms.

### SIEM / detection
| Tool | License | What it does | Orchestration |
|---|---|---|---|
| **Wazuh** | 🟡 GPL-2.0 | Full XDR/SIEM: agents, FIM, log analysis, MITRE ATT&CK mapping, active response | **REST API** + agents; the FOSS SIEM backbone |
| **Security Onion** | 🟡 GPL (distro of many tools) | Turnkey detection distro bundling Suricata+Zeek+Elastic+more | Appliance/VM; APIs of components |
| **Suricata** | 🟡 GPL-2.0 | High-speed IDS/IPS/NSM, rule-based (ET rules), protocol + file extraction | EVE JSON output → SIEM; Unix socket API |
| **Zeek** (formerly Bro) | 🟢 BSD-3-Clause | Network-traffic analysis framework → rich connection logs | Scriptable; JSON logs → SIEM |

**Pattern:** Suricata (signatures) + Zeek (behavior) → Wazuh/Elastic for correlation + alerting; Sovereign consumes alerts, correlates with self-scan findings.

### Compliance-as-code
| Tool | License | What it does | Orchestration |
|---|---|---|---|
| **OpenSCAP / SCAP Security Guide** | 🟡 GPL-2.0+ | Host hardening audit vs CIS/STIG/PCI SCAP profiles; auto-remediation | `oscap` CLI, XCCDF/ARF XML + HTML; Ansible remediation output |
| **OSCAL** (NIST) | 🟢 public-domain / CC0 spec (tooling e.g. `oscal-cli`, `compliance-trestle` Apache-2.0) | Machine-readable control catalogs, SSPs, assessment results (JSON/XML/YAML) | The **lingua franca** to serialize all findings into an auditable, signable control model |
| **Cloud Custodian** (c7n, CNCF) | 🟢 Apache-2.0 | YAML policy-as-code to detect + auto-remediate cloud drift | CLI + Lambda mode; run in guardrail loop |
| **Comply** (strongdm, archived) | 🟢 Apache-2.0 | SOC 2 policy templates + ticket-driven evidence (legacy) | Largely superseded — prefer OSCAL + Comp AI (trycomp.ai, OSS) |

**Recommendation:** normalize *everything* into **OSCAL** (it's the neutral, signable format), use **OpenSCAP** for host hardening evidence and **Cloud Custodian** for cloud guardrail remediation.

### AI / LLM red-team + governance
| Tool | License | What it does | Orchestration |
|---|---|---|---|
| **NVIDIA Garak** | 🟢 Apache-2.0 | Model-layer LLM vuln scanner: prompt injection, jailbreak, toxicity, data leakage, hallucination probes | CLI, JSON report; point at any model endpoint |
| **Microsoft PyRIT** | 🟢 MIT | Red-team *framework*: multi-turn attack chains, adversarial dataset gen, scoring/orchestration | Python SDK — the programmable attack orchestrator |
| **promptfoo** | 🟢 MIT | App-layer eval + red-team in CI/CD; maps to OWASP LLM Top 10; graded assertions | YAML config + CLI + JSON; best for continuous CI gating |
| **Giskard** | 🟢 Apache-2.0 | LLM + classic-ML quality/security scan (bias, robustness, injection); test suites | Python lib + JSON; ML + LLM in one |
| **OWASP LLM Top 10** | 🟢 doc/framework (CC) | The taxonomy (prompt injection, insecure output, poisoning, etc.) to map findings against | Reference map, not a tool |
| **MITRE ATLAS** | 🟢 framework (open) | Adversarial-ML ATT&CK-style TTP matrix | Reference map; tag findings with ATLAS technique IDs |

**Pattern:** Garak (model probes) + promptfoo (app-layer CI evals) + PyRIT (novel multi-turn chains) + Giskard (bias/robustness). Map every finding to **OWASP LLM Top 10** + **MITRE ATLAS** IDs so AI findings sit in the same governance ledger as classic security findings.

---

## 2. The "Gods-Eye Self-Scan" bundle — recommended 12 tools + pipeline

All permissive-first where possible; copyleft tools (🟡/🔴) run as **isolated subprocesses behind an API seam** so nothing links into the Sovereign's own code (protects a commercial offering). Every stage emits normalized JSON → mapped to **OSCAL** assessment-results → **Ed25519-signed to an append-only ledger** (prev-hash chained), so each finding is offline-verifiable and tamper-evident.

**The 12:**
1. **Amass** 🟢 — external attack-surface / asset discovery
2. **Nmap** 🟡 — port/service/version depth (+ masscan optional for wide sweep)
3. **Nuclei** 🟢 — fast template vuln + exposure scan (continuous)
4. **OWASP ZAP** 🟢 — web-app DAST (daemon/API mode)
5. **Semgrep OSS** 🟢 — SAST across the codebase (+ Bandit for Python)
6. **Syft** 🟢 — SBOM generation (CycloneDX)
7. **Grype** 🟢 (+ **OSV-Scanner**) — SBOM/dependency vuln match; **Dependency-Track** as the SBOM system-of-record
8. **Gitleaks** 🟢 — secrets scan (TruffleHog 🔴 optional, isolated, for live verification)
9. **Prowler** 🟢 — multi-cloud CSPM (CIS/NIST/PCI mappings)
10. **Wazuh** 🟡 — SIEM/XDR + host FIM + MITRE ATT&CK (runtime detection backbone)
11. **OpenSCAP** 🟡 — host hardening vs CIS/STIG + Ansible remediation
12. **Garak + promptfoo** 🟢 — AI/LLM red-team (model + app layer), mapped to OWASP LLM Top 10 + MITRE ATLAS

**Pipeline (recon → vuln → web → code → SBOM → cloud → AI-redteam → report), all signed:**

```
[0] Scope & consent  → signed scope authorization (targets you own) → ledger
      │
[1] RECON        Amass + Nmap (+ masscan)      → asset inventory
[2] VULN         Nuclei + Grype                → network/host CVEs
[3] WEB          OWASP ZAP + Nikto             → DAST findings
[4] CODE         Semgrep OSS + Bandit          → SAST findings
[5] SBOM         Syft → Dependency-Track;
                 OSV-Scanner gate              → supply-chain risk
[6] SECRETS      Gitleaks (+ TruffleHog verify)→ leaked creds
[7] CLOUD        Prowler + OpenSCAP + Cloud
                 Custodian (guardrail)         → posture + drift
[8] RUNTIME      Wazuh / Suricata / Zeek       → live detections
[9] AI RED-TEAM  Garak + promptfoo + PyRIT +
                 Giskard                       → LLM/ML risks
      │
[10] NORMALIZE   every finding → OSCAL assessment-results
                 + OWASP/MITRE (ATT&CK+ATLAS) tags + CVSS/severity
[11] SIGN        Ed25519 sign each finding, prev-hash chained → append-only ledger
                 (WebCrypto verifiable on-device, offline)
[12] REPORT      CISO dashboard + auto-generated OSCAL SSP/POA&M;
                 Sovereign proposes fixes (Ansible/Cloud Custodian/PRs),
                 BFT-council gate before any auto-remediation touches prod
      │
[13] REMEDIATE   Sovereign opens PRs / Ansible playbooks / c7n policies;
                 re-scan closes the loop → signed "fixed" attestation
```

**Why signing matters (the moat):** competitors produce PDFs you have to trust. This bundle produces an **offline-verifiable, tamper-evident chain of every scan, finding, and fix** — the same signed-substrate play as the rest of the estate. A regulator or customer can independently verify "this control was tested, here's the evidence, here's who signed it" without trusting the vendor. That's the JSP-936 / assurance-gap wedge applied to self-scanning.

**Deployment note:** ship as a Docker-Compose / Helm "self-scan appliance" the CISO runs *inside their own perimeter* (data never leaves). The Sovereign orchestrates via each tool's CLI/API, never exfiltrates raw findings — only signed attestations if the customer opts to publish to a verify page.

---

## 3. How AI-governance / compliance is sold today (2026)

**Compliance-automation SaaS (Vanta / Drata):**
- **Vanta:** no public list price; ~**$10–12k/yr** entry (startup, single framework), **$25–55k** mid-market, **$50–110k+** enterprise/multi-framework. Add-ons priced separately (Vendor Risk ~$5–15k, extra frameworks ~$5k each, pen-test coordination). ([soc2auditors.org](https://soc2auditors.org/insights/vanta-pricing/), [datavirtualizer.com](https://datavirtualizer.com/content/vanta-vs-drata-soc2-compliance-automation-pricing/))
- **Drata:** 3 tiers from **~$7.5k/yr**, **$10–25k onboarding**, framework add-ons, renewals rising **10–50%**. ([complyjet.com](https://www.complyjet.com/blog/drata-pricing-plans))
- Plus the **actual audit** by an independent firm: **$10–50k**. All-in first-year commonly **$30–65k** for a startup program. ([soc2auditors.org](https://soc2auditors.org/insights/soc-2-software-pricing-comparison/))

**Individual certifications (ISACA / IAPP):**
- **IAPP AIGP** (AI Governance Professional): exam **$649 member / $799 non-member**; total path **$900–$3,500** w/ training; 2-yr term, 20 CPE credits + maintenance fee. IAPP membership ~$275/yr. ([iapp.org](https://iapp.org/certify/aigp), [store.iapp.org](https://store.iapp.org/fees))
- **ISACA AAISM** (AI audit/security mgmt): exam **~$459 member / $599 non-member** + ~$50 app fee; 10 CPE/yr; requires active CISM/CISSP. ([infosectrain.com](https://www.infosectrain.com/blog/isaca-aaism-vs-iapp-aigp-which-is-better-for-you-in-2026))
- **ISACA CISM:** exam **$575 member / $760 non-member**; annual maintenance **$45/$85**. ([destcert.com](https://destcert.com/resources/cism-cost/), [support.isaca.org](https://support.isaca.org/s/article/What-are-all-of-the-possible-costs-associated-with-becoming-CISA-CISM-CGEIT-CRISC-certified-1597877239642))

**The pattern being exploited:** (1) opaque, quote-only, land-and-expand SaaS pricing with per-framework and add-on nickel-and-diming; (2) certifications gated behind exam fees + mandatory membership + recurring CPE/maintenance rent; (3) the evidence you pay for is trust-me PDFs, not independently verifiable.

---

## 4. The BLACK-SWAN pricing model (open-source + free training + subscription + PAYG)

Design principle: **the tools, the training, and the certification *knowledge* are free and open; you monetize verified signing, managed orchestration, and the cert *credential*, at 3–30× under incumbents — and route value back to SMBs/enterprise.**

- **🟢 FREE FOREVER — the self-scan kit + training + cert curriculum are OSS.** Ship the 12-tool "Gods-Eye" bundle as a self-hostable appliance (Apache-2.0 orchestration layer; copyleft tools isolated behind the API seam) and give away the entire AI-governance training + exam-prep curriculum (OWASP LLM Top 10, MITRE ATLAS, OSCAL, EU AI Act / DORA / NIS2 mapped). Kill IAPP/ISACA's $649–$799 exam + membership + CPE rent — training that costs them thousands is $0 here. Distribution + goodwill flywheel, and it's honest: knowledge should be free.

- **💷 SUBSCRIPTION — "Signed Assurance," flat and transparent, published on the page.** One SMB tier at **~£99/mo** (vs Vanta/Drata's opaque $7.5–12k/yr *entry*): continuous orchestrated scans + OSCAL SSP/POA&M auto-generation + the Ed25519-signed, offline-verifiable ledger + a public verify badge. Enterprise/Defence tier **£10–30k/yr** (still under Vanta enterprise) adds multi-tenant, BFT-council remediation gates, air-gapped/sovereign deploy, and the signed System Card that closes the JSP-936 vendor-assurance gap. **No per-framework add-on tax** — every framework (SOC2/ISO/AI Act/DORA) is mapped once via OSCAL and included.

- **⚡ PAYG — pay only for verified signatures + heavy compute, metered.** Free/OSS to self-run unlimited scans on your own hardware; you pay per **signed attestation minted to the ledger** and per premium action (deep LLM red-team GPU runs, third-party-verifiable System Card issuance, published verify-page attestations). Micro-priced (x402-style metered), so a 5-person startup pays cents and a bank pays for volume — value scales with *proof issued*, not seats or frameworks.

- **🎓 CERTIFICATION — free to learn, low flat fee for the verifiable credential, no CPE rent.** Sit the AI-governance cert exam for **free**; if you pass, mint an **Ed25519-signed, blockchain-anchored, offline-verifiable credential** for a **one-time ~£49–99** (vs $649+ recurring). Credential is a signed artifact anyone can verify without contacting an issuer — no annual maintenance fee, no membership lock-in. Undercuts AIGP/AAISM ~10× and produces a *better* (verifiable) credential.

- **🔄 VALUE BACK TO SMB/ENTERPRISE — co-op economics + the moat is the seam, not the tools.** Because the tools are FOSS and self-hosted, **the customer's data never leaves their perimeter** (privacy + sovereignty, unlike SaaS scanners that ingest your infra). Findings and remediations feed a **signed cross-org hive** so SMBs get enterprise-grade threat intel and remediation playbooks they could never afford alone — a security co-op. Contribute a verified fix template → earn credit against PAYG/subscription. The defensible asset isn't the (freely available) scanners; it's the **signed substrate + verifiable-credential trust network + orchestration seam** — exactly the estate's existing moat, pointed at CISO self-scanning.

---

## Sources
- [Vanta pricing — soc2auditors.org](https://soc2auditors.org/insights/vanta-pricing/) · [SOC 2 software pricing comparison](https://soc2auditors.org/insights/soc-2-software-pricing-comparison/) · [Vanta vs Drata pricing](https://datavirtualizer.com/content/vanta-vs-drata-soc2-compliance-automation-pricing/) · [Drata pricing — complyjet](https://www.complyjet.com/blog/drata-pricing-plans)
- [IAPP AIGP](https://iapp.org/certify/aigp) · [IAPP fees](https://store.iapp.org/fees) · [ISACA AAISM vs AIGP — infosectrain](https://www.infosectrain.com/blog/isaca-aaism-vs-iapp-aigp-which-is-better-for-you-in-2026) · [CISM cost — destcert](https://destcert.com/resources/cism-cost/) · [ISACA cert cost](https://support.isaca.org/s/article/What-are-all-of-the-possible-costs-associated-with-becoming-CISA-CISM-CGEIT-CRISC-certified-1597877239642)
- Licenses: [Semgrep licensing](https://semgrep.dev/docs/licensing) · [TruffleHog LICENSE (AGPL-3.0)](https://github.com/trufflesecurity/trufflehog/blob/main/LICENSE) · [Nmap NPSL](https://nmap.org/npsl/) · [OpenVAS/Grokipedia](https://grokipedia.com/page/OpenVAS) · [AI red-team tools & licenses — netguardia](https://netguardia.com/security-operations/software-tools/the-best-ai-red-teaming-tools-of-2026-from-garak-to-promptfoo/) · [promptfoo vs garak](https://www.promptfoo.dev/blog/promptfoo-vs-garak/)
- Frameworks: OWASP LLM Top 10, MITRE ATLAS, NIST OSCAL (public specs)
