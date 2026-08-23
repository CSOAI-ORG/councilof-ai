import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

const PHASES = [
  {
    name: "Standards",
    range: "1–20",
    moves: [
      { n: 1, label: "RECEIPT-SPEC-0.1", done: true, href: "/receipt-spec" },
      { n: 2, label: "JSON Schema published", done: true, href: "/.well-known/schemas/agent-measurement-card.schema.json" },
      { n: 4, label: "/receipt-spec page", done: true, href: "/receipt-spec" },
      { n: 13, label: "Axis 18 bond crossing API", done: true, href: "/api/finance/bond-crossing" },
      { n: 6, label: "IETF SCITT submission", done: false },
    ],
  },
  {
    name: "Domain",
    range: "21–40",
    moves: [
      { n: 21, label: "Engine Axis", done: true, href: "/engine-axis" },
      { n: 24, label: "Eunomia Router", done: true, href: "/instruments" },
      { n: 28, label: "Insurer evidence", done: true, href: "/insurers" },
    ],
  },
  {
    name: "Data",
    range: "41–60",
    moves: [
      { n: 41, label: "GSPC live board", done: true, href: "/api/gspc" },
      { n: 43, label: "Corrections ledger", done: true, href: "/api/corrections" },
    ],
  },
  {
    name: "Trust",
    range: "61–80",
    moves: [
      { n: 62, label: "Verify walk", done: true, href: "/verify-walk.md" },
      { n: 80, label: "DSH = Council OS", done: true, href: "/dashboard" },
    ],
  },
  {
    name: "Distribution",
    range: "81–100",
    moves: [
      { n: 81, label: "Launch post", done: true, href: "/blog/receipt-spec-0-1" },
      { n: 85, label: "Agent runbook", done: true, href: "/agent-runbook" },
      { n: 91, label: "Social launch thread", done: false },
    ],
  },
];

export default function OwnershipPlan() {
  return (
    <div className="min-h-screen bg-[#04070d] text-slate-200">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Badge className="mb-4 border-emerald-500/40 text-emerald-300">SovOS · Ownership</Badge>
        <h1 className="text-3xl font-bold text-white">100 moves — years to days</h1>
        <p className="mt-4 text-slate-400 max-w-2xl">
          Standards + distribution close the two remaining levers. You already own the trust anchor, regulatory
          hook, and data moat. This plan maps every move to the live estate.
        </p>
        <a
          href="/docs/SOVOS/OWNERSHIP-100-MOVES-2026-08-23.md"
          className="mt-4 inline-block text-sm text-emerald-400 hover:underline"
        >
          Download full plan (markdown)
        </a>

        <div className="mt-10 space-y-8">
          {PHASES.map((phase) => (
            <section key={phase.name}>
              <h2 className="text-lg font-semibold text-white mb-3">
                Phase — {phase.name}{" "}
                <span className="text-slate-500 font-normal">(moves {phase.range})</span>
              </h2>
              <ul className="space-y-2">
                {phase.moves.map((m) => (
                  <li
                    key={m.n}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
                  >
                    {m.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                    )}
                    <span className="font-mono text-xs text-slate-500">#{m.n}</span>
                    {m.href ? (
                      <Link href={m.href} className="text-emerald-300 hover:underline">
                        {m.label}
                      </Link>
                    ) : (
                      <span className="text-slate-300">{m.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
