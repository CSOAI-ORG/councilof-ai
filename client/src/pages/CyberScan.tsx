import { useEffect, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import AISystemNotice from "../components/AISystemNotice";

// /scan — cyber self-scan. A CISO or SMB can scan their own business with a stack of
// reputable open-source security tools, then paste the findings and the
// Sovereign triages, prioritises, maps to frameworks (NIS2/DORA/CRA/ISO 27001/
// SOC 2), and drafts remediation — signed to Layer 0. Test your own cyber; the
// Sovereign helps you fix it. Value back to you, not an expensive vendor.

const GW = "/api";

type Tool = { name: string; what: string; run: string; maps: string };
type Domain = { id: string; label: string; glyph: string; tools: Tool[] };

const STACK: Domain[] = [
  { id: "surface", label: "Attack surface & recon", glyph: "🛰", tools: [
    { name: "Amass (OWASP)", what: "Map your external footprint — subdomains, exposed services.", run: "amass enum -d yourdomain.com", maps: "NIS2 asset mgmt · CRA product surface" },
    { name: "theHarvester", what: "Find exposed emails, hosts, and leaked surface for your org.", run: "theHarvester -d yourdomain.com -b all", maps: "NIS2 · ISO 27001 A.5" },
    { name: "Nmap", what: "Discover open ports and services across your estate.", run: "nmap -sV -sC -oX scan.xml TARGET", maps: "NIS2 risk mgmt · CIS 4/12" },
  ]},
  { id: "vuln", label: "Vulnerability scanning", glyph: "🩻", tools: [
    { name: "OpenVAS / Greenbone", what: "Full network vulnerability assessment with CVE scoring.", run: "greenbone / gvm-cli — scan TARGET", maps: "NIS2 vuln handling · DORA ICT risk" },
    { name: "Nuclei (ProjectDiscovery)", what: "Fast template-based checks for known CVEs + misconfigs.", run: "nuclei -u https://yourapp.com", maps: "CRA vuln handling · ISO 27001 A.8" },
  ]},
  { id: "web", label: "Web application", glyph: "🕸", tools: [
    { name: "OWASP ZAP", what: "Dynamic app scan — injection, XSS, auth, session flaws.", run: "zap.sh -quickurl https://yourapp.com -quickout zap.html", maps: "OWASP Top 10 · SOC 2 CC · ISO 27001" },
    { name: "Nikto", what: "Quick web-server misconfiguration + known-issue scan.", run: "nikto -h https://yourapp.com", maps: "NIS2 · CIS 4" },
  ]},
  { id: "cloud", label: "Cloud posture", glyph: "☁️", tools: [
    { name: "Prowler", what: "AWS/Azure/GCP security posture vs CIS + best practice.", run: "prowler aws", maps: "CIS Benchmarks · SOC 2 · ISO 27017" },
    { name: "ScoutSuite", what: "Multi-cloud config audit with an HTML report.", run: "scout aws", maps: "DORA ICT · NIS2 · CSA CCM" },
  ]},
  { id: "container", label: "Containers & images", glyph: "📦", tools: [
    { name: "Trivy (Aqua)", what: "Scan images, filesystems, and IaC for CVEs + secrets.", run: "trivy image yourimage:tag", maps: "CRA SBOM · supply-chain · ISO 27001 A.8" },
    { name: "kube-bench", what: "Check Kubernetes against the CIS Kubernetes Benchmark.", run: "kube-bench run", maps: "CIS K8s · NIS2 hardening" },
  ]},
  { id: "iac", label: "Infrastructure-as-code", glyph: "🏗", tools: [
    { name: "Checkov (Prisma)", what: "Scan Terraform/CloudFormation/K8s for misconfig before deploy.", run: "checkov -d .", maps: "CIS · SOC 2 · secure-by-design (CRA)" },
    { name: "tfsec / Trivy config", what: "Static analysis of Terraform for security issues.", run: "trivy config .", maps: "CRA secure-by-default · NIS2" },
  ]},
  { id: "secrets", label: "Secrets & code", glyph: "🔑", tools: [
    { name: "Gitleaks", what: "Detect hardcoded secrets/keys across your repos + history.", run: "gitleaks detect --source .", maps: "ISO 27001 A.8 · SOC 2 · NIS2" },
    { name: "Semgrep", what: "Fast SAST — find insecure code patterns in your source.", run: "semgrep --config auto .", maps: "OWASP · secure-by-design (CRA)" },
  ]},
  { id: "supply", label: "Dependencies & SBOM", glyph: "🧬", tools: [
    { name: "OSV-Scanner (Google)", what: "Find known-vulnerable dependencies from the OSV database.", run: "osv-scanner -r .", maps: "CRA vuln handling · EO SBOM · NIS2" },
    { name: "Syft", what: "Generate an SBOM (CycloneDX/SPDX) of everything you ship.", run: "syft yourimage:tag -o cyclonedx-json", maps: "CRA SBOM · US EO 14028 · ISO 27001" },
  ]},
  { id: "host", label: "Host & benchmark", glyph: "🖥", tools: [
    { name: "Lynis", what: "Audit Linux/Unix host hardening + compliance posture.", run: "lynis audit system", maps: "CIS Benchmarks · NIS2 hardening" },
    { name: "OpenSCAP", what: "Automated compliance scanning against SCAP baselines.", run: "oscap xccdf eval --profile cis ...", maps: "CIS · NIST 800-53 · ISO 27001" },
  ]},
];

const USPS = [
  "You run the tools — your data never leaves your control. Open source, no lock-in.",
  "The Council assistant maps every finding to the frameworks that bite (NIS2, DORA, CRA, ISO 27001, SOC 2) — not just a scary list.",
  "Remediation guidance you can act on, prioritised by real risk — then re-scan to prove it's fixed.",
  "Every fix signed to Layer 0 — provable evidence for auditors and regulators.",
  "Value back to you and your team — not a five-figure certificate from a governance middleman.",
];

export default function CyberScan() {
  const [findings, setFindings] = useState("");
  const [triage, setTriage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = "Cyber self-scan — test your own systems, open-source, Council-guided | CSOAI"; }, []);

  async function runTriage() {
    const text = findings.trim(); if (!text) return;
    setBusy(true); setTriage(""); chargeSovereign(10);
    try {
      const m = "You are the CSOAI Council security analyst. A CISO pasted raw findings from open-source security scanners. Triage them: (1) rank the top 3 by real risk, (2) for each give a concrete fix, (3) map each to the frameworks it affects (NIS2, DORA, CRA, ISO 27001, SOC 2), (4) end with the single most urgent action. Be concise and practical. Findings:\n" + text.slice(0, 4000);
      const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: m }) });
      if (r.ok) { const d = await r.json(); if (d && d.response && d.model !== "idle" && !/travell?er|companion|walks beside|i'?m sorry|can'?t help|on your journey|dear friend|kindred|as an ai language|remembering/i.test(String(d.response))) setTriage(String(d.response)); }
    } catch (e) {}
    if (!triage) setTriage((t) => t || "Live triage unavailable right now — try again shortly. Your findings stay in your browser.");
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 420px at 50% -10%, rgba(34,211,238,.16), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-9 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-cyan-300/70">CSOAI OS · cyber self-scan</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Scan your own business. <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">The Council assistant fixes it.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80">A CISO-grade stack of reputable open-source tools to test your own cyber — network, web, cloud, containers, code, supply chain. Run them, bring the findings, and the Council assistant triages, maps them to the regulations that bite, and guides the fix. Signed to Layer 0.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((d) => (
            <div key={d.id} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
              <div className="flex items-center gap-2"><span className="text-xl">{d.glyph}</span><span className="font-bold text-cyan-50">{d.label}</span></div>
              <div className="mt-3 space-y-3">
                {d.tools.map((t) => (
                  <div key={t.name} className="rounded-lg border border-emerald-500/10 bg-black/20 p-3">
                    <div className="text-sm font-semibold text-emerald-100">{t.name}</div>
                    <p className="mt-0.5 text-[12px] text-emerald-100/70">{t.what}</p>
                    <code className="mt-1.5 block overflow-x-auto rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-cyan-200/90">{t.run}</code>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/50">{t.maps}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Live Sovereign triage */}
        <div className="mt-8 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-5">
          <div className="text-sm font-bold text-cyan-200">Bring your findings — the Council assistant triages them live</div>
          <div className="mt-3">
            <AISystemNotice route="/scan" />
          </div>
          <p className="mt-1 text-[13px] text-emerald-100/70">Paste raw output from any tool above. The Council assistant ranks by real risk, gives concrete fixes, and maps each to the frameworks it affects. Your findings stay in your browser.</p>
          <textarea value={findings} onChange={(e) => setFindings(e.target.value)} rows={5} placeholder="Paste scanner output here — e.g. Nuclei / Trivy / Prowler / ZAP results…" className="mt-3 w-full resize-none rounded-xl border border-cyan-500/25 bg-black/30 p-3 font-mono text-[12px] text-emerald-50 placeholder-emerald-300/30 focus:border-cyan-400 focus:outline-none" />
          <button onClick={runTriage} disabled={busy} className="mt-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-cyan-400 disabled:opacity-60">{busy ? "Triaging…" : "🛡 Triage & map to frameworks"}</button>
          {triage && <div className="mt-3 whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-[13px] text-emerald-50/90">{triage}</div>}
        </div>

        {/* USPs */}
        <div className="mt-8 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-6">
          <div className="text-center text-sm font-bold text-emerald-100">Why this beats an expensive certificate</div>
          <ul className="mx-auto mt-3 max-w-3xl space-y-2">
            {USPS.map((u, i) => (<li key={i} className="flex items-start gap-2 text-[13px] text-emerald-100/80"><span className="mt-0.5 text-emerald-400">✓</span><span>{u}</span></li>))}
          </ul>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <a href="/regulators" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">See the Regulator Atlas →</a>
            <a href="/system-card" className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-sm font-bold text-amber-100 hover:bg-amber-400/20">Sign a proof →</a>
            <a href="/why" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Why CSOAI vs the rest →</a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-center text-xs text-amber-100/70">
          The Council assistant guides <b className="text-amber-200">your own authorised testing</b> of systems you own or have permission to test. Always scan only what you're authorised to. CSOAI provides tooling guidance and analysis — not a penetration-testing service.
        </div>
      </section>
    </div>
  );
}
