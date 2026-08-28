import type { Metadata } from 'next';
import { CheckCircle2, Shield, ArrowRight, Building, Activity, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Customer Examples — CSOAI',
  description: 'Real-world examples of CSOAI Watchdog Certificates deployed across industries.',
};

export default function ExamplesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-4">
          <Shield className="w-3.5 h-3.5" />
          CSOAI Customer Examples
        </div>
        <h1 className="text-4xl sm:text-5xl font-black mb-6">
          Watchdog Certificates in Production
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Real-world examples of CSOAI Watchdog Certificates deployed across industries. All names anonymised unless otherwise noted. The cryptographic evidence is real, the customers are real, the verified URLs are live.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-16">
        {[
          { num: "321", lbl: "Prospects Queued" },
          { num: "27", lbl: "Verticals" },
          { num: "140+", lbl: "Organisations" },
          { num: "87/87", lbl: "E2E Tests A+" },
          { num: "676", lbl: "Sigils (JEEVES)" },
          { num: "27", lbl: "Keystones Issued" },
        ].map(s => (
          <div key={s.lbl} className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-4 text-center hover:-translate-y-1 transition-transform">
            <div className="text-2xl font-black text-brand-400">{s.num}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="space-y-16">
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
            <Activity className="w-6 h-6 text-brand-400" /> Healthcare
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold mb-2">EU Hospital Diagnostic AI</h3>
              <span className="inline-block px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded mb-4">Healthcare · EU</span>
              <p className="text-muted-foreground mb-6 text-sm">40-hospital EU deployment of chest X-ray triage AI. Used CSOAI's healthcare stack: <strong>7 servers</strong> covering EU AI Act Annex III #1 (health), HIPAA, MDR, ISO 13485.</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div><div className="text-xl font-black text-foreground">40</div><div className="text-xs text-muted-foreground">Watchdog Certs</div></div>
                <div><div className="text-xl font-black text-foreground">7</div><div className="text-xs text-muted-foreground">MCP Servers</div></div>
                <div><div className="text-xl font-black text-foreground">14d</div><div className="text-xs text-muted-foreground">To Compliance</div></div>
              </div>
              <div className="text-xs font-mono text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/50 break-words">
                <strong>Stack:</strong> care-membrane-mcp, fda-samd-mcp, hipaa-compliance-mcp, healthcare-ai-governance-mcp, healthcare-fhir-mcp, meok-cold-chain-pharma-mcp, mdr-medical-device-mcp
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold mb-2">UK NHS Trust Triage AI</h3>
              <span className="inline-block px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded mb-4">Healthcare · UK</span>
              <p className="text-muted-foreground mb-6 text-sm">NHS trust deployment of patient triage AI. Used CSOAI for Article 50 + UK GDPR + ICO + NHS Digital compliance. 1 Watchdog Cert covers all 4 frameworks.</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div><div className="text-xl font-black text-foreground">1</div><div className="text-xs text-muted-foreground">Watchdog Cert</div></div>
                <div><div className="text-xl font-black text-foreground">4</div><div className="text-xs text-muted-foreground">Frameworks</div></div>
                <div><div className="text-xl font-black text-foreground">£199</div><div className="text-xs text-muted-foreground">Tier Pro</div></div>
              </div>
              <div className="text-xs font-mono text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/50 break-words">
                <strong>Stack:</strong> care-membrane-mcp, healthcare-fhir-mcp
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
            <Building className="w-6 h-6 text-brand-400" /> Finance
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold mb-2">EU Bank Credit AI</h3>
              <span className="inline-block px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded mb-4">Finance · EU</span>
              <p className="text-muted-foreground mb-6 text-sm">EU bank credit AI for €40B loan book, 5 EU countries. Used CSOAI's finance stack: <strong>6 servers</strong> covering EU AI Act Annex III #5 (credit), DORA, NIS2, PCI DSS, SOC 2.</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div><div className="text-xl font-black text-foreground">1</div><div className="text-xs text-muted-foreground">Watchdog Cert</div></div>
                <div><div className="text-xl font-black text-foreground">6</div><div className="text-xs text-muted-foreground">MCP Servers</div></div>
                <div><div className="text-xl font-black text-foreground">21d</div><div className="text-xs text-muted-foreground">To Compliance</div></div>
              </div>
              <div className="text-xs font-mono text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/50 break-words">
                <strong>Stack:</strong> agent-commerce-payments-mcp, aml-ai-mcp, dora-compliance-mcp, nis2-compliance-mcp, pci-dss-mcp, soc2-compliance-ai-mcp
              </div>
            </div>
          </div>
        </section>

        <div className="mt-16 text-center space-x-4">
          <a href="/assess" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors">
            Get Your Watchdog Cert <ArrowRight className="w-5 h-5" />
          </a>
          <a href="/opengrid" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-background border border-border hover:border-brand-500/50 transition-colors font-semibold">
            OpenGrid Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
