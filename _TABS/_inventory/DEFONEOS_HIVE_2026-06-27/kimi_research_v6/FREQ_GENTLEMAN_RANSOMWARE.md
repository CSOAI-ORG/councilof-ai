# DEEP FREQUENCY: THE GENTLEMEN RANSOMWARE + GENTLEKILLER
## Comprehensive Threat Intelligence Report

**Classification:** TLP:CLEAR (Compiled from open sources)
**Date:** July 2026
**Author:** DEFONEOS Threat Intelligence Unit
**Distribution:** Internal Use / Executive Briefing

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [The Gentlemen Ransomware Group](#2-the-gentlemen-ransomware-group)
3. [GentleKiller: The EDR Killer Framework](#3-gentlekiller-the-edr-killer-framework)
4. [The "Gentle" Malware Family](#4-the-gentle-malware-family)
5. [Defense Against The Gentlemen/GentleKiller](#5-defense-against-the-gentlemengentlekiller)
6. [Broader Ransomware Ecosystem (2026)](#6-broader-ransomware-ecosystem-2026)
7. [AI-Enhanced Ransomware](#7-ai-enhanced-ransomware)
8. [Open-Source Tools for Defense](#8-open-source-tools-for-defense)
9. [Intelligence Sources](#9-intelligence-sources)
10. [Appendices](#10-appendices)

---

## 1. EXECUTIVE SUMMARY

### Key Findings

| Metric | Detail |
|--------|--------|
| **Threat Actor** | The Gentlemen Ransomware Group (Storm-2697 / Phantom Mantis / LARVA-368) |
| **Administrator** | Alexander Andreevich Yapaev, 36, Izhevsk, Russia (identified by KrebsOnSecurity, June 2026) |
| **Aliases** | hastalamuerte, zeta88, SantaMuerte, bu4vs, Alexandr 4apaev, nobody0 |
| **First Appearance** | Mid-2025 (samples on VT: July 17, 2025) |
| **RaaS Launch** | September 12, 2025 |
| **Business Model** | Ransomware-as-a-Service, 90/10 affiliate split |
| **Victim Count** | 478+ victims across 66+ countries (as of June 2026) |
| **Global Ranking** | #2 most active ransomware group in Q1 2026 |
| **Primary Tool** | GentleKiller (in-house EDR killer framework, 8+ variants) |
| **Primary CVE** | CVE-2024-55591 (FortiGate auth bypass, CVSS 9.6) |
| **Encryption** | X25519/Curve25519 + XChaCha20 per-file ephemeral keys |
| **Double Extortion** | Yes (encryption + data theft + leak site + social media pressure) |
| **CIS Targeting** | Explicitly PROHIBITED (Russian-speaking group norm) |
| **AI Usage** | CONFIRMED - AI coding assistants for panel/tool development |
| **Decryptor Available** | Partial - Bedrock Safeguard released free decryptor (patched same day by group) |

### Critical Assessment

The Gentlemen represent the **fastest-scaling RaaS operation on record**. Emerging from a Qilin payment dispute in July 2025, the group reached #2 globally within 9 months. Their distinguishing feature is **centralized EDR killing as a service** via the GentleKiller framework -- a capability most RaaS groups leave to affiliates. This lowers the barrier to entry for less-skilled affiliates while maintaining high operational effectiveness. The group also demonstrates exceptional technical agility, patching decryptors within hours and operationalizing new BYOVD proofs-of-concept within days.

### DEFONEOS Priority Rating: **CRITICAL**

---

## 2. THE GENTLEMEN RANSOMWARE GROUP

### 2.1 Timeline of Operations

| Date | Event |
|------|-------|
| **March 2025** | hastalamuerte operates as "ArmCorp" affiliate crew within Qilin RaaS |
| **July 17, 2025** | First Gentlemen sample uploaded to VirusTotal (SHA-256: 51b9f246...) |
| **July 22, 2025** | Public payment dispute with Qilin on RAMP forum ($48,000 unpaid) |
| **September 12, 2025** | Gentlemen RaaS formally advertised on underground forums as "Zeta88" |
| **October 2025** | ~48 victims claimed; partnership with BreachForums for affiliate recruitment |
| **January 2026** | ~48 attacks in single month (NCC Group data); rapid scaling begins |
| **February 2026** | ESET first identifies GentleKiller in incident response |
| **April 2026** | 320+ victims; ranked #2 most active RaaS; Bedrock Safeguard releases decryptor (patched same day) |
| **May 4, 2026** | Internal "Rocket" database leaked -- 16.22 GB of chats, IOCs, negotiations, operator identities |
| **May 10, 2026** | 352 claimed victims across 70+ countries |
| **May 14, 2026** | Check Point publishes "Thus Spoke...The Gentlemen" with full leak analysis |
| **May 28, 2026** | Microsoft publishes detailed technical analysis of the encryptor |
| **June 10, 2026** | Brian Krebs identifies administrator as Alexander Andreevich Yapaev |
| **June 11, 2026** | 478 claimed victims; The Hacker News confirms Krebs identification |
| **June 18, 2026** | ESET publishes "Killing me gently" -- full GentleKiller framework analysis |
| **June 25, 2026** | Securonix publishes consolidated threat intelligence report |

### 2.2 Threat Actor Profile

**Tracked As:**
- Microsoft: **Storm-2697**
- PRODAFT: **Phantom Mantis / LARVA-368**
- Group-IB: **The Gentlemen**
- Check Point: **The Gentlemen RaaS**
- Cybereason: **The Gentlemen**

**Administrator:**
- **Real Name:** Alexander Andreevich Yapaev (Russian: Алексанр Андреевич Япаев)
- **Age:** 36
- **Location:** Izhevsk, Republic of Udmurtia, Russia
- **Public Persona:** Head of B2B Marketing at Uralenergo Udmurtia (regional energy company)
- **Primary Aliases:** hastalamuerte, zeta88
- **Secondary Aliases:** SantaMuerte, bu4vs, Alexandr 4apaev, nobody0, santamuerte
- **GitHub:** SantaMuerte (associated with exploitation tools)
- **Phone:** +7-912-765-00-04 (linked via Constella Intelligence)
- **Telegram ID:** 30907522 (@hastalamuerte18)
- **ProtonMail:** Linked to Apple account and GitHub username "4apai18"
- **Forum History:** Active on Exploit, BreachForums, RaidForums, Nulled since 2019

**Attribution Methodology (Krebs Investigation):**
1. Intel 471 traced zeta88 forum registrations to IPs in Izhevsk
2. Epieos linked ProtonMail to Apple account and GitHub ("4apai18")
3. Constella Intelligence linked Telegram ID 30907522 to Russian phone +79127650004
4. Flashpoint independently validated the Telegram username/ID match
5. Public records tied phone + location to Alexander Andreevich Yapaev, born 1990
6. Corroborated by Check Point, Intel 471, PRODAFT

**Criminal Lineage:**
- Former affiliate of: **Qilin, Embargo, LockBit, Medusa, BlackLock**
- Led "ArmCorp" affiliate crew within Qilin (14 targets in ~1.5 months)
- The Gentlemen operators previously affiliated with at least 5 competing RaaS programs

### 2.3 Technical Signature

#### 2.3.1 Encryption Architecture

| Attribute | Detail |
|-----------|--------|
| **Language** | Go (obfuscated with Garble) |
| **Platforms** | Windows, Linux, NAS, BSD, VMware ESXi (dedicated C-based ESXi locker) |
| **Key Exchange** | X25519 (Curve25519 Diffie-Hellman) |
| **Stream Cipher** | XChaCha20 |
| **Key Management** | Per-file ephemeral Curve25519 keys -- unique key per file |
| **File Extension** | Hardcoded `.axfsmg`; 6-character random extension observed (e.g., `.umc16h`) |
| **Files < 1 MB** | Fully encrypted |
| **Files > 1 MB** | Three distributed chunks encrypted (0.3-3% of file) |
| **Execution Gate** | Hardcoded operator password required (e.g., `G7Vz9eyG`) -- NOT encryption key |
| **Speed Modes** | Multiple modes controlling encryption percentage |
| **Wipe Mode** | `--wipe` overwrites free space |
| **Spread Mode** | `--spread` activates worm-like self-propagation |

#### 2.3.2 Encryption Process (Per Microsoft)

1. Generates random 32-byte ephemeral private key
2. Computes ECDH shared secret between ephemeral private key + operator's embedded public key
3. Uses shared secret as XChaCha20 key, first 24 bytes of ephemeral public key as nonce
4. Encrypts file contents
5. Appends Base64-encoded ephemeral public key to file footer for decryption key reconstruction

#### 2.3.3 Ransom Note and Artifacts

| Artifact | Detail |
|----------|--------|
| **Ransom Note** | `README-GENTLEMEN.txt` |
| **Wallpaper** | `gentlemen.bmp` |
| **Group Marker** | `GENTLEMEN` string embedded in binary |
| **Leek Site** | Tor-based DLS |
| **Social Media** | Branded X/Twitter account for public pressure |

#### 2.3.4 Worm-Like Self-Propagation (Critical Feature)

When `--spread` is enabled, the ransomware attempts **~21 lateral movement techniques per host**:

1. **Hidden SMB shares** for payload distribution
2. **PsExec** (embedded or downloaded from Sysinternals)
3. **WMI** for remote process creation
4. **PowerShell Remoting** (Invoke-Command via WinRM)
5. **PowerShell WMI class interface**
6. **Scheduled tasks** (user + SYSTEM contexts: `DefU`, `UpdateGU`, `UpdateGU2`)
7. **Windows services** (SYSTEM: `DefSvc`, `UpdateSvc`, `UpdateSvc2`)
8. **AD computer enumeration** via LDAP queries
9. **Credential harvesting** from current session or stored credentials
10. **Enables SMB1**, loosens LSA restrictions, modifies firewall rules
11. **Disables Microsoft Defender** on remote hosts before payload execution

### 2.4 Victimology

#### 2.4.1 Scale and Velocity

| Date | Victims | Countries |
|------|---------|-----------|
| October 2025 | ~48 | 17 |
| February 2026 | ~130 | ~40 |
| April 2026 | 320+ | 50+ |
| May 2026 | 352 | 70+ |
| June 2026 | 478 | 66 |

**SystemBC botnet telemetry:** 1,570+ infected corporate hosts on a SINGLE affiliate's C2

#### 2.4.2 Targeted Industries

Manufacturing (hardest hit), Technology, Healthcare, Financial Services, Construction, Insurance, Education, Government, Energy, Transportation, Retail, Business Services, Real Estate, Agriculture, Media, Hospitality, Telecommunications, Legal Services

#### 2.4.3 Geographic Distribution (Key Finding: NOT US-Centric)

| Country | Share | Notes |
|---------|-------|-------|
| United States | ~13-16% | Significantly lower than industry average (~50%) |
| Thailand | ~10.8% | #1 target country; 53% of ALL Thai ransomware victims are from Gentlemen |
| Brazil | ~6% | Significant concentration |
| France | ~4-5% | Western Europe focus |
| India | ~4.2% | South Asia presence |
| United Kingdom | ~3-4% | Consistent targeting |
| Germany | ~3% | European manufacturing |
| Japan | ~2% | Part of APAC strategy |

**Why Non-US Focus:** The geographic distribution tracks their **pre-built FortiGate access inventory** (~14,700 compromised devices) rather than deliberate economic targeting. This is a vulnerability-driven, not victim-driven, targeting model.

#### 2.4.4 Notable Victims
- Peruvian steel manufacturer (earliest confirmed: June 30, 2025)
- UK software consultancy (data reused to attack Turkish company)
- Thai organizations (largest single-country victim pool)
- Multiple hospitals and healthcare organizations (no sector exclusions)

### 2.5 Initial Access Vectors

#### Primary: CVE-2024-55591 (FortiGate)
- **CVSS:** 9.6 (authentication bypass)
- **Affected:** FortiOS 7.0.0-7.0.16, FortiProxy 7.0.0-7.0.19, 7.2.0-7.2.12
- **Group maintains:** ~14,700 compromised FortiGate devices + 969 validated VPN credentials
- **Operator qbit** maintains live HTML dashboard tracking FortiGate panels with direct login links
- Exploitation produces super-admin access without credentials

#### Secondary Vectors
- **CVE-2025-32433:** Erlang/OTP SSH auth bypass (Cisco appliances)
- **CVE-2025-33073:** NTLM relay (privilege escalation post-foothold)
- **Infostealer-sourced credentials:** RedLine, Lumma, Vidar logs via Snusbase
- **Brute-force VPN/web panels:** Custom tool `buildx641` parses OWA/M365 logs
- **Purchased access:** BreachForums and underground markets
- **Phishing:** AI-assisted lure generation (confirmed)
- **Exposed RDP/VPN:** Credential stuffing

### 2.6 MITRE ATT&CK Mapping (Comprehensive)

#### Initial Access
| Technique ID | Name | Use |
|-------------|------|-----|
| T1190 | Exploit Public-Facing Application | CVE-2024-55591, CVE-2025-32433 |
| T1133 | External Remote Services | VPN access abuse |
| T1078 | Valid Accounts | Compromised credentials from infostealers |
| T1566 | Phishing | AI-assisted phishing lures |

#### Execution
| Technique ID | Name | Use |
|-------------|------|-----|
| T1059.001 | PowerShell | Lateral movement, GPO deployment |
| T1059.003 | Windows Command Shell | Batch scripts, EDR killer execution |
| T1106 | Native API | DeviceIoControl for BYOVD |
| T1047 | Windows Management Instrumentation | Remote process creation |

#### Persistence
| Technique ID | Name | Use |
|-------------|------|-----|
| T1053.005 | Scheduled Task/Job | `UpdateSystem`, `UpdateUser`, `DefU`, `UpdateGU` |
| T1547.001 | Registry Run Keys | `GupdateS` (HKLM), `GupdateU` (HKCU) |
| T1543.003 | Windows Service | `DefSvc`, `UpdateSvc`, `UpdateSvc2` |
| T1136.001 | Local Account Creation | Backup admin accounts |

#### Privilege Escalation
| Technique ID | Name | Use |
|-------------|------|-----|
| T1078 | Valid Accounts | Domain admin compromise |
| T1068 | Exploitation for Privilege Escalation | CVE-2025-33073 NTLM relay |
| ESC1-ESC17 | AD CS Misconfigurations | Certificate abuse |

#### Defense Evasion
| Technique ID | Name | Use |
|-------------|------|-----|
| T1562.001 | Disable or Modify Tools | GentleKiller, EDRStartupHinder, gfreeze, glinker |
| T1562.002 | Disable Windows Event Logging | ETW patching |
| T1070.004 | File Deletion | Shadow copy deletion, log clearing |
| T1036 | Masquerading | Fake filenames (BitD.exe, Kasp.exe, MB.exe) |
| T1036.001 | Invalid Code Signature | Copied but invalid digital signatures |
| T1027 | Obfuscated Files/Information | Garble obfuscation, Enigma/Themida packing |
| T1218.011 | Rundll32 | LOLBin abuse |
| T1055 | Process Injection | Credential dumping |

#### Credential Access
| Technique ID | Name | Use |
|-------------|------|-----|
| T1003.001 | LSASS Memory | Mimikatz execution |
| T1003.006 | DCSync | Active Directory replication |
| T1558 | Steal or Forge Kerberos Tickets | PKINIT, UnPAC-the-hash |
| T1552.001 | Credentials in Files | Backup credential theft |

#### Discovery
| Technique ID | Name | Use |
|-------------|------|-----|
| T1083 | File and Directory Discovery | Network share enumeration |
| T1135 | Network Share Discovery | Drive A-Z mapping |
| T1082 | System Information Discovery | Environment recon |
| T1018 | Remote System Discovery | Advanced IP Scanner, Nmap |
| T1069.002 | Domain Groups | AD enumeration via NetExec |

#### Lateral Movement
| Technique ID | Name | Use |
|-------------|------|-----|
| T1021.002 | SMB/Windows Admin Shares | Hidden SMB shares for payload |
| T1021.004 | SSH | Linux/ESXi lateral movement |
| T1021.006 | Windows Remote Management | PowerShell Remoting |
| T1047 | WMI | Remote process creation |
| T1077 | Windows Admin Shares | PsExec deployment |
| T1484.001 | Group Policy Modification | Domain-wide ransomware deployment |

#### Collection
| Technique ID | Name | Use |
|-------------|------|-----|
| T1560 | Archive Collected Data | WinSCP, rclone for staging |
| T1005 | Data from Local System | Sensitive file identification |

#### Exfiltration
| Technique ID | Name | Use |
|-------------|------|-----|
| T1041 | Exfiltration Over C2 Channel | SystemBC SOCKS5 tunnels |
| T1048.003 | Exfiltration Over Unencrypted/Obfuscated Non-C2 Protocol | Cloudflare WARP tunnels |
| T1567.002 | Exfiltration to Cloud Storage | rclone to multiple destinations |

#### Impact
| Technique ID | Name | Use |
|-------------|------|-----|
| T1486 | Data Encrypted for Impact | File encryption |
| T1490 | Inhibit System Recovery | Shadow copy deletion, backup targeting |
| T1491.001 | Defacement | Wallpaper change |
| T1491.002 | External Defacement | Leak site publication |
| T1657 | Financial Theft | Ransom demand (avg $250K initial, $190K settlement) |

### 2.7 TTPs Summary

| Phase | Key TTP |
|-------|---------|
| **Initial Access** | FortiGate exploitation (CVE-2024-55591), credential abuse, phishing |
| **Reconnaissance** | Advanced IP Scanner, Nmap, NetExec, AD enumeration |
| **Privilege Escalation** | NTLM relay (CVE-2025-33073), AD CS abuse (ESC1-ESC17) |
| **Credential Harvesting** | Mimikatz, DCSync, UnPAC-the-hash, backup credential theft |
| **EDR Evasion** | GentleKiller framework (8+ variants), ETW patching |
| **Persistence** | Scheduled tasks, registry Run keys, services, Cloudflare Zero Trust tunnels |
| **Lateral Movement** | ~21 techniques: SMB, PsExec, WMI, PowerShell Remoting, GPO |
| **Data Exfiltration** | WinSCP, rclone, SystemBC SOCKS5, Cloudflare WARP |
| **Encryption** | Go-based encryptor, X25519+XChaCha20, domain-wide via GPO |
| **Extortion** | Double extortion: Tor DLS + branded X/Twitter + negotiation pressure |

### 2.8 Infrastructure

#### RaaS Platform Components
- **Encryptor:** Go-based (Windows/Linux/NAS/BSD) + C-based ESXi locker
- **Admin Panel:** "Rocket" database (backend, leaked May 2026)
- **Negotiation Platform:** Tox messenger
- **Data Leak Site:** Tor-based DLS
- **Social Media:** Branded X/Twitter account
- **Payment:** Bitcoin, with laundering via exchange chain-hopping (>800 transactions), Tinkoff QR, physical cash delivery
- **Recruitment:** BreachForums partnership (official)

#### Known Affiliate Infrastructure
- SystemBC proxy malware C2 (1,570+ victims on single server)
- Cobalt Strike frameworks
- Cloudflare Zero Trust tunnels ("cloud gripping")
- Custom FortiGate tracking dashboard (operator qbit)

#### Internal Operators (from Rocket Leak)
| Operator | Role |
|----------|------|
| zeta88 | Administrator, infrastructure, locker development, payouts |
| qbit | FortiGate exploitation, vulnerability research |
| quant | Credential theft, backup brute-force operations |
| Kunder | Affiliate operations |
| JeLLy | Affiliate operations |
| Protagor | Affiliate operations |
| Bl0ck | Affiliate operations |
| Wick | Affiliate operations |
| donpakto | Affiliate operations |
| mAst3r | Affiliate operations |

### 2.9 Nation-State Links

**Assessment: Pure cybercriminal operation -- NO confirmed nation-state affiliation.**

However, the following context is relevant:
- Russian-speaking operators
- CIS targeting prohibition (standard Russian eCrime norm, not proof of state sponsorship)
- Operating from Russia with apparent impunity (consistent with Russian tolerance of eCrime)
- No espionage objectives identified -- purely financially motivated
- PRODAFT tracks as "Phantom Mantis" -- purely criminal threat actor

**No evidence of:** direct GRU/FSB/SVR links, false flag operations, or geopolitical targeting criteria.

### 2.10 Decryptors

| Status | Detail |
|--------|--------|
| **NoMoreRansom** | No decryptor available as of July 2026 |
| **Bedrock Safeguard** | Released free decryptor in April 2026 -- **patched same day** by The Gentlemen |
| **Security Vendors** | Check Point, ESET, Microsoft do not offer free decryptors |
| **Key Characteristic** | Per-file ephemeral keys make decryption without operator's private key cryptographically infeasible |
| **Recommendation** | Do NOT rely on decryption -- prioritize backup and recovery |

The group's ability to patch the decryptor within hours demonstrates a **highly responsive development cycle** indicative of a professional software team, not amateur operators.

---

## 3. GENTLEKILLER: THE EDR KILLER FRAMEWORK

### 3.1 What is GentleKiller?

**GentleKiller is NOT a separate threat actor.** It is the **proprietary EDR-killer framework** developed and maintained by The Gentlemen operators to supply their affiliates with endpoint security neutralization capabilities. ESET named it in February 2026 and confirmed via the May 2026 leak that it is centrally developed and distributed by the RaaS operators themselves.

### 3.2 Why This Matters

Most RaaS groups require affiliates to source their own EDR killers. The Gentlemen's approach of **centralizing EDR killing as a service** is unusual and materially lowers the barrier to entry for less-skilled affiliates. Only RansomHub (with EDRKillShifter) is known to offer similar capabilities, but RansomHub provides a single tool -- The Gentlemen provides an entire portfolio.

### 3.3 GentleKiller Architecture

#### Core Framework (8+ Variants)

| Variant | Filename | Impersonates | Driver Abused | Driver Purpose |
|---------|----------|-------------|---------------|----------------|
| **Kaspersky** | `Kasp<suffix>.exe` | Kaspersky AV | `eb.sys` | Custom rootkit |
| **FACEIT** | `FaceIT<suffix>.exe` | FACEIT Anti-Cheat | `nseckrnl.sys` | NSecsoft driver |
| **Valorant** | `Valorant<suffix>.exe` | Valorant (game) | `GameDriverX64.sys` | Tower of Fantasy AntiCheat |
| **Javelin** | `EAAntiCheat<suffix>.exe` | EA Anti-Cheat | `stpm_old.sys` / `stpm_new.sys` | Safetica ProcessMonitor |
| **WatchDog** | `BitD<suffix>.exe` | Bitdefender | `dmx.sys` | Zemana AntiMalware |
| **Network Blocker** | `MB<suffix>.exe` | Malwarebytes | `360netmon_wfp.sys` | Qihoo 360 netmon |
| **Cleaner** | `Deletor.exe` | N/A (IObit) | `IMFForceDelete` | IObit ForceDelete |
| **G11** | `G11<suffix>.exe` / `Symantec<suffix>.exe` | Symantec | `G11.sys` | PoisonX rootkit |

#### Filename Suffix Encoding System

| Suffix | Meaning |
|--------|---------|
| **suffix 1** | Enigma protection + fake digital signature + fake version info |
| **suffix 2** | Themida protection + fake digital signature + fake version info |
| **Light suffix** | No packer + fake digital signature + fake version info |
| **suffix Clear** | NO protection, NO camouflage (deployed when target has no security) |

The existence of "Clear" variants confirms operators conduct reconnaissance before deploying -- they only apply evasion when necessary.

### 3.4 Third-Party EDR Killers (Integrated)

| Tool | Origin | Filename in Gentlemen Ops | Driver |
|------|--------|--------------------------|--------|
| **HexKiller** | Warlock gang | `Avast.exe` | `googleApiUtil64.sys` (Baidu AV driver) |
| **ThrottleBlood** | MedusaLocker/DragonForce | `Sent.exe` | `ThrottleBlood.sys` (ThrottleStop.sys) |
| **HavocKiller** | Huawei audio driver abuse | `Sophos.exe` | `havoc.sys` (Huawei audio driver) |

All third-party tools are **standardized through a shared defense evasion layer** -- Gentlemen applies consistent impersonation techniques (fake version info, copied certificates, vendor icons) even to tools whose source code they don't possess.

### 3.5 Target Scope

- **400+ process names** tied to **48 security products**
- Targets: CrowdStrike, SentinelOne, Microsoft Defender, Sophos, ESET, Kaspersky, Palo Alto, Trend Micro, Huntress, Binary Defense, Blumira, Darktrace, ThreatLocker, Heimdal, and many more
- Full ESET target list available in Appendix

### 3.6 BYOVD Operational Agility

The Gentlemen demonstrate **unusual ability to operationalize new BYOVD proofs-of-concept within days of public release**. This agility allows them to:
- Stay ahead of vendor driver blocklists
- Rotate drivers when one is patched/blocked
- Rapidly adapt to new security products in target environments

### 3.7 OxideHarvest: Affiliate Credential Stealer

ESET identified `buildx641.exe` as **OxideHarvest** -- a credential stealer developed by affiliate "quant":
- Targets browser credential stores (Chrome, Firefox, Edge, Brave, Opera, etc.)
- Also targets cryptocurrency wallets
- Used for harvesting VPN credentials and admin panels

### 3.8 GentleKiller vs. Other EDR Killers

| Feature | GentleKiller | EDRKillShifter (RansomHub) | Market Norm |
|---------|-------------|---------------------------|-------------|
| **Provider** | Operator-maintained | Operator-maintained | Affiliate-sourced |
| **Variants** | 8+ in-house + 3 third-party | Single in-house tool | Varies |
| **Standardization** | Unified evasion layer across all tools | Single tool, no standardization | None |
| **Deployment Speed** | BYOVD PoCs within days | Moderate | Varies |
| **Target Count** | 400+ processes, 48 products | ~100 processes | Varies |
| **Camouflage** | Game + security product impersonation | Security product impersonation | Basic |

### 3.9 "Gentle" in Chinese and Russian Contexts

| Language | Translation | Search Results |
|----------|-------------|----------------|
| **Chinese: 温柔杀手** (wenrou sha shou) | "Gentle Killer" | No malware references found |
| **Chinese: 绅士杀手** (shenshi sha shou) | "Gentleman Killer" | No malware references found |
| **Russian: Джентльмен** (Dzhentl'men) | "Gentleman" | Ransomware group only |
| **Russian: Джентльмен-киллер** | "Gentleman-killer" | No separate references |

**Conclusion:** "GentleKiller" and "The Gentlemen" are English-named branding choices by a Russian-speaking group. The naming is likely **ironic** (sounding sophisticated while being destructive) and does NOT connect to any Chinese malware family or previous "Gentle" malware series. The name was chosen for brand differentiation in the RaaS marketplace.

### 3.10 Is There a "Gentle" Malware Family?

After exhaustive searches across VirusTotal, MalwareBazaar, MITRE ATT&CK, MISP, and threat intel feeds:

**No evidence found** of a broader "Gentle" malware family beyond:
1. **The Gentlemen ransomware** (encryptor)
2. **GentleKiller** (EDR killer framework)
3. **GentlemenCollection** (staging directory name observed in intrusions)

This is **NOT** a false flag naming convention designed to sound benign. It is **deliberate brand marketing** by the threat actor to differentiate their RaaS offering in the competitive underground marketplace. The "gentleman" theme serves as memorable criminal branding -- similar to how "LockBit" or "BlackCat" are chosen for marketability, not technical accuracy.

---

## 4. DEFENSE AGAINST THE GENTLEMEN/GENTLEKILLER

### 4.1 Priority Actions (P0 - Execute Today)

1. **Patch FortiGate immediately:** FortiOS 7.0.17+ / FortiProxy 7.0.20+ / 7.2.13+ (FG-IR-24-535)
2. **Disable FortiGate management interface internet exposure**
3. **Apply CVE-2025-32433 patches** (Erlang SSH on Cisco appliances)
4. **Disable NTLMv1** across all domain controllers
5. **Load all IOCs** from this report into SIEM/EDR
6. **Hunt for** `README-GENTLEMEN.txt` and `gentlemen.bmp` across all endpoints

### 4.2 File-Based Detection

#### Known SHA-256 Hashes (Ransomware)

| SHA-256 | Platform | Source |
|---------|----------|--------|
| `22b38dad7da097ea03aa28d0614164cd25fafeb1383dbc15047e34c8050f6f67` | Windows | Microsoft |
| `025fc0976c548fb5a880c83ea3eb21a5f23c5d53c4e51e862bb893c11adf712a` | Windows | Check Point |
| `1334f0189a8e6dbc48456fa4b482c5726ab7609f7fa652fcc4c1a96f2334436f` | Windows | Check Point |
| `1eece1e1ba4b96e6c784729f0608ad2939cfb67bc4236dfababbe1d09268960c` | Linux | Check Point |
| `51b9f246d6da85631131fcd1fabf0a67937d4bdde33625a44f7ee6a3a7baebd2` | Windows | VirusTotal (first sample) |

#### Known SHA-256 Hashes (Tools)

| SHA-256 | Tool | Source |
|---------|------|--------|
| `078163d5c16f64caa5a14784323fd51451b8c831c73396b967b4e35e6879937b` | PsExec | Microsoft |
| `fe1033335a045c696c900d435119d210361966e2fb5cd1ba3382608cfa2c8e68` | Gentlemen wallpaper | Microsoft |

#### Known SHA-1 Hashes (GentleKiller Variants)

| SHA-1 | Filename | Variant | Source |
|-------|----------|---------|--------|
| `8AE6BD18B129061F63642531F1B684CF0383C75D` | `Kasps.exe` | GentleKiller (Kaspersky) | ESET |
| `BA914FE77B177B45799403B16DD14765C510A074` | `eb.sys` | Rootkit (Kaspersky variant) | ESET |
| `D605994FC72A2BB59B5CFB1624A1B9170ECA73A2` | `FaceIT1.exe` | GentleKiller (FACEIT) | ESET |
| `B0B912A3FD1C05D72080848EC4C92880004021A1` | `nseckrnl.sys` | NSecsoft driver | ESET |
| `5AA3124E5C4921E5EDFC60133B5D71DA21B07DA3` | `Valorant2.exe` | GentleKiller (Valorant) | ESET |
| `A11EE9CDC59E5CAA59AEFD27B30D104F3AD68E62` | `BitD1.exe` | GentleKiller (WatchDog) | ESET |
| `2F86898528C6CAB3540C486A9BFAA0C029B73950` | `MB2.exe` | GentleKiller (Network Blocker) | ESET |
| `A19117175DBC9BA4D23B5DCE8415E299A2E32192` | `Deletor.exe` | GentleKiller (Cleaner) | ESET |
| `D29670E684E40DDC89B47010C37CBC96737035B6` | `Symantec.exe` | GentleKiller (G11) | ESET |
| `CF4D74DF17A91B4A36A2911B22AFEC5D8FA93A01` | `Avast.exe` | HexKiller | ESET |
| `7131B377E96016DC1911020C9F95B1B4D042D7B4` | `Sent.exe` | ThrottleBlood | ESET |
| `F0537CBB773AE12100B36731E7C39F5A9D852B14` | `Sophos.exe` | HavocKiller | ESET |
| `A5CF917EC4A7DFBDFA43621398604805D860C718` | `buildx641.exe` | OxideHarvest | ESET |

### 4.3 YARA Detection Rules

#### Rule 1: The Gentlemen Ransomware Binary Detection

```yara
rule TheGentlemen_Ransomware_Binary
{
    meta:
        description = "Detects The Gentlemen ransomware encryptor binary"
        author = "DEFONEOS Threat Intelligence"
        date = "2026-07-01"
        reference = "https://www.microsoft.com/en-us/security/blog/2026/05/28/the-gentlemen-ransomware-dissecting-a-self-propagating-go-encryptor/"
        hash1 = "22b38dad7da097ea03aa28d0614164cd25fafeb1383dbc15047e34c8050f6f67"
        hash2 = "025fc0976c548fb5a880c83ea3eb21a5f23c5d53c4e51e862bb893c11adf712a"
    strings:
        $s1 = "README-GENTLEMEN.txt" ascii wide
        $s2 = "gentlemen.bmp" ascii wide
        $s3 = "GENTLEMEN" ascii wide
        $s4 = "Silent mode" ascii wide
        $s5 = "Encrypt only mapped...shares" ascii wide
        $s6 = "[+] Encryption started" ascii wide
        $s7 = "UpdateSystem" ascii wide
        $s8 = "UpdateUser" ascii wide
        $s9 = "GupdateS" ascii wide
        $s10 = "GupdateU" ascii wide
        $s11 = "--spread" ascii wide
        $s12 = "--wipe" ascii wide
    condition:
        uint16(0) == 0x5A4D and
        filesize < 20MB and
        4 of ($s*)
}
```

#### Rule 2: GentleKiller EDR Killer Detection

```yara
rule GentleKiller_EDR_Killer
{
    meta:
        description = "Detects GentleKiller EDR killer framework variants"
        author = "DEFONEOS Threat Intelligence"
        date = "2026-07-01"
        reference = "https://www.welivesecurity.com/en/eset-research/killing-me-gently-inside-gentlemens-edr-killer-framework/"
    strings:
        // Variant filenames (packed/protected)
        $f1 = "Kasp" ascii wide
        $f2 = "FaceIT" ascii wide
        $f3 = "Valorant" ascii wide
        $f4 = "BitD" ascii wide
        $f5 = "EAAntiCheat" ascii wide
        $f6 = "EASolo" ascii wide
        $f7 = "Deletor" ascii wide
        $f8 = "G11" ascii wide
        $f9 = "Symantec" ascii wide
        $f10 = "MB" ascii wide

        // Targeted security process names (high-confidence indicator)
        $p1 = "SentinelAgent.exe" ascii wide
        $p2 = "MsMpEng.exe" ascii wide
        $p3 = "avp.exe" ascii wide
        $p4 = "CylanceSvc.exe" ascii wide
        $p5 = "sophosav.exe" ascii wide

        // Vulnerable driver names
        $d1 = "eb.sys" ascii wide
        $d2 = "nseckrnl.sys" ascii wide
        $d3 = "GameDriverX64.sys" ascii wide
        $d4 = "dmx.sys" ascii wide
        $d5 = "360netmon_wfp.sys" ascii wide

        // Staging directory
        $stage = "GentlemenCollection" ascii wide
    condition:
        uint16(0) == 0x5A4D and
        filesize < 50MB and
        (
            (any of ($f*) and 2 of ($p*)) or
            (any of ($f*) and any of ($d*)) or
            $stage
        )
}
```

#### Rule 3: The Gentlemen Ransom Note Detection

```yara
rule TheGentlemen_RansomNote
{
    meta:
        description = "Detects The Gentlemen ransomware note file"
        author = "DEFONEOS Threat Intelligence"
        date = "2026-07-01"
    strings:
        $a = "README-GENTLEMEN.txt" ascii wide
        $b = "GENTLEMEN" ascii wide nocase
        $c = "YOUR DATA HAS BEEN ENCRYPTED" ascii wide nocase
        $d = "TOR BROWSER" ascii wide
        $e = ".onion" ascii wide
    condition:
        any of ($a, $b, $c) and any of ($d, $e)
}
```

### 4.4 Sigma Rules for SIEM

#### Sigma Rule 1: Shadow Copy Deletion (Gentlemen Pattern)

```yaml
title: Shadow Copy Deletion - The Gentlemen Ransomware Pattern
status: experimental
description: Detects shadow copy deletion patterns associated with The Gentlemen ransomware
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        CommandLine|contains:
            - 'vssadmin delete shadows'
            - 'wmic shadowcopy delete'
            - 'Get-WmiObject Win32_ShadowCopy | Remove-WmiObject'
    condition: selection
falsepositives:
    - Legitimate system administration
level: high
tags:
    - attack.impact
    - attack.t1490
    - detection.gentlemen_ransomware
```

#### Sigma Rule 2: ETW Tampering (GentleKiller Behavior)

```yaml
title: ETW/Defender Tampering - Possible GentleKiller Activity
status: experimental
description: Detects Windows Event Tracing tampering and Defender disabling consistent with GentleKiller EDR killer
logsource:
    category: process_creation
    product: windows
detection:
    selection_etw:
        CommandLine|contains:
            - 'logman stop'
            - 'Clear-EventLog'
            - 'wevtutil cl'
            - 'Remove-EventLog'
    selection_defender:
        CommandLine|contains:
            - 'Set-MpPreference -DisableRealtimeMonitoring'
            - 'Add-MpPreference -ExclusionPath'
            - 'Add-MpPreference -ExclusionProcess'
            - 'sc stop WinDefend'
    condition: selection_etw or selection_defender
falsepositives:
    - Legitimate troubleshooting
level: high
tags:
    - attack.defense_evasion
    - attack.t1562.001
    - detection.gentlekiller
```

#### Sigma Rule 3: Ransomware File Extension Detection

```yaml
title: The Gentlemen Ransomware - File Extension Detection
status: experimental
description: Detects encrypted file extensions used by The Gentlemen ransomware
logsource:
    category: file_rename
    product: windows
detection:
    selection:
        TargetFilename|endswith:
            - '.axfsmg'
    condition: selection
falsepositives:
    - Unknown
level: critical
tags:
    - attack.impact
    - attack.t1486
    - detection.gentlemen_ransomware
```

### 4.5 KQL Hunting Queries (Microsoft Sentinel / Defender XDR)

#### KQL 1: Hunt for Gentlemen Ransom Note

```kql
DeviceFileEvents
| where FileName contains "README-GENTLEMEN.txt" or FileName contains "gentlemen.bmp"
| project Timestamp, DeviceName, FileName, FolderPath, InitiatingProcessFileName, InitiatingProcessCommandLine
| sort by Timestamp desc
```

#### KQL 2: Detect Scheduled Task Persistence (Gentlemen Pattern)

```kql
DeviceProcessEvents
| where ProcessCommandLine contains "UpdateSystem" or ProcessCommandLine contains "UpdateUser"
    or ProcessCommandLine contains "DefU" or ProcessCommandLine contains "UpdateGU"
| project Timestamp, DeviceName, ProcessCommandLine, AccountName
| sort by Timestamp desc
```

#### KQL 3: Detect Registry Persistence

```kql
DeviceRegistryEvents
| where RegistryValueName contains "GupdateS" or RegistryValueName contains "GupdateU"
| project Timestamp, DeviceName, RegistryKey, RegistryValueName, RegistryValueData
| sort by Timestamp desc
```

#### KQL 4: Detect File Hash IOCs

```kql
let ioc_sha_hashes = dynamic([
    "22b38dad7da097ea03aa28d0614164cd25fafeb1383dbc15047e34c8050f6f67",
    "025fc0976c548fb5a880c83ea3eb21a5f23c5d53c4e51e862bb893c11adf712a",
    "1334f0189a8e6dbc48456fa4b482c5726ab7609f7fa652fcc4c1a96f2334436f",
    "078163d5c16f64caa5a14784323fd51451b8c831c73396b967b4e35e6879937b",
    "fe1033335a045c696c900d435119d210361966e2fb5cd1ba3382608cfa2c8e68"
]);
union DeviceFileEvents, DeviceImageLoadEvents
| where SHA256 in (ioc_sha_hashes) or InitiatingProcessSHA256 in (ioc_sha_hashes)
| project Timestamp, DeviceName, FileName, SHA256, InitiatingProcessFileName
```

#### KQL 5: Detect PowerShell Lateral Movement

```kql
DeviceProcessEvents
| where FileName =~ "powershell.exe"
| where ProcessCommandLine contains "Invoke-Command" or ProcessCommandLine contains "Enable-PSRemoting"
    or ProcessCommandLine contains "Enter-PSSession"
| where ProcessCommandLine contains "C:\\Temp\\" or ProcessCommandLine contains "\\\\"
| project Timestamp, DeviceName, ProcessCommandLine, AccountName
| sort by Timestamp desc
```

#### KQL 6: Detect Cloudflare WARP Tunnel (Persistence)

```kql
DeviceNetworkEvents
| where RemoteUrl contains "cloudflarewarp.com" or RemoteUrl contains "warp"
| where InitiatingProcessFileName != "warp.exe" // Filter legitimate WARP client
| project Timestamp, DeviceName, RemoteUrl, RemoteIP, InitiatingProcessFileName
| summarize count() by DeviceName, RemoteUrl
```

### 4.6 Suricata Network Signatures

```suricata
# The Gentlemen - SystemBC C2 Traffic
alert tls $HOME_NET any -> $EXTERNAL_NET any (msg:"DEFONEOS The Gentlemen - Possible SystemBC C2"; tls.sni; content:".onion"; fast_pattern; classtype:trojan-activity; sid:1000001; rev:1;)

# The Gentlemen - Cloudflare WARP Tunnel Abuse
alert tls $HOME_NET any -> $EXTERNAL_NET any (msg:"DEFONEOS The Gentlemen - Suspicious Cloudflare WARP Tunnel"; tls.sni; content:"cloudflarewarp.com"; classtype:trojan-activity; sid:1000002; rev:1;)

# The Gentlemen - Data Exfiltration via rclone
alert http $HOME_NET any -> $EXTERNAL_NET any (msg:"DEFONEOS The Gentlemen - Possible rclone Exfiltration"; http.user_agent; content:"rclone"; fast_pattern; classtype:trojan-activity; sid:1000003; rev:1;)
```

### 4.7 Behavioral Indicators

| Indicator | Detection Method | Confidence |
|-----------|-----------------|------------|
| `README-GENTLEMEN.txt` appears on file shares | File monitoring | **CONFIRMED** |
| `gentlemen.bmp` wallpaper change | Registry/file monitoring | **CONFIRMED** |
| `.axfsmg` file extension | File system monitoring | **CONFIRMED** |
| ETW logging disabled system-wide | Windows event monitoring | High |
| Outbound Cloudflare WARP from non-IT endpoints | Network monitoring | High |
| GPO modification adding unknown startup executable | AD monitoring | High |
| Bulk NTLM relay scanning from internal hosts | Network monitoring | Medium |
| `GentlemenCollection` directory | File monitoring | **CONFIRMED** |
| `UpdateSystem` / `UpdateUser` scheduled tasks | Task scheduler audit | **CONFIRMED** |
| `GupdateS` / `GupdateU` registry values | Registry monitoring | **CONFIRMED** |
| Defender exclusions added via PowerShell | EDR/SIEM | High |
| SMB1 enabled on systems where previously disabled | Configuration monitoring | Medium |
| Volume Shadow Copy deletion | Event log monitoring | High |
| PowerShell remoting enabled on non-admin systems | Configuration monitoring | Medium |

### 4.8 Defensive Architecture Recommendations

#### Network Layer
1. **Patch FortiGate immediately** - CVE-2024-55591 is the #1 access vector
2. **Remove FortiGate management interfaces from internet exposure**
3. **Disable NTLMv1** - force NTLMv2 or Kerberos only
4. **Implement network segmentation** - prevent lateral movement
5. **Monitor for SMB1 being enabled** - alert on `sc config lanmanServer start= auto`
6. **Block Cloudflare WARP outbound** from non-authorized endpoints
7. **Monitor for PsExec usage** from non-admin systems

#### Endpoint Layer
1. **Enable Microsoft Defender Tamper Protection** (blocked Gentlemen in documented cases)
2. **Deploy ASR rules** (Attack Surface Reduction)
3. **Implement driver blocklist** for known BYOVD drivers
4. **Enable Credential Guard** to prevent LSASS dumping
5. **Restrict PowerShell** to Constrained Language Mode
6. **Deploy LAPS** (Local Administrator Password Solution)

#### Active Directory Layer
1. **Audit AD CS configurations** - patch ESC1-ESC17 misconfigurations
2. **Enable Privileged Access Workstations (PAWs)**
3. **Implement AD tiering model**
4. **Monitor for DCSync attempts** from non-DC systems
5. **Audit GPO modifications** with alerting
6. **Deploy Microsoft Entra Password Protection**

#### Backup and Recovery
1. **3-2-1 backup strategy** with air-gapped/offline copies
2. **Test restoration procedures** monthly
3. **Backup infrastructure isolation** - separate credentials, separate network
4. **Immutable backups** (write-once, cannot be encrypted)
5. **Backup monitoring** - alert on deletion/modification attempts

### 4.9 Incident Response Playbook: The Gentlemen Infection

#### Phase 1: Detection (0-1 hour)
- [ ] Hunt for `README-GENTLEMEN.txt` across all endpoints
- [ ] Check for `gentlemen.bmp` wallpaper changes
- [ ] Review SIEM for ETW tampering alerts
- [ ] Identify scope: single endpoint or domain-wide
- [ ] **DO NOT** power off systems if encryption has NOT started (preserves forensic evidence)

#### Phase 2: Containment (1-4 hours)
- [ ] Isolate affected systems from network (unplug network, don't shutdown if mid-encryption)
- [ ] Disable compromised FortiGate admin accounts
- [ ] Reset ALL VPN credentials
- [ ] Block known C2 IPs and domains at firewall
- [ ] Disable PowerShell Remoting and SMB1 where not needed
- [ ] Revoke Kerberos tickets for compromised accounts

#### Phase 3: Eradication (4-24 hours)
- [ ] Remove persistence: scheduled tasks (UpdateSystem, UpdateUser, DefU, UpdateGU, UpdateGU2)
- [ ] Remove persistence: registry keys (GupdateS, GupdateU)
- [ ] Remove persistence: services (DefSvc, UpdateSvc, UpdateSvc2)
- [ ] Terminate malicious processes
- [ ] Patch CVE-2024-55591 on ALL FortiGate devices
- [ ] Full AV/EDR scan with updated signatures

#### Phase 4: Recovery (24-72 hours)
- [ ] Restore from clean backups (verify backup integrity first)
- [ ] Rebuild domain controllers if compromised
- [ ] Reissue certificates if AD CS was abused
- [ ] Reset ALL privileged account passwords
- [ ] Validate FortiGate configurations against known-good baseline

#### Phase 5: Post-Incident (72+ hours)
- [ ] Full forensic analysis of compromised systems
- [ ] Check for data exfiltration (review rclone logs, WinSCP sessions)
- [ ] Review Cloudflare WARP tunnel configurations
- [ ] Submit IOCs to threat intelligence sharing communities
- [ ] Conduct lessons learned session

### 4.10 How DEFONEOS Defends Against The Gentlemen

#### DEFONEOS Stack Coverage Matrix

| DEFONEOS Capability | Gentlemen Attack Phase | Detection Effectiveness |
|--------------------|----------------------|------------------------|
| **DEFONEOS Edge** (Firewall/VPN) | Initial Access (FortiGate) | CRITICAL - Monitors CVE-2024-55591 exploitation attempts |
| **DEFONEOS NDR** | Lateral Movement, C2 | HIGH - Detects SystemBC SOCKS5, Cloudflare tunnel abuse |
| **DEFONEOS EDR** | Execution, Evasion, Persistence | HIGH - Detects GentleKiller BYOVD, PowerShell abuse |
| **DEFONEOS SIEM** | All phases | HIGH - Sigma rules for Gentlemen TTPs |
| **DEFONEOS AD Protect** | Privilege Escalation | HIGH - Detects DCSync, NTLM relay, AD CS abuse |
| **DEFONEOS Backup Protect** | Impact/Recovery Disruption | CRITICAL - Immutable backups, tamper detection |
| **DEFONEOS Threat Intel** | Intelligence | HIGH - IOCs, YARA rules, behavioral indicators |

#### Gaps in DEFONEOS Defense
| Gap | Risk | Mitigation |
|-----|------|------------|
| Unpatched FortiGate devices | CRITICAL - Primary access vector | P0 patching required; DEFONEOS cannot protect unpatched infrastructure |
| BYOVD drivers not in blocklist | HIGH | Continuous driver signature updates; EDR tamper protection |
| Legitimate tool abuse (PsExec, PowerShell) | MEDIUM | LOLBin detection; behavioral analytics |
| AI-generated phishing | MEDIUM - Medium | Email security + user awareness training |
| Insider threat (valid credentials) | MEDIUM | Credential Guard; MFA enforcement |

---

## 5. BROADER RANSOMWARE ECOSYSTEM (2026)

### 5.1 Current Top 10 Ransomware Groups (Q1 2026)

| Rank | Group | Q1 2026 Victims | Share | Notes |
|------|-------|----------------|-------|-------|
| 1 | **Qilin** | 338 | 15.9% | #1 for 3 consecutive quarters; Rust-based; 80-85% affiliate split |
| 2 | **Akira** | ~120 | ~6% | $244M total proceeds; Conti lineage; manufacturing focus |
| 3 | **The Gentlemen** | 166 | 7.8% | Fastest-scaling ever; #2 most active in 2026; 90/10 split |
| 4 | **LockBit 5.0** | 163 | 7.7% | Post-Operation Cronos comeback; rebuilding affiliate base |
| 5 | **Cl0p** | ~140 | ~7% | Mass exploitation campaigns; Oracle EBS focus |
| 6 | **DragonForce** | ~90 | ~4% | Former RansomHub affiliate destination |
| 7 | **Inc** | ~80 | ~4% | Consistent operations |
| 8 | **Play** | ~75 | ~3.5% | 85.1% US focus; Russia-linked |
| 9 | **RansomHub** | ~70 | ~3% | Shut down April 2025; affiliates redistributed |
| 10 | **Anubis** | ~60 | ~3% | Healthcare/Critical infrastructure focus |

**Top 10 accounted for 71.1% of all Q1 2026 victims** -- sharp consolidation from 57% in Q3 2025.

### 5.2 Ransomware Trends: What Changed in 2025-2026

#### Consolidation After Peak Fragmentation
- Q3 2025: 85 active groups, top 10 = 57% of victims
- Q1 2026: 71 active groups, top 10 = 71.1% of victims
- Pattern: Law enforcement disruption scatters affiliates; survivors absorb displaced talent

#### Victim Count Stabilization
- Q1 2026: 2,122 DLS victims (second-highest Q1 ever)
- 117% above Q1 2024 (977 victims)
- Despite stabilization, still historically high activity

#### Payment Rates Declining
- Payment rates at "historic lows" per multiple sources
- Groups shifting strategy: fewer victims paying but higher ransom demands
- Move toward selective high-value extortion alongside mass attacks

#### Technical Evolution
- **Double extortion standardized** (encryption + data theft + leak pressure)
- **Triple extortion emerging:** encryption + data theft + regulatory threat + supply chain pressure
- **Cloud targeting increasing:** AWS/Azure/GCP environments, backup infrastructure
- **AI integration:** confirmed use for tool development, phishing, and targeting

### 5.3 Ransomware Targeting Defense Contractors / Critical Infrastructure

- Iranian-affiliated actors using ransomware proxies to target US critical infrastructure
- Blending geopolitical objectives with financially motivated operations
- Ransomware serving as cover for espionage or sabotage
- CISA KEV catalog driving federal remediation requirements

### 5.4 Nation-State Use of Ransomware

| Pattern | Description |
|---------|-------------|
| **False Flag Operations** | Nation-states use ransomware to disguise espionage/sabotage as criminal activity |
| **Ransomware Proxies** | State actors contract criminal groups for deniability |
| **Strategic Targeting** | Criminal groups coincidentally aligned with state interests (CIS prohibition) |
| **Tool Sharing** | State APT tools leaked/modified for criminal use |

---

## 6. AI-ENHANCED RANSOMWARE

### 6.1 AI in The Gentlemen's Operations (CONFIRMED)

| AI Application | Evidence | Source |
|---------------|----------|--------|
| **Ransomware/tool development** | Panel and tooling built with AI coding assistants | Krebs / Check Point |
| **Post-exploitation assistance** | AI used for post-exploitation procedures | PRODAFT |
| **Phishing lure generation** | AI-assisted phishing campaigns | Multiple sources |
| **Target selection** | FortiGate database curation and assignment | Leaked chats |

### 6.2 AI-Powered Ransomware: Current Reality

| Capability | Status | Timeline |
|-----------|--------|----------|
| **AI-assisted targeting** | ACTIVE | Identifying vulnerable organizations via automated recon |
| **AI-powered phishing** | ACTIVE | Hyper-personalized spearphishing at scale |
| **AI-assisted tool development** | ACTIVE | Lowering barrier to entry for operators |
| **Polymorphic encryption** | EXPERIMENTAL | AI-generated encryption variants to evade signatures |
| **AI-powered negotiation** | THEORETICAL | Optimal ransom pricing based on victim profiling |
| **Autonomous propagation** | RESEARCH | Self-directing lateral movement decisions |

### 6.3 AI-Enhanced Evasion Techniques

1. **Polymorphic payload generation:** AI varies encryption routines, file extensions, and binary signatures for each deployment
2. **Dynamic evasion:** AI analyzes target environment and selects optimal evasion techniques
3. **Behavioral mimicry:** AI learns normal network patterns and mimics them during C2 communication
4. **Automated vulnerability research:** AI scans for new CVEs and generates exploitation code

### 6.4 Defensive AI Against Ransomware

| DEFONEOS AI Capability | Application |
|----------------------|-------------|
| **Behavioral Analytics** | Detect anomalous encryption patterns (speed, scope, file types) |
| **Lateral Movement Detection** | AI models identifying multi-technique propagation |
| **BYOVD Detection** | ML models detecting vulnerable driver loading patterns |
| **Phishing Detection** | NLP models identifying AI-generated phishing content |
| **Predictive Threat Intelligence** | Anticipating Gentlemen targeting based on FortiGate exposure data |

### 6.5 The AI Offense-Defense Race

```
ATTACKER AI                              DEFENDER AI
-----------                              -----------
AI-assisted recon    <->    AI-powered threat detection
Polymorphic malware  <->    Behavioral analytics
AI phishing          <->    NLP content analysis
Automated exploit dev <->   Vulnerability prediction
Optimal ransom pricing <->  Victim risk profiling
```

**Key Insight:** AI currently provides marginal advantages to attackers (speed, scale, accessibility) but defender AI has structural advantages (more data, more compute, legitimate access to environments). The race is about **who can operationalize AI faster**.

---

## 7. OPEN-SOURCE TOOLS FOR RANSOMWARE DEFENSE

### 7.1 Detection Tools

| Tool | Purpose | Gentlemen Application |
|------|---------|----------------------|
| **YARA** | File-based malware detection | Custom rules for encryptor + GentleKiller variants |
| **Sigma** | SIEM detection rules | Rules for shadow copy deletion, ETW tampering, persistence |
| **KQL** | Microsoft Sentinel/Defender hunting | Queries for ransom notes, scheduled tasks, registry persistence |
| **Suricata** | Network IDS/IPS | Signatures for SystemBC C2, Cloudflare tunnel abuse |

### 7.2 Forensics Tools

| Tool | Purpose | Application |
|------|---------|-------------|
| **Chainsaw** | Fast Windows event log analysis | Hunt for Gentlemen TTPs in EVTX files |
| **Velociraptor** | Endpoint hunting and forensics | Deploy YARA hunts, collect forensic artifacts at scale |
| **Eric Zimmerman Tools** | Windows forensics | Analyze registry hives, event logs, prefetch |
| **KAPE** | Evidence collection | Targeted collection of Gentlemen artifacts |

### 7.3 Incident Response Tools

| Tool | Purpose |
|------|---------|
| **CyberChef** | Decode/deobfuscate IoCs |
| **VirusTotal** | Hash/URL/IP reputation checking |
| **Any.Run / Joe Sandbox** | Dynamic malware analysis |
| **MalwareBazaar** | Sample acquisition and sharing |
| **MISP** | Threat intelligence sharing |

### 7.4 Specific Gentlemen Detection Stack

```
Layer 1: Network (Suricata)     -> Block C2, detect exfiltration
Layer 2: Endpoint (YARA)        -> Detect encryptor, GentleKiller binaries
Layer 3: SIEM (Sigma/KQL)       -> Detect behavioral TTPs
Layer 4: AD (Native + DEFONEOS) -> Detect privilege escalation, DCSync
Layer 5: Backup (DEFONEOS)      -> Immutable, tamper-detecting backups
```

---

## 8. INTELLIGENCE SOURCES

### 8.1 Primary Sources

| Source | Date | Title | URL |
|--------|------|-------|-----|
| Microsoft | May 28, 2026 | The Gentlemen ransomware: Dissecting a self-propagating Go encryptor | microsoft.com/security/blog |
| ESET | June 18, 2026 | Killing me gently: Inside Gentlemen's EDR killer framework | welivesecurity.com |
| Check Point | May 14, 2026 | Thus Spoke...The Gentlemen | research.checkpoint.com |
| KrebsOnSecurity | June 10, 2026 | Who Runs 'The Gentlemen' Ransomware? | krebsonsecurity.com |
| PRODAFT | June 11, 2026 | The Gentlemen Ransomware Claims 478 Victims | thehackernews.com |
| Trend Micro | Sept 9, 2025 | Unmasking The Gentlemen Ransomware | trendmicro.com |
| Securonix | June 25, 2026 | The "Gentlemen" RaaS and the GentleKiller EDR-Killer Framework | connect.securonix.com |
| Group-IB | March 19, 2026 | The Gentlemen: Affiliate Exposes Details | infosecurity-magazine.com |
| Industrial Cyber | June 1, 2026 | The Gentlemen ransomware combines advanced encryption | industrialcyber.co |
| FalconFeeds | May 4, 2026 | The Gentlemen: RaaS Ecosystem Analysis | falconfeeds.io |

### 8.2 Government Advisories

| Agency | Advisory | Status |
|--------|----------|--------|
| CISA | CVE-2024-55591 added to KEV catalog (January 2025) | ACTIVE |
| CISA | BOD 22-01: Federal agencies must patch KEV-listed CVEs | ENFORCED |
| FortiGuard | FG-IR-24-535: FortiOS/FortiProxy advisory | PUBLISHED |

### 8.3 Threat Intelligence Feeds

- **Recorded Future:** Tracking Storm-2697 / The Gentlemen
- **CrowdStrike:** Tracking as part of eCrime ecosystem
- **Mandiant (Google Cloud):** Available via threat intel subscriptions
- **Intel 471:** Tracked zeta88 forum activity since 2019
- **Flashpoint:** Confirmed Telegram ID associations
- **Constella Intelligence:** Linked phone number to identity

---

## 9. APPENDICES

### Appendix A: Complete Targeted Process List (GentleKiller)

ESET documented 400+ process names across 48 security products. Key targets include:

**CrowdStrike:** CSFalcon.exe, CSFalconContainer.exe, CSFalconService.exe
**SentinelOne:** Sentinel.exe, SentinelAgent.exe, SentinelStaticEngine.exe, SentinelServiceHost.exe
**Microsoft Defender:** MsMpEng.exe, MsSense.exe, smartscreen.exe
**Sophos:** SAVAdminService.exe, SAVService.exe, SophosClean.exe, sophosav.exe
**ESET:** ekrn.exe, egui.exe
**Kaspersky:** avp.exe, avpui.exe, klnagent.exe
**Palo Alto:** cyserver.exe, Traps.exe, tmlisten.exe
**Trend Micro:** TmCCSF.exe, TmListen.exe, ntrtscan.exe
**Huntress:** HuntressAgent.exe, HuntressUpdater.exe
**ThreatLocker:** threatlockerservice.exe, threatlockertray.exe
**Darktrace:** DarktraceAPService.exe
**Heimdal:** Heimdal.AgentHost.exe, Heimdal.ClientCommunication.exe

### Appendix B: Persistence Artifacts Registry

| Artifact | Location | Value |
|----------|----------|-------|
| GupdateS | HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run | [payload path] |
| GupdateU | HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run | [payload path] |
| UpdateSystem | Scheduled Task (SYSTEM) | schtasks /create /tn UpdateSystem |
| UpdateUser | Scheduled Task (User) | schtasks /create /tn UpdateUser |
| DefU | Scheduled Task | Defense evasion blob execution |
| UpdateGU | Scheduled Task | Payload from SMB share |
| UpdateGU2 | Scheduled Task | Payload from C:\\Temp |
| DefSvc | Windows Service | Defense evasion blob |
| UpdateSvc | Windows Service | Payload from SMB share |
| UpdateSvc2 | Windows Service | Payload from C:\\Temp |

### Appendix C: CVE Priority Matrix

| CVE | CVSS | Product | Status | Priority |
|-----|------|---------|--------|----------|
| CVE-2024-55591 | 9.6 | FortiOS/FortiProxy 7.0.x, 7.2.x | PATCH IMMEDIATELY | **P0** |
| CVE-2025-32433 | 9.8 | Erlang/OTP SSH | PATCH IMMEDIATELY | **P0** |
| CVE-2025-33073 | 8.8 | Windows NTLM Relay | PATCH IMMEDIATELY | **P0** |
| CVE-2025-61882 | 9.1 | Oracle EBS (Cl0p-related) | PATCH | **P1** |

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| **BYOVD** | Bring Your Own Vulnerable Driver -- loading a signed but vulnerable kernel driver to gain kernel-level access |
| **DLS** | Data Leak Site -- public website where ransomware groups publish stolen data |
| **EDR Killer** | Tool designed to disable Endpoint Detection and Response products |
| **GentleKiller** | The Gentlemen's proprietary EDR killer framework |
| **RaaS** | Ransomware-as-a-Service -- criminal franchise model |
| **Rocket** | Internal database name used by The Gentlemen (leaked May 2026) |
| **Storm-2697** | Microsoft's tracking identifier for The Gentlemen operators |
| **X25519** | Elliptic Curve Diffie-Hellman key exchange over Curve25519 |
| **XChaCha20** | Extended-nonce variant of the ChaCha20 stream cipher |

### Appendix E: Bedrock Safeguard Decryptor Note

In April 2026, Canadian cybersecurity firm **Bedrock Safeguard** released a free decryptor for The Gentlemen's ransomware. The group issued a **same-day patch** that nullified the decryptor. This incident demonstrates:

1. The group has professional-grade software development capabilities
2. They actively monitor security research
3. Their encryption implementation is actively maintained and patched
4. **Decryption without paying is unreliable** -- the group's response time is measured in hours

Organizations should NOT rely on future decryptor availability and should instead invest in prevention, detection, and backup/recovery capabilities.

---

## 10. EXECUTIVE RECOMMENDATIONS

### For DEFONEOS Leadership

1. **Treat The Gentlemen as CRITICAL priority** -- #2 most active ransomware group globally with demonstrated ability to scale rapidly
2. **Patch FortiGate infrastructure immediately** -- CVE-2024-55591 is the #1 access vector and DEFONEOS may be in their 14,700-device inventory
3. **Deploy all IOCs in this report** within 24 hours to SIEM, EDR, and network monitoring
4. **Review backup architecture** for air-gapped/offline capability -- The Gentlemen specifically targets backup infrastructure
5. **Implement driver blocklist** for known BYOVD drivers used by GentleKiller
6. **Conduct tabletop exercise** using The Gentlemen TTPs as the scenario

### Budget Implications

| Investment | Priority | Estimated Cost |
|-----------|----------|---------------|
| FortiGate patching/management interface lockdown | P0 | Staff time |
| Immutable backup solution | P0 | $$-$$$ |
| EDR tamper protection upgrade | P1 | $-$$ |
| AD CS configuration audit | P1 | $$ |
| BYOVD driver blocklist subscription | P1 | $ |
| Tabletop exercise + IR plan update | P2 | $$ |

### Threat Outlook

The Gentlemen are expected to **rebrand or pivot infrastructure** in response to the May 2026 leak. Their demonstrated technical agility, AI-assisted development, and 90/10 revenue model position them to maintain their #2 ranking or potentially challenge Qilin for #1. The group's centralized EDR-killing model is likely to be **copied by competing RaaS operations**, raising the baseline threat level across the entire ransomware ecosystem.

**DEFONEOS must prepare for:**
- Continued high-volume targeting of non-US organizations
- Rapid adaptation of new BYOVD techniques
- Potential rebrand under new name (retaining GentleKiller or derivative)
- Increased affiliate recruitment following BreachForums partnership
- AI-enhanced targeting and tool development

---

*This report was compiled from open-source intelligence sources including Microsoft Threat Intelligence, ESET Research, Check Point Research, KrebsOnSecurity, PRODAFT, Trend Micro, Group-IB, Securonix, and multiple threat intelligence feeds. All information is TLP:CLEAR and suitable for distribution to security teams, executives, and partners.*

*Report compiled: July 2026*
*Next review: Upon significant operational change or new intelligence*
*Distribution: Internal DEFONEOS use*
