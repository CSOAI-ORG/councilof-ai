"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div className="flex flex-col gap-4 md:items-start">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 text-[10px] font-bold text-slate-950">
                0
              </div>
              <span className="text-xl font-bold tracking-tight">CSOAI</span>
            </div>
            <p className="max-w-xs text-sm text-slate-500">
              The sovereign foundation for the agentic economy. CSOAI LTD (UK Companies House 16939677).
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-8">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Product</span>
              <Link href="/pricing" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Pricing
              </Link>
              <Link href="/article-50-kit" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Article 50 Kit
              </Link>
              <Link href="/mcp-packs" className="text-sm text-slate-300 transition hover:text-emerald-400">
                MCP Packs
              </Link>
              <Link href="/hives" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Hive Starter Packs
              </Link>
              <Link href="/switch" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Switch to CSOAI
              </Link>
              <Link href="/transfer" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Transfer
              </Link>
              <Link href="/os" className="text-sm text-slate-300 transition hover:text-emerald-400">
                CSOAI OS
              </Link>
              <Link href="/town" className="text-sm text-slate-300 transition hover:text-emerald-400">
                47-Agent Town
              </Link>
              <Link href="/simulation" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Live Simulation
              </Link>
              <Link href="/kimi-bridge" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Kimi Bridge
              </Link>
              <Link href="/verify" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Verify
              </Link>
              <Link href="/compare" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Compare
              </Link>
              <Link href="/watchdog-sample" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Sample Certificate
              </Link>
              <Link href="/article-50-calculator" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Article 50 Calculator
              </Link>
              <Link href="/mcp-security-audit" className="text-sm text-slate-300 transition hover:text-emerald-400">
                MCP Security Audit
              </Link>
              <Link href="/connect" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Connectors
              </Link>
              <Link href="/case-studies" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Case Studies
              </Link>
              <Link href="/council-of-experts" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Council of Experts
              </Link>
              <Link href="/github-action" className="text-sm text-slate-300 transition hover:text-emerald-400">
                GitHub Action
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Council</span>
              <Link href="/council" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Overview
              </Link>
              <Link href="/council/dome" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Dome
              </Link>
              <Link href="/council/maps" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Maps
              </Link>
              <Link href="/council/compliance" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Compliance
              </Link>
              <Link href="/council/law" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Law
              </Link>
              <Link href="/council/sigil" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Sigil
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resources</span>
              <Link href="/guides" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Guides
              </Link>
              <Link href="/faq" className="text-sm text-slate-300 transition hover:text-emerald-400">
                FAQ
              </Link>
              <Link href="/data-catalog" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Data Catalog
              </Link>
              <Link href="/glossary" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Glossary
              </Link>
              <Link href="/api-docs" className="text-sm text-slate-300 transition hover:text-emerald-400">
                API Docs
              </Link>
              <Link href="/trust" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Trust Center
              </Link>
              <Link href="/intelligence" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Intelligence
              </Link>
              <Link href="/personas" className="text-sm text-slate-300 transition hover:text-emerald-400">
                For AI Leaders
              </Link>
              <Link href="/dora" className="text-sm text-slate-300 transition hover:text-emerald-400">
                DORA
              </Link>
              <Link href="/nis2" className="text-sm text-slate-300 transition hover:text-emerald-400">
                NIS2
              </Link>
              <Link href="/eidas2" className="text-sm text-slate-300 transition hover:text-emerald-400">
                eIDAS 2.0
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Legal</span>
              <Link href="/privacy" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Terms
              </Link>
              <Link href="/cookies" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Cookies
              </Link>
              <Link href="/.well-known/security.txt" className="text-sm text-slate-300 transition hover:text-emerald-400">
                Security
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Community</span>
              <a
                href="https://github.com/CSOAI-ORG"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-300 transition hover:text-emerald-400"
              >
                GitHub
              </a>
              <a
                href="https://councilof.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-300 transition hover:text-emerald-400"
              >
                CouncilOf.AI ↗
              </a>
              <a
                href="https://meok.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-300 transition hover:text-emerald-400"
              >
                MEOK AI ↗
              </a>
              <a
                href="mailto:nicholas@csoai.org"
                className="text-sm text-slate-300 transition hover:text-emerald-400"
              >
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-slate-600 sm:flex-row">
          <p>© {new Date().getFullYear()} CSOAI LTD. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/trust" className="transition hover:text-slate-400">
              Trust
            </Link>
            <Link href="/status" className="transition hover:text-slate-400">
              Status
            </Link>
            <Link href="/privacy" className="transition hover:text-slate-400">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-400">
              Terms
            </Link>
            <Link href="/cookies" className="transition hover:text-slate-400">
              Cookies
            </Link>
            <Link href="/.well-known/security.txt" className="transition hover:text-slate-400">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
