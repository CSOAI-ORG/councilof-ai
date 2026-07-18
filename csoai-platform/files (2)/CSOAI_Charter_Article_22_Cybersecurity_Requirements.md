# CSOAI PARTNERSHIP CHARTER
## ARTICLE 22: CYBERSECURITY REQUIREMENTS

**Version:** 1.0  
**Effective Date:** January 15, 2026, 09:00 GMT  
**Status:** Technical Article - Security Standards

---

## PREAMBLE

This Article establishes comprehensive cybersecurity requirements for all AI systems. AI systems are high-value targets for adversaries—state actors, cybercriminals, competitors. A compromised AI system can cause catastrophic harm. **Security is not optional. Security is survival.**

**Core Principle:** Defense in depth. Assume breach, minimize impact.

---

## 22.1 SECURITY FRAMEWORK REQUIREMENTS

### 22.1.1 NIST Cybersecurity Framework (CSF 2.0)

**Mandatory for All AI Systems:**

The NIST CSF provides a flexible framework for managing cybersecurity risk. All CSOAI-licensed AI must implement the six core functions:

**GOVERN:**
- Cybersecurity supply chain risk management
- Roles, responsibilities, and authorities
- Policy, legal, and regulatory requirements
- Risk management strategy
- Oversight and accountability

**IDENTIFY:**
- Asset management (hardware, software, data, people)
- Business environment understanding
- Governance structures
- Risk assessment methodology
- Risk management strategy
- Supply chain risk management

**PROTECT:**
- Identity management and access control
- Awareness and training
- Data security
- Information protection processes and procedures
- Maintenance
- Protective technology

**DETECT:**
- Anomalies and events detection
- Security continuous monitoring
- Detection processes

**RESPOND:**
- Response planning
- Communications
- Analysis
- Mitigation
- Improvements

**RECOVER:**
- Recovery planning
- Improvements
- Communications

**CSOAI Requirements by Risk Tier:**

| Risk Tier | CSF Implementation Level |
|-----------|-------------------------|
| Low | Partial (Tier 1) - Inform decisions with risk awareness |
| Medium | Risk-Informed (Tier 2) - Informed risk management |
| High | Repeatable (Tier 3) - Consistent risk management approach |
| Critical | Adaptive (Tier 4) - Continuously improving, data-driven |

**Documentation:**
- Self-assessment completed annually
- Gaps identified and remediation plan
- Progress tracked and reported to CSOAI

### 22.1.2 ISO/IEC 27001:2022 Certification

**Information Security Management System (ISMS):**

**Required for Medium+ Risk Tiers:**
- Formal ISMS established
- ISO 27001 certification within 12 months of license grant
- Annual recertification
- Certification body must be accredited (UKAS, ANAB, etc.)

**ISO 27001 Requirements:**
- Context of the organization (Clause 4)
- Leadership commitment (Clause 5)
- Planning (risk assessment, objectives) (Clause 6)
- Support (resources, competence, awareness) (Clause 7)
- Operation (risk treatment, controls) (Clause 8)
- Performance evaluation (monitoring, audit, review) (Clause 9)
- Improvement (nonconformity, corrective action) (Clause 10)

**Annex A Controls (114 total):**

All applicable controls implemented, including:
- A.5: Organizational controls (policies, roles, etc.)
- A.6: People controls (screening, training, disciplinary)
- A.7: Physical controls (secure areas, equipment security)
- A.8: Technological controls (encryption, access control, logging, backup, etc.)

**Statement of Applicability (SoA):**
- Documents which controls applied
- Justification for exclusions
- Publicly available (redacted as needed)

### 22.1.3 SOC 2 Type II Audit

**Service Organization Control:**

**Required Annually for High/Critical Tiers:**
- Independent auditor (Big 4 or equivalent)
- Examines controls over 6-12 month period
- Reports on Security (mandatory) + Availability, Confidentiality, Processing Integrity, Privacy (as applicable)

**Trust Service Criteria:**

**Security:**
- CC6.1: Logical and physical access controls
- CC6.2: System operation
- CC6.3: Change management
- CC6.4: Risk mitigation
- CC6.6: Logical and physical security
- CC6.7: System monitoring
- CC6.8: Security incidents

**Plus (if applicable):**
- Availability (A1.1-A1.3)
- Confidentiality (C1.1-C1.2)
- Processing Integrity (PI1.1-PI1.5)
- Privacy (P1.1-P8.1)

**Report Distribution:**
- CSOAI receives copy
- Customers can request (with NDA)
- Summary published on Public Watchdog

### 22.1.4 Zero Trust Architecture

**"Never Trust, Always Verify":**

**Principles:**
- Assume breach (internal = external threat)
- Verify explicitly (every access request authenticated, authorized)
- Least privilege access (minimum necessary permissions)
- Microsegmentation (limit lateral movement)
- Monitor and log everything

**Implementation:**

**Identity-Centric Security:**
- Strong identity verification
- Multi-factor authentication (MFA) mandatory
- Continuous authentication (not just at login)
- Context-aware access (device, location, behavior)

**Device Security:**
- Device health verification
- Endpoint Detection and Response (EDR)
- Mobile Device Management (MDM)
- Trusted devices only

**Network Segmentation:**
- Micro-perimeters around critical assets
- Software-Defined Perimeter (SDP)
- Encrypted connections (TLS 1.3+)
- No implicit trust based on network location

**Data-Centric Security:**
- Data classification (public, internal, confidential, restricted)
- Encryption at rest and in transit
- Data Loss Prevention (DLP)
- Rights management

**NIST SP 800-207 Compliance:**
- CSOAI provides implementation guide
- High/Critical systems must document Zero Trust architecture
- Annual assessment of Zero Trust maturity

---

## 22.2 THREAT PROTECTION

### 22.2.1 Endpoint Detection and Response (EDR)

**All Endpoints Must Have EDR:**

**Capabilities Required:**
- Real-time monitoring of endpoints (laptops, servers, etc.)
- Behavioral analysis (detect anomalies)
- Threat intelligence integration
- Automated response (isolate infected device)
- Forensic data collection
- Cloud-managed console

**Approved Solutions:**
- CrowdStrike Falcon
- Microsoft Defender for Endpoint
- SentinelOne
- Carbon Black
- Palo Alto Cortex XDR

**Configuration:**
- Prevention mode enabled (not just detection)
- Cannot be disabled by users
- Automatic updates
- Centrally managed
- Alerts to SOC

**Coverage:**
- 100% of endpoints (no exceptions)
- Includes developer workstations (high-value targets)
- Includes cloud instances
- Includes containers (runtime protection)

### 22.2.2 Extended Detection and Response (XDR)

**For High/Critical Systems:**

**Beyond EDR - Correlation Across:**
- Endpoints
- Network
- Cloud workloads
- Email
- Identity

**Benefits:**
- Holistic view of threats
- Faster detection (correlated signals)
- Automated response across vectors
- Reduced alert fatigue (fewer false positives)

**Implementation:**
- XDR platform deployed
- All data sources integrated
- Automated playbooks for common threats
- SOC team trained on XDR console

### 22.2.3 Security Information and Event Management (SIEM)

**Centralized Log Management and Analysis:**

**Required for Medium+ Tiers:**

**Capabilities:**
- Log aggregation (all systems send logs to SIEM)
- Real-time analysis
- Correlation rules (detect attack patterns)
- Alerting
- Dashboards and reporting
- Long-term retention (1 year minimum)

**Approved Solutions:**
- Splunk Enterprise Security
- IBM QRadar
- Microsoft Sentinel
- Elastic Security
- Chronicle (Google)

**Log Sources:**
- Operating systems (Windows Event Logs, syslog)
- Applications (AI system logs, web servers)
- Network devices (firewalls, routers)
- Security tools (EDR, IDS/IPS, WAF)
- Cloud platforms (AWS CloudTrail, Azure Monitor, GCP Logging)
- Identity systems (Active Directory, Okta)

**Use Cases:**
- Threat detection (malware, intrusion attempts)
- Compliance monitoring
- Incident investigation
- User behavior analytics

**24/7 Monitoring:**
- Critical systems: Dedicated SOC (Security Operations Center)
- High systems: Managed SIEM service (MSSP) acceptable
- Medium systems: Business hours monitoring + on-call

### 22.2.4 Intrusion Detection and Prevention Systems (IDS/IPS)

**Network-Based Threat Detection:**

**IDS (Detection):**
- Monitor network traffic
- Detect suspicious patterns (signatures + anomalies)
- Alert security team
- Passive (does not block)

**IPS (Prevention):**
- Active blocking of threats
- Inline deployment
- Automatic response to known attacks

**Deployment:**
- Critical network segments protected
- Both north-south (internet) and east-west (internal) traffic
- Cloud-native IPS for cloud deployments

**Approved Solutions:**
- Palo Alto Networks
- Cisco Firepower
- Fortinet FortiGate
- Check Point
- AWS Network Firewall (cloud)

**Tuning:**
- Regular signature updates
- False positive reduction
- Custom rules for AI-specific threats

### 22.2.5 Web Application Firewall (WAF)

**For AI Systems with Web Interfaces:**

**Protection Against:**
- SQL injection
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Remote code execution
- DDoS attacks (application layer)
- API abuse

**Deployment:**
- In front of all web applications
- Cloud WAF (Cloudflare, AWS WAF, Azure WAF) or on-premises

**OWASP Top 10 Coverage:**
- Broken Access Control
- Cryptographic Failures
- Injection
- Insecure Design
- Security Misconfiguration
- Vulnerable and Outdated Components
- Identification and Authentication Failures
- Software and Data Integrity Failures
- Security Logging and Monitoring Failures
- Server-Side Request Forgery (SSRF)

**Configuration:**
- Blocking mode (not just monitoring)
- Rate limiting (prevent abuse)
- Geo-blocking (if appropriate)
- API protection (JSON/XML parsing, rate limits)

**Special Considerations for AI:**
- Prompt injection protection (detect malicious prompts)
- Model extraction prevention (rate limit inference requests)
- Training data poisoning prevention (validate inputs)

### 22.2.6 DDoS Protection

**Distributed Denial of Service Mitigation:**

**Layers of Protection:**

**Layer 3/4 (Network/Transport):**
- Volumetric attacks (UDP flood, SYN flood)
- Cloud-based scrubbing (Cloudflare, Akamai, AWS Shield)
- Absorb attack traffic before reaching infrastructure

**Layer 7 (Application):**
- HTTP floods
- Slowloris attacks
- WAF with rate limiting

**Always-On Protection:**
- Not just "call us if attacked"
- Continuous traffic analysis
- Automatic mitigation

**Capacity:**
- Able to handle 10x normal traffic (minimum)
- 100Gbps+ protection for Critical systems

---

## 22.3 VULNERABILITY MANAGEMENT

### 22.3.1 Vulnerability Scanning

**Automated and Continuous:**

**Tools:**
- Network scanners (Nessus, Qualys, Rapid7)
- Container scanners (Trivy, Aqua, Snyk)
- Application scanners (Checkmarx, Veracode)
- Infrastructure-as-code scanners (Checkov, tfsec)

**Scanning Frequency:**

| Asset Type | Scan Frequency |
|-----------|---------------|
| Production systems | Weekly |
| Development/staging | Monthly |
| Cloud infrastructure | Daily (automated) |
| Containers/images | Every build |
| Dependencies | Daily (automated) |

**Scan Scope:**
- All internet-facing systems
- All internal systems
- All cloud resources
- All container images before deployment
- All code repositories

**Vulnerability Databases:**
- CVE (Common Vulnerabilities and Exposures)
- NVD (National Vulnerability Database)
- Vendor-specific advisories
- Threat intelligence feeds

### 22.3.2 Patch Management

**Timely Remediation Required:**

**Patching SLAs (from vulnerability disclosure):**

| Severity | Patching Deadline | Justification if Delayed |
|----------|------------------|------------------------|
| **Critical** (CVSS 9.0-10.0) | **7 days** | Requires C-level approval |
| **High** (CVSS 7.0-8.9) | **30 days** | Risk assessment required |
| **Medium** (CVSS 4.0-6.9) | **90 days** | Standard priority |
| **Low** (CVSS 0.1-3.9) | **180 days** | As resources permit |

**Process:**

1. **Vulnerability Identified** (scan or disclosure)
2. **Assessment** (is system affected? What's the risk?)
3. **Testing** (test patch in non-production)
4. **Approval** (change management process)
5. **Deployment** (scheduled maintenance or emergency)
6. **Verification** (confirm patch applied and vulnerability resolved)

**Change Management:**
- Patches deployed during maintenance windows (when possible)
- Emergency patches (Critical severity) can bypass normal change control
- Rollback plan always prepared

**Virtual Patching:**
- If patch cannot be applied immediately (compatibility issues)
- Use WAF or IPS rules to block exploit attempts
- Temporary measure until actual patch deployed

### 22.3.3 Penetration Testing

**Simulated Attacks to Identify Weaknesses:**

**Frequency:**

| Risk Tier | Penetration Test Frequency | Type |
|-----------|--------------------------|------|
| Low | Every 2 years | Automated scan acceptable |
| Medium | Annual | Manual testing (limited scope) |
| High | Annual | Comprehensive manual testing |
| Critical | Biannual (every 6 months) | Red team exercise |

**Scope:**
- External penetration test (internet-facing systems)
- Internal penetration test (assume attacker breached perimeter)
- Social engineering (phishing simulation)
- Physical security (if applicable)

**Methodology:**
- PTES (Penetration Testing Execution Standard)
- OWASP Testing Guide (for web applications)
- OSSTMM (Open Source Security Testing Methodology Manual)

**Rules of Engagement:**
- Written authorization (legal protection for testers)
- Scope clearly defined (what's in/out of bounds)
- Timing coordinated (avoid disrupting production)
- Emergency contact (if something goes wrong)

**Reporting:**
- Executive summary (high-level findings)
- Technical details (exploitation paths, evidence)
- Risk ratings (CVSS scores)
- Remediation recommendations
- Retest to verify fixes

**External Testers:**
- Independent firms (not internal team testing themselves)
- Certified professionals (OSCP, GPEN, etc.)
- NDA and insurance required

### 22.3.4 Bug Bounty Programs

**Crowdsourced Security:**

**Encouraged for All, Required for Critical:**

**Platforms:**
- HackerOne
- Bugcrowd
- Synack
- Self-hosted program (intigriti, YesWeHack)

**Scope:**
- What assets are in scope (domains, APIs, mobile apps)
- What's out of scope (social engineering, DDoS)
- Rules (responsible disclosure, no data exfiltration)

**Rewards:**

| Severity | Bounty Range |
|----------|-------------|
| Critical | $5,000 - $50,000 |
| High | $1,000 - $10,000 |
| Medium | $500 - $2,000 |
| Low | $100 - $500 |
| Informational | Swag/recognition |

**Response SLA:**
- Triage: 5 business days
- Resolution: Based on severity (same as patch SLAs)
- Public disclosure: After fix deployed + 90 days (coordinated disclosure)

**Benefits:**
- Continuous testing (thousands of researchers)
- Cost-effective (pay for results)
- Diverse perspectives
- Reputation (shows commitment to security)

---

## 22.4 INCIDENT RESPONSE

### 22.4.1 Security Incident Response Plan (SIRP)

**Documented and Tested Plan:**

**Required for All Risk Tiers:**

**Plan Contents:**

**1. Preparation:**
- Incident response team (roles, contacts)
- Tools and resources (forensics, backups)
- Communication protocols
- Legal contacts (law enforcement, legal counsel)

**2. Identification:**
- How incidents detected (SIEM alerts, user reports)
- Incident classification (security incident vs operational issue)
- Severity levels (Critical, High, Medium, Low)

**3. Containment:**
- Short-term containment (isolate infected systems)
- Long-term containment (patch vulnerabilities, segment network)
- Evidence preservation

**4. Eradication:**
- Remove malware
- Close attack vectors
- Patch vulnerabilities
- Verify no persistence mechanisms

**5. Recovery:**
- Restore from clean backups
- Rebuild compromised systems
- Verification testing
- Monitoring for re-infection

**6. Lessons Learned:**
- Post-incident review (within 2 weeks)
- Root cause analysis
- Improvements to prevent recurrence
- Update IR plan

**Testing:**
- Tabletop exercises (quarterly)
- Simulated incident (annually)
- Full-scale red team exercise (Critical tier, annually)

### 22.4.2 Security Operations Center (SOC)

**24/7 Monitoring and Response:**

**Required for Critical Risk Tier:**
- Dedicated SOC team (in-house or MSSP)
- 24/7/365 coverage
- Minimum 3 people on shift at all times
- Escalation to senior analysts and management

**SOC Functions:**
- Monitor SIEM and security alerts
- Triage and investigate incidents
- Coordinate incident response
- Threat hunting (proactive searching for threats)
- Threat intelligence analysis
- Reporting and metrics

**For High Risk:**
- Business hours SOC acceptable
- On-call coverage after hours (1-hour response SLA)

**For Medium Risk:**
- Managed SIEM service acceptable
- On-call security engineer (4-hour response SLA)

**SOC Tools:**
- SIEM (log analysis)
- SOAR (Security Orchestration, Automation, Response)
- Threat intelligence platforms
- Forensic tools
- Case management system

### 22.4.3 Incident Classification

**Severity Levels:**

**Critical:**
- Active exploitation of vulnerability
- Data breach (PII, trade secrets, etc.)
- Ransomware infection
- Complete system compromise
- APT (Advanced Persistent Threat) detected

**High:**
- Attempted exploitation (blocked)
- Malware detected (contained)
- Unauthorized access (limited scope)
- DDoS attack (service disruption)

**Medium:**
- Policy violations (security policy not followed)
- Suspicious activity (potential threat)
- Failed login attempts (possible brute force)

**Low:**
- Security alerts (investigated, benign)
- User errors (misconfiguration, not malicious)

**Response Times:**

| Severity | Initial Response | Full Containment | Resolution |
|----------|-----------------|-----------------|------------|
| Critical | 15 minutes | 4 hours | 24 hours |
| High | 1 hour | 24 hours | 1 week |
| Medium | 4 hours | 1 week | 1 month |
| Low | 1 business day | As needed | As needed |

### 22.4.4 Notification Requirements

**When Security Incidents Occur:**

**Internal Notification:**
- Security team (immediate)
- Executive management (Critical/High within 1 hour)
- Legal counsel (data breach, Critical within 2 hours)
- Affected business units (as appropriate)

**External Notification:**

**CSOAI (Article 13.4):**
- Critical incidents: 1 hour
- High incidents: 24 hours
- Medium incidents: 1 week
- Low incidents: Monthly summary

**Regulators (if applicable):**
- Data breach: Per GDPR (72 hours), CCPA, etc.
- Financial institutions: Per banking regulations
- Healthcare: HIPAA breach notification

**Customers/Users:**
- If data compromised: Per applicable law and contract
- Transparency preferred (build trust)

**Law Enforcement:**
- If criminal activity (hacking, ransomware)
- FBI Cyber Division, local authorities
- Coordinate with legal counsel

**Public Disclosure:**
- Critical incidents affecting public: Press release
- Transparency via Public Watchdog (Article 13)
- Coordinate messaging with CSOAI

### 22.4.5 Post-Incident Review

**Always Conduct After Every Incident:**

**Timeline:** Within 2 weeks of incident resolution

**Participants:**
- Incident response team
- Affected system owners
- Management
- External consultants (if used)

**Review Questions:**
- What happened? (timeline, attack vector)
- How was it detected? (was detection timely?)
- How was it contained and resolved?
- What worked well?
- What could be improved?
- Root cause (technical and organizational)
- How to prevent similar incidents?

**Outputs:**
- Incident report (documented)
- Lessons learned
- Action items (assign owners, due dates)
- Updates to IR plan, security controls
- Training needs identified
- Share with CSOAI community (anonymized)

---

## 22.5 SUPPLY CHAIN SECURITY

### 22.5.1 Software Bill of Materials (SBOM)

**Inventory of All Components:**

**Required for Medium+ Risk Tiers:**

**SBOM Contents:**
- Component name
- Version
- Supplier/author
- License
- Dependencies (recursive)
- Known vulnerabilities

**Formats:**
- SPDX (Software Package Data Exchange)
- CycloneDX
- SWID (Software Identification Tags)

**Generation:**
- Automated tools (Syft, Trivy, OWASP Dependency-Track)
- Every build generates updated SBOM
- Version controlled alongside code

**Usage:**
- Vulnerability tracking (when new CVE disclosed, check if component affected)
- License compliance
- Supply chain risk assessment
- Incident response (which systems use vulnerable component?)

**Sharing:**
- Provide to CSOAI upon request
- Customers can request (transparency)
- Not publicly disclosed (security through obscurity debate, but consensus is selective disclosure)

### 22.5.2 Dependency Management

**Third-Party Libraries and Packages:**

**Risks:**
- Vulnerable dependencies (e.g., Log4Shell in log4j)
- Malicious packages (typosquatting, account takeover)
- Abandoned projects (no security updates)
- Licensing issues

**Best Practices:**

**Dependency Pinning:**
- Lock file (package-lock.json, requirements.txt with hashes)
- Exact versions, not ranges
- Prevents unexpected updates

**Automated Scanning:**
- Dependabot, Snyk, WhiteSource
- Daily scans for new vulnerabilities
- Automated pull requests to update

**Private Registry:**
- Mirror public packages internally
- Scan before adding to mirror
- Control what can be used

**Minimal Dependencies:**
- Only include what's necessary
- Regularly audit and remove unused
- Prefer well-maintained, popular libraries

**License Compliance:**
- Check licenses (GPL, MIT, Apache, etc.)
- Ensure compatibility with your license
- Avoid copyleft if proprietary

### 22.5.3 Vendor Security Assessments

**Third-Party Software and Services:**

**Due Diligence Before Procurement:**

**Security Questionnaire:**
- Security certifications (ISO 27001, SOC 2)
- Incident history (past breaches?)
- Vulnerability management process
- Encryption (data at rest, in transit)
- Access controls
- Data location (jurisdiction)
- Compliance (GDPR, CCPA, etc.)
- Business continuity
- Insurance coverage

**Risk-Based Assessment:**
- Critical vendors: On-site audit
- High vendors: Detailed questionnaire + follow-up
- Medium vendors: Standard questionnaire
- Low vendors: Certification verification

**Ongoing Monitoring:**
- Annual re-assessment
- Monitor for security incidents (vendor breach notifications)
- Review security reports (SOC 2 updates)
- Vendor security ratings (SecurityScorecard, BitSight)

**Contract Requirements:**
- Security obligations (maintain certifications)
- Right to audit
- Breach notification (24 hours)
- Liability and indemnification
- Termination for security failures

### 22.5.4 Open Source Security

**Using Open Source Components:**

**Benefits:**
- Transparency (can review code)
- Community-tested
- Cost-effective

**Risks:**
- No warranty or support
- Vulnerabilities may not be quickly patched
- Licensing complexities
- Supply chain attacks (compromised maintainer accounts)

**Risk Mitigation:**

**Vetting:**
- Established projects (years of development)
- Active maintenance (recent commits)
- Large community (many contributors)
- Security track record (past vulnerabilities handled well?)

**Monitoring:**
- GitHub Security Advisories
- National Vulnerability Database
- OSSF (Open Source Security Foundation) initiatives

**Contribution:**
- Contribute back (bug fixes, security improvements)
- Support maintainers financially (donations, sponsorships)
- Responsible disclosure (if find vulnerability)

**Alternatives:**
- Commercial support options (Red Hat for Linux, etc.)
- Dual-licensed projects (open source + commercial)
- Internal forks (if needed, but maintenance burden)

### 22.5.5 Hardware Supply Chain

**For AI Training Infrastructure:**

**Risks:**
- Counterfeit components
- Hardware implants (very sophisticated attacks)
- Compromised firmware
- Supply chain espionage

**Mitigations:**
- Trusted vendors only (direct from manufacturer or authorized distributors)
- Firmware verification (check cryptographic signatures)
- Hardware security modules (HSMs) for key storage
- Physical security (tamper-evident packaging, secure facilities)

**Critical Systems:**
- Consider hardware from democratic jurisdictions
- Avoid dependency on single country
- Diversity in supply chain

---

## 22.6 CONCLUSION

Cybersecurity is not a destination, it's a journey. Threats evolve, defenses must too. CSOAI requires continuous improvement, not one-time compliance.

**The stakes are high:**
- Compromised AI system = Potential for massive harm
- Data breach = Privacy violations, financial loss, reputational damage
- System unavailability = Service disruption, economic impact
- Existential risk = If AGI/ASI systems compromised

**Defense in depth is essential:**
- Perimeter security (firewalls, WAF)
- Network security (segmentation, IDS/IPS)
- Endpoint security (EDR)
- Application security (secure coding, testing)
- Data security (encryption, DLP)
- Identity security (MFA, least privilege)
- Monitoring (SIEM, SOC)
- Incident response (prepared, tested)
- Supply chain security (vendors, dependencies)

**No single control is sufficient. Layers provide resilience.**

**Culture of security:**
- Not just IT's job, everyone's responsibility
- Security training
- Speak up about concerns
- Continuous improvement

**CSOAI supports members:**
- Best practice sharing
- Threat intelligence
- Incident coordination
- Training and resources

**Together, we secure AI. Individually, we struggle.**

**Effective Date:** January 15, 2026, 09:00 GMT  
**"Secure the Foundation, Protect the Future"**

---

## REFERENCES

NIST. (2024). *NIST Cybersecurity Framework (CSF) 2.0.* NIST.

ISO/IEC. (2022). *ISO/IEC 27001:2022 - Information Security Management Systems.*

AICPA. (2024). *SOC 2 Trust Services Criteria.*

NIST. (2020). *NIST SP 800-207 - Zero Trust Architecture.*

OWASP. (2023). *OWASP Top 10 - 2023.*

MITRE. (2024). *ATT&CK Framework for Enterprise.*

CISA. (2024). *Known Exploited Vulnerabilities Catalog.*

NTIA. (2021). *Software Bill of Materials (SBOM) - Framing Working Group.*

---

END OF ARTICLE 22

**Next:** Article 23 - Model Development Standards (FULL VERSION)
