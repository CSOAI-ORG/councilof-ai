import { useEffect } from "react";
import { Link } from "wouter";

/**
 * /founder — Nicholas Templeman, founder of Council of AI.
 * Boring, indexable, named. Personal brand is the person, not a remediation arm.
 */

export default function Founder() {
  useEffect(() => {
    document.title = "Nicholas Templeman — Founder, Council of AI | CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-3xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Founder
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            Nicholas Templeman
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">
        {/* 150-WORD BIO */}
        <section className="space-y-5 text-[15px] text-emerald-100/85 leading-relaxed">
          <p>
            Nicholas Templeman is the founder of Council of AI (CSOAI Ltd, UK 16939677). The Council is an independent AI-behaviour measurement body. It measures, signs, and re-attests. It does not certify systems, does not remediate them, and does not sell ratings. Verify stays free.
          </p>
          <p>
            He is a director of CSOAI Ltd from 2 January 2026, recorded on Companies House as Nicholas Brian George Templeman. The public measurement stack is GSPC: fifteen slots, of which thirteen are live API axes, plus a jail floor and one unnamed fifteenth. The 12 August 2026 stamp ran thirteen axes on nineteen models and 819 items, and is unsigned. The jail floor went live 13 August.
          </p>
          <p>
            The personal brand is the person: a measurement SME, not a remediation arm of the company.
          </p>
        </section>

        {/* CONTACT */}
        <section className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-5">
          <h2 className="text-lg font-bold text-emerald-50 mb-4">Contact</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <dt className="text-emerald-100/50">Email</dt>
              <dd className="mt-1">
                <a href="mailto:nicholas@csoai.org" className="text-emerald-300 hover:text-emerald-200 transition-colors">
                  nicholas@csoai.org
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-emerald-100/50">X</dt>
              <dd className="mt-1">
                <a href="https://x.com/meok_ai" target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:text-emerald-200 transition-colors">
                  @meok_ai
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-emerald-100/50">Sites</dt>
              <dd className="mt-1 text-emerald-50">
                <a href="https://councilof.ai" className="text-emerald-300 hover:text-emerald-200 transition-colors">councilof.ai</a>
                {" · "}
                <a href="https://csoai.org" className="text-emerald-300 hover:text-emerald-200 transition-colors">csoai.org</a>
              </dd>
            </div>
            <div>
              <dt className="text-emerald-100/50">GitHub</dt>
              <dd className="mt-1">
                <a href="https://github.com/CSOAI-ORG" target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:text-emerald-200 transition-colors">
                  CSOAI-ORG
                </a>
              </dd>
            </div>
          </dl>
        </section>

        {/* LINKS */}
        <div className="flex flex-wrap gap-4 pb-4 text-[13px]">
          <Link href="/about" className="text-emerald-300 hover:text-emerald-200 transition-colors">
            About Council of AI →
          </Link>
          <Link href="/gspc-scoreboard" className="text-emerald-300 hover:text-emerald-200 transition-colors">
            View the scoreboard →
          </Link>
          <Link href="/gspc-verify" className="text-emerald-300 hover:text-emerald-200 transition-colors">
            Verify a card →
          </Link>
        </div>
      </div>
    </div>
  );
}
