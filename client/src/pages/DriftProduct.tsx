/**
 * Dated act-level corpus comparisons and the retained signed baseline report.
 * status.json supplies the published run timestamp; a successful fetch does not
 * establish daily operation. Provision counts describe the catalogue, not the
 * granularity of the SHA-256 comparison.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Download,
  Globe2,
  Hash,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InstrumentStatus {
  id: string;
  label: string;
  jurisdiction: string;
  provisions: number;
  status: "unchanged" | "baseline_seeded" | "DRIFT" | "UNKNOWN";
  hash?: string;
}

interface WatchStatus {
  finished_at: string;
  normaliser: string;
  instruments: InstrumentStatus[];
  drift_events: number;
  unknown: number;
  total_provisions: number;
}

/** Static fallback = the measured 2026-08-01 baseline seed. Used only if the
 *  status file is unreachable; the last-run line always says which it is. */
const FALLBACK: WatchStatus = {
  finished_at: "2026-08-01T13:27:21+00:00",
  normaliser: "norm-v2",
  instruments: [
    {
      id: "EU-AI-ACT",
      label: "EU AI Act (Regulation (EU) 2024/1689)",
      jurisdiction: "EU",
      provisions: 113,
      status: "baseline_seeded",
    },
    {
      id: "EU-CRA",
      label: "EU Cyber Resilience Act (Regulation (EU) 2024/2847)",
      jurisdiction: "EU",
      provisions: 71,
      status: "baseline_seeded",
    },
    {
      id: "EU-DORA",
      label: "DORA (Regulation (EU) 2022/2554)",
      jurisdiction: "EU",
      provisions: 68,
      status: "baseline_seeded",
    },
    {
      id: "EU-NIS2",
      label: "NIS2 Directive ((EU) 2022/2555)",
      jurisdiction: "EU",
      provisions: 48,
      status: "baseline_seeded",
    },
    {
      id: "UK-GDPR",
      label: "UK GDPR (retained Regulation (EU) 2016/679)",
      jurisdiction: "UK",
      provisions: 99,
      status: "baseline_seeded",
    },
  ],
  drift_events: 0,
  unknown: 0,
  total_provisions: 399,
};

const STATUS_TONE: Record<
  string,
  { badge: string; row: string; label: string }
> = {
  unchanged: {
    badge: "bg-emerald-200 text-emerald-800",
    row: "bg-emerald-50 border-emerald-200",
    label: "UNCHANGED IN RECORD",
  },
  baseline_seeded: {
    badge: "bg-emerald-200 text-emerald-800",
    row: "bg-emerald-50 border-emerald-200",
    label: "BASELINE SEEDED",
  },
  DRIFT: {
    badge: "bg-red-200 text-red-800",
    row: "bg-red-50 border-red-200",
    label: "DRIFT",
  },
  UNKNOWN: {
    badge: "bg-amber-200 text-amber-800",
    row: "bg-amber-50 border-amber-200",
    label: "UNKNOWN",
  },
};

export default function DriftProduct() {
  const [status, setStatus] = useState<WatchStatus>(FALLBACK);
  const [live, setLive] = useState(false);

  useEffect(() => {
    fetch("/corpus-watch/status.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((s: WatchStatus) => {
        setStatus(s);
        setLive(true);
      })
      .catch(() => {
        /* honest fallback: the measured 2026-08-01 baseline */
      });
  }, []);

  const stable = status.instruments.filter(
    (i) => i.status === "unchanged" || i.status === "baseline_seeded",
  ).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 py-16 md:py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Corpus changes · dated records and a signed baseline
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Has the source text behind your evidence{" "}
              <span className="text-amber-400">changed</span>?
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Compare dated, normalised act-level text for the EU AI Act, EU
              CRA, DORA, NIS2 and UK GDPR. A changed hash identifies source
              material to review. The catalogue lists
              <span className="text-emerald-400 font-semibold">
                {" "}
                {status.total_provisions} provisions
              </span>
              ; the comparison operates on each act as a whole, not on each
              provision.
            </p>

            {/* Live status — the watcher's own heartbeat */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {status.total_provisions}
                  </div>
                  <div className="text-xs text-gray-500">
                    catalogued provisions
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400">
                    {status.drift_events}
                  </div>
                  <div className="text-xs text-gray-500">
                    events in this record
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {stable}/{status.instruments.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    baseline or unchanged
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[10px] text-gray-500 font-mono">
                published run: {new Date(status.finished_at).toLocaleString()} ·
                normaliser {status.normaliser}
                {status.unknown > 0 && (
                  <span className="text-amber-400">
                    {" "}
                    · {status.unknown} instrument(s) UNKNOWN (fetch failed — not
                    "stable")
                  </span>
                )}
                {!live && (
                  <span> · cached baseline; published status not loaded</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The REAL signed report */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-emerald-200">
              Signed baseline report · 2026-08-01
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Inspect the retained baseline
            </h2>
            <p className="text-gray-600">
              Download the dated Markdown report, its Ed25519 signature and the
              public key. The baseline is a historical record; it does not
              establish the source text's current state.
            </p>
          </div>

          <Card className="border-2 border-emerald-200 bg-white">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2 bg-emerald-100 text-emerald-700 border-emerald-300">
                    BASELINE REPORT
                  </Badge>
                  <h3 className="text-xl font-bold text-gray-900">
                    Corpus-Watch Delta Report — 2026-08-01
                  </h3>
                </div>
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  The 1 August 2026 report records baseline seeding for five
                  instruments using EUR-Lex CELLAR and legislation.gov.uk.
                  Interpret its findings within that recorded window; later
                  comparisons need their own dated evidence.
                </p>
                <p className="text-xs text-gray-500">
                  Detection is a SHA-256 compare over the normalised
                  consolidated text of each act (act-level — the honest coarse
                  signal; provision-level slicing is a later refinement).
                </p>
                <div className="pt-3 border-t border-gray-200 space-y-1">
                  <p className="text-xs text-gray-500 font-mono flex items-center gap-1 break-all">
                    <Hash className="h-3 w-3 shrink-0" />
                    sha256:
                    88349502f5d5878a862a5dd3bdbdf1a95dae6b0b92bb1b039bfd49e915fbe0fd
                  </p>
                  <p className="text-xs text-gray-500 font-mono break-all">
                    Ed25519 pubkey:
                    6bb1a649666d7b8bcf976509ed213db4084bebdb7fdf0a45f75068499b5f4e0e
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a href="/corpus-watch/delta-report-2026-08-01.md" download>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Report (.md)
                    </Button>
                  </a>
                  <a
                    href="/corpus-watch/delta-report-2026-08-01.md.sig"
                    download
                  >
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Signature (.sig)
                    </Button>
                  </a>
                  <a href="/corpus-watch/corpus-watch-ed25519.pub" download>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Public key
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Published corpus status — the honest one */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-emerald-200">
              Published corpus status
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Read the date alongside the result
            </h2>
            <p className="text-gray-600">
              Published run: {new Date(status.finished_at).toLocaleString()}.
              Reading this file does not establish a daily monitoring service.
            </p>
          </div>

          <div className="space-y-3">
            {status.instruments.map((inst, i) => {
              const tone = STATUS_TONE[inst.status] ?? STATUS_TONE.UNKNOWN;
              return (
                <motion.div
                  key={inst.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-lg border ${tone.row}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${tone.badge}`}
                        >
                          {tone.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {inst.jurisdiction}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {inst.label} — {inst.provisions} catalogued provisions.
                        {inst.status === "UNKNOWN" &&
                          " Last fetch failed; recorded UNKNOWN, not 'stable'."}
                        {inst.status === "DRIFT" &&
                          " Act-level change detected — evidence citing this instrument needs review."}
                      </p>
                    </div>
                    {inst.hash && (
                      <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
                        {inst.hash.slice(0, 12)}…
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {status.drift_events === 0 && (
            <p className="mt-6 text-center text-sm text-gray-500">
              This published record contains zero drift events. That observation
              applies to its recorded window; it does not establish that no
              later legal or textual change occurred.
            </p>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Drift Audit
            </h2>
            <p className="text-gray-600">
              Discuss a dated comparison, its source coverage and the evidence
              you need to review.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              // No published price. Doctrine: verification is free forever and a grade is
              // never sold, so no public surface carries a number anyone pays us. Scope is
              // what a reader actually needs to choose; the figure is quoted privately.
              {
                tier: "Single regulation",
                scope: "1 instrument (e.g. EU AI Act)",
                probes: "Agreed cadence",
                reports: "Delta reports only",
                featured: false,
              },
              {
                tier: "Multi-jurisdiction",
                scope: "Up to 5 instruments",
                probes: "Agreed cadence",
                reports: "Delta + quarterly summary",
                featured: true,
              },
              {
                tier: "Estate-wide",
                scope: "All watched instruments",
                probes: "Agreed cadence",
                reports: "Delta + summary + evidence review",
                featured: false,
              },
            ].map((p) => (
              <Card
                key={p.tier}
                className={`relative ${p.featured ? "border-2 border-emerald-400 bg-emerald-50/30" : ""}`}
              >
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-gray-900 mb-1">{p.tier}</h3>
                  <div className="text-sm text-gray-600 mb-1 mt-3">
                    {p.scope}
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    {p.probes} probes · {p.reports}
                  </div>
                  <Link href="/contact?subject=drift-audit">
                    <Button
                      className="w-full"
                      variant={p.featured ? "default" : "outline"}
                    >
                      Request audit
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-500">
            These are proposed engagement scopes. Agree source access, cadence,
            delivery capacity and acceptance before work starts. The published
            comparison is act-level; provision-level slicing is a planned
            refinement.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <Globe2 className="h-12 w-12 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Keep the sources behind your evidence <br />
            ready for review.
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Start with the downloadable baseline and a defined source-change
            question. A text comparison supports review; it does not determine
            legal compliance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?subject=drift-audit">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-gray-100 px-8 py-6 text-lg font-bold rounded-xl"
              >
                Request drift audit
              </Button>
            </Link>
            <a href="/corpus-watch/delta-report-2026-08-01.md" download>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl"
              >
                <Download className="mr-2 h-5 w-5" />
                Download the signed report
              </Button>
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-emerald-100/70 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Act-level comparison; provision-level slicing remains planned.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
