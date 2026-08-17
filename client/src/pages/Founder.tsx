import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Github, Twitter, Linkedin, Globe, Mail, MapPin, ShieldCheck,
  Award, Target, FileCheck, CheckCircle2, ExternalLink
} from "lucide-react";

/**
 * Founder page — Nicholas Templeman.
 * Personal-AEO surface: makes "Nicholas Templeman" resolve as a verified
 * Person entity with consistent facts + sameAs links. Serves /founder.
 * (JEEVES, 2026-08-17 — was a soft-404 SPA catch-all before this page.)
 */

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://councilof.ai/#founder",
  "name": "Nicholas Templeman",
  "url": "https://councilof.ai/founder",
  "jobTitle": "Founder",
  "description":
    "Founder of Council of AI (CSOAI Ltd, UK 16939677) — the independent measurement body for AI behaviour. We measure, we sign, we re-attest; everyone can check. Also founder of MEOK AI Labs, the personal sovereign AI platform.",
  "worksFor": {
    "@type": "Organization",
    "name": "Council of AI",
    "alternateName": "CSOAI LTD",
    "url": "https://councilof.ai",
  },
  "sameAs": [
    "https://github.com/CSOAI-ORG",
    "https://www.producthunt.com/@nick_templeman",
    "https://twitter.com/meok_ai",
    "https://linkedin.com/company/csoai",
    "https://meok.ai/about",
    "https://meok.ai",
  ],
};

const profiles = [
  { name: "GitHub — CSOAI-ORG", href: "https://github.com/CSOAI-ORG", icon: Github, note: "584 public repos, open measurement instruments" },
  { name: "X / Twitter", href: "https://twitter.com/meok_ai", icon: Twitter, note: "@meok_ai" },
  { name: "Product Hunt", href: "https://www.producthunt.com/@nick_templeman", icon: ExternalLink, note: "launches" },
  { name: "LinkedIn — CSOAI", href: "https://linkedin.com/company/csoai", icon: Linkedin, note: "company page" },
  { name: "MEOK AI Labs", href: "https://meok.ai", icon: Globe, note: "the sovereign AI platform" },
];

const facts = [
  { icon: FileCheck, label: "Companies House", value: "CSOAI Ltd · UK 16939677 · director from 2 Jan 2026" },
  { icon: MapPin, label: "Based", value: "London, United Kingdom" },
  { icon: ShieldCheck, label: "What we do", value: "measure, sign, re-attest — everyone can check" },
  { icon: Target, label: "The instrument", value: "13 GSPC axes, Ed25519-signed credentials, UNMEASURED disclosed honestly" },
  { icon: Award, label: "Standards", value: "C2PA Contributor Member · OIN 2.0 · LOT Network" },
  { icon: CheckCircle2, label: "Verify", value: "free, loginless — councilof.ai/verify" },
];

export default function Founder() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-screen bg-[#06140f] text-emerald-50">
      {/* Person JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="mx-auto max-w-4xl px-6 py-20">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-3xl font-black">
            NT
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-400">
            Founder · Council of AI
          </p>
          <h1 className="mt-3 text-4xl font-black">Nicholas Templeman</h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80 leading-relaxed">
            Founder of{" "}
            <Link to="/" className="underline decoration-emerald-500/50 hover:text-emerald-300">
              Council of AI
            </Link>{" "}
            (CSOAI Ltd, UK 16939677) — the independent measurement body for AI
            behaviour — and of{" "}
            <a href="https://meok.ai" className="underline decoration-emerald-500/50 hover:text-emerald-300">
              MEOK AI Labs
            </a>
            , the personal sovereign AI platform. London-based.
          </p>
        </div>

        {/* The thesis */}
        <section className="mb-12 rounded-2xl border border-emerald-500/20 bg-black/30 p-8">
          <h2 className="mb-3 text-xl font-bold text-emerald-300">The thesis</h2>
          <p className="leading-relaxed text-emerald-100/85">
            Every independent AI evaluator got acquired into a platform or a lab —
            the market lost its neutral measuring stick. Council of AI exists to be
            that stick: we run AI systems against frozen, published instruments across
            13 GSPC axes, issue the results as Ed25519-signed measurement credentials,
            and re-measure on a cadence so the evidence stays current. We don't
            certify, don't sell ratings, don't remediate, and take no money from
            anything we rank. UNMEASURED is reported honestly, never hidden.
          </p>
        </section>

        {/* Verified facts */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-bold text-emerald-300">Verified facts</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <f.icon className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">{f.label}</span>
                </div>
                <p className="mt-2 text-sm text-emerald-100/85">{f.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Profiles */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-bold text-emerald-300">Find me</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {profiles.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                <p.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <span>
                  <span className="block text-sm font-semibold text-emerald-50 group-hover:text-emerald-300">
                    {p.name}
                  </span>
                  <span className="block text-xs text-emerald-100/60">{p.note}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* The instrument */}
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-8 text-center">
          <h2 className="text-lg font-bold text-emerald-300">The ruler, not the remedy</h2>
          <p className="mt-2 text-sm text-emerald-100/70">
            We measure. We sign. We re-attest. Everyone can check.{" "}
            <a href="/verify" className="text-emerald-300 underline hover:text-emerald-200">
              Verify a measurement →
            </a>
          </p>
          <p className="mt-4 text-[11px] text-emerald-100/50">
            CSOAI Ltd · UK Companies House 16939677 · 86-90 Paul Street, London EC2A 4NE
          </p>
        </section>
      </div>
    </main>
  );
}
