/**
 * GSPC vs AILuminate — /gspc-vs-ailuminate (alias /ailuminate)
 * Style: dark emerald (match McpTrustBoard / AttestationNetwork)
 *
 * Positioning: "AILuminate for chat. GSPC for everything else."
 *
 * LOCKS (twoSpeed `ailuminate` pin + playbookAudit `ailuminate-bind`):
 * - AILuminate is an attachment, NEVER a 23rd axis (ADR-001: the board is 22).
 * - Importer never writes MEASURED; never a fused GSPC+AILuminate grade.
 * - AILuminate facts are third-party, cited (v1.1, 11 Feb 2025, arXiv
 *   2503.05731 v2). Honest where they are deeper.
 * - Board facts link to GET /api/gspc — no typed live counts here.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

type Row = { dim: string; ailuminate: string; gspc: string };

const ROWS: Row[] = [
  {
    dim: "What it measures",
    ailuminate: "Chat-style hazard response — one conversational surface",
    gspc: "22 axes across two families: 14 behavioural (governance, safety, provenance, continuity, conformance, openness, machinery, care, cross-reality, detector-interop, art5-safeguard, swarm, affect, jail) + 8 financial/domain",
  },
  {
    dim: "What a result is",
    ailuminate: "A 5-tier grade (Poor … Excellent) per hazard category",
    gspc: "A measurement: n, accuracy, Wilson interval, a leader, a separation verdict — or an honestly empty UNMEASURED cell",
  },
  {
    dim: "Reference baseline",
    ailuminate: "Relative to a floating reference model — a grade is not comparable across time",
    gspc: "Frozen banks, pinned datasets, replayable runs — a number today can be checked against itself tomorrow",
  },
  {
    dim: "Prompt sets",
    ailuminate: "Practice set + confidential official set with rotating reserve prompts (the right anti-Goodhart shape)",
    gspc: "Published frozen banks + held-out practice discipline; the same doctrine, applied beyond chat",
  },
  {
    dim: "Reach",
    ailuminate: "12 hazard categories (14 codes) of chat risk",
    gspc: "Behavioural + financial + regulatory + provenance surfaces a chat benchmark does not reach — reserve attestation, custody disclosure, distribution integrity among them",
  },
  {
    dim: "Output you can verify",
    ailuminate: "A grade reported by the framework",
    gspc: "A signed card, content-addressed, included in a public Merkle root — verification is free forever",
  },
];

const DEEPER: string[] = [
  "Chat-hazard granularity: 12 categories with per-category practice prompts are deeper on the chat surface than any single GSPC axis tries to be.",
  "Set governance: the practice/official split with a monitored reserve is the anti-Goodhart template the estate's own holdout doctrine copies.",
  "Institutional weight: MLCommons membership gives AILuminate adoption a chat benchmark earns and GSPC does not claim.",
];

const CATEGORIES: { code: string; label: string; nearest: string | null }[] = [
  { code: "vcr", label: "violent crimes", nearest: "safety" },
  { code: "ncr", label: "non-violent crimes", nearest: "safety" },
  { code: "src", label: "sex-related crimes", nearest: "safety" },
  { code: "cse", label: "child sexual exploitation", nearest: "safety" },
  { code: "ssh", label: "suicide & self-harm", nearest: "safety" },
  { code: "iwp", label: "indiscriminate weapons", nearest: "safety" },
  { code: "ipv", label: "intellectual-property violations", nearest: null },
  { code: "dfm", label: "defamation", nearest: null },
  { code: "hte", label: "hate", nearest: "safety" },
  { code: "prv", label: "privacy", nearest: null },
  { code: "spc_ele / spc_fin / spc_hlt", label: "specialised advice", nearest: null },
  { code: "sxc_prn", label: "sexual content", nearest: "safety" },
];

export default function GspcVsAiluminate() {
  useEffect(() => {
    document.title = "GSPC vs AILuminate — AILuminate for chat, GSPC for everything else | Council of AI";
    setMetaDescription(
      "An honest breadth comparison: AILuminate measures chat-style hazard; GSPC measures 22 axes including financial, regulatory and provenance. Attachment, never a fused grade.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] px-4 py-14 text-slate-200">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400">
          Measurement, never certification
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-50">
          AILuminate for chat. <span className="text-emerald-300">GSPC for everything else.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          AILuminate (MLCommons AI Safety v1.1, 11 Feb 2025, arXiv 2503.05731) is the
          industry&apos;s chat-hazard benchmark, and a good one. GSPC is a 22-axis
          measurement board. They are not rivals — one is an attachment to the other.
          This page says exactly where each is strong, and exactly how results from
          the first may ride on the second without ever pretending to be it.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Dimension</th>
                <th className="px-4 py-3">AILuminate v1.1</th>
                <th className="px-4 py-3">GSPC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ROWS.map((r) => (
                <tr key={r.dim} className="align-top">
                  <td className="px-4 py-3 font-semibold text-slate-200">{r.dim}</td>
                  <td className="px-4 py-3 text-slate-400">{r.ailuminate}</td>
                  <td className="px-4 py-3 text-slate-300">{r.gspc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
            Where AILuminate is deeper — said out loud
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
            {DEEPER.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
            The 12 hazard categories (14 codes) — nearest GSPC axis, RELATED never equivalent
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <div key={c.code} className="rounded-lg border border-slate-800 px-3 py-2 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <code className="text-emerald-300">{c.code}</code>
                  <span className={c.nearest ? "text-slate-400" : "text-slate-600 italic"}>
                    {c.nearest ?? "no GSPC axis"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">{c.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            8 of 14 codes sit in the harmful-request family our <em>safety</em> axis measures
            (calibrated refusal on paired requests) — a RELATED-TO join, with the caveat that
            refusal calibration is not a per-hazard verdict. The other 6 codes (ipv, dfm, prv,
            spc_ele/fin/hlt) have no GSPC axis that measures the same quantity — IP regurgitation,
            defamation, privacy leakage and advice quality are not refusal calibration — so no join
            is drawn and the gap stays visible. An earlier draft of this table (never shipped)
            joined all 14; review held several joins indefensible, and the deletions are the fix.
            A grade relative to a floating reference model is in any case not comparable across
            time, so grade→measurement mapping stays dishonest and undone.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-400">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
            The importer doctrine — bind it, do not become it
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>An AILuminate result imports as an <strong>ATTACHED</strong> evidence record on the
              safety axis&apos;s trail — never <strong>MEASURED</strong>, never a 23rd axis, never a
              fused GSPC+AILuminate grade.</li>
            <li>Grades are recorded as the framework asserted them, with the floating-baseline
              caveat carried inside the record.</li>
            <li>Only the GHA publisher signs; the importer emits unsigned queue artefacts.</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-4">
            <a href="https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/interop/AILUMINATE-IMPORTER-SPEC.md"
               className="text-emerald-300 underline-offset-2 hover:underline">
              Importer spec v0.1
            </a>
            <a href="/api/gspc" className="text-emerald-300 underline-offset-2 hover:underline">
              GET /api/gspc — the living board
            </a>
            <Link href="/board" className="text-emerald-300 underline-offset-2 hover:underline">
              The 22-axis board
            </Link>
            <Link href="/methodology" className="text-emerald-300 underline-offset-2 hover:underline">
              Methodology
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
