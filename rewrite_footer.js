const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');

const newFooter = `function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Platform & Tools</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="/os" className="block hover:text-brand-400">Council OS Cockpit</a>
              <a href="/assess" className="block hover:text-brand-400">AI Readiness Assessment</a>
              <a href="/verify" className="block hover:text-brand-400">Card Cryptographic Verifier</a>
              <a href="/catalogue" className="block hover:text-brand-400">Agent Catalogue</a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Verified Ecosystem</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="https://github.com/CSOAI-ORG" target="_blank" rel="noopener noreferrer" className="block hover:text-brand-400">GitHub · CSOAI-ORG ↗</a>
              <a href="https://huggingface.co/csoai" target="_blank" rel="noopener noreferrer" className="block hover:text-brand-400">Hugging Face · csoai ↗</a>
              <a href="https://pypi.org/project/inspect-signed-receipt/" target="_blank" rel="noopener noreferrer" className="block hover:text-brand-400">PyPI · inspect-signed-receipt ↗</a>
              <a href="https://doi.org/10.5281/zenodo.21991104" target="_blank" rel="noopener noreferrer" className="block hover:text-brand-400">Zenodo DOI 10.5281 ↗</a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Legal & Governance</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="/legal" className="block hover:text-brand-400">Open Attestation Terms</a>
              <a href="/privacy" className="block hover:text-brand-400">Privacy Policy</a>
              <div className="pt-2 text-[11px] text-muted-foreground/80">
                CSOAI Ltd (GB) &bull; Companies House #16939677
              </div>
            </div>
          </div>
        </div>

        {/* Framework Logos Row */}
        <div className="pt-8 border-t border-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 text-center">Measured Frameworks</h4>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 opacity-80 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-sm text-foreground">EU AI Act</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-sm text-foreground">NIST AI RMF</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              <span className="font-bold text-sm text-foreground">ISO 42001</span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="w-6 h-6 text-amber-600" />
              <span className="font-bold text-sm text-foreground">DORA</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6 text-rose-600" />
              <span className="font-bold text-sm text-foreground">NIS2</span>
            </div>
          </div>
        </div>

        {/* Standards & Memberships Bar */}
        <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-foreground">Participating Standards:</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">C2PA Contributor</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Open Invention Network</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">DIF Identity Foundation</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border">Linux Foundation Project</span>
          </div>
          <div className="text-[11px]">
            &copy; 2026 CouncilOf.AI &bull; Measurement, not certification. All signatures Ed25519 verified.
          </div>
        </div>
      </div>
    </footer>
  );
}`;

content = content.replace(/function Footer\(\) \{[\s\S]*?\}\n/g, newFooter + "\n");
fs.writeFileSync('src/app/layout.tsx', content);
