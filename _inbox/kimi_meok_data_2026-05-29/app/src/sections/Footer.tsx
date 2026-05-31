import { Database, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0a141e] border-t border-[#00788820]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-[#00bca8]" />
              <span className="text-lg font-bold text-[#e2e8f0]">MEOK <span className="text-[#00bca8]">DATA</span></span>
            </div>
            <p className="text-sm text-[#718096] max-w-sm mb-4">
              The proprietary data moat powering sovereign AI infrastructure. Built by MEOK AI Labs in London.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/CSOAI-ORG" target="_blank" rel="noopener noreferrer" className="text-[#718096] hover:text-[#00bca8] transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="mailto:nicholas@meok.ai" className="text-[#718096] hover:text-[#00bca8] transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#e2e8f0] mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="#sources" className="text-sm text-[#718096] hover:text-[#00bca8]">Data Sources</a></li>
              <li><a href="#pricing" className="text-sm text-[#718096] hover:text-[#00bca8]">Pricing</a></li>
              <li><a href="#ecosystem" className="text-sm text-[#718096] hover:text-[#00bca8]">Ecosystem</a></li>
              <li><span className="text-sm text-[#4a5568]">API Docs (soon)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#e2e8f0] mb-3">Company</h4>
            <ul className="space-y-2">
              <li><a href="https://meok.ai" target="_blank" rel="noopener noreferrer" className="text-sm text-[#718096] hover:text-[#00bca8]">MEOK AI Labs</a></li>
              <li><a href="https://councilof.ai" target="_blank" rel="noopener noreferrer" className="text-sm text-[#718096] hover:text-[#00bca8]">Council of AI</a></li>
              <li><span className="text-sm text-[#718096]">London, UK</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#00788815] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#4a5568]">2026 MEOK AI Labs. All rights reserved.</p>
          <p className="text-xs text-[#4a5568]">Sovereign AI tools for everyone.</p>
        </div>
      </div>
    </footer>
  );
}
