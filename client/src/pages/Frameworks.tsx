import { useEffect } from "react";
import { Armchair, ScrollText } from "lucide-react";
import { setMetaDescription } from "@/lib/utils";
import register from "@/data/frameworks.json";

/**
 * /frameworks — the frontier-safety framework presence register (V3-16).
 *
 * A MEASURED PRESENCE list: who among the frontier labs has — and has NOT —
 * published a frontier-safety governance framework, each row sourced to the
 * official document. We measure presence and provenance of published
 * commitments, never their quality. Absence of a published framework is not a
 * finding of unsafe practice.
 *
 * Every row renders from client/src/data/frameworks.json — nothing about a lab
 * is typed into this file. The as_of date in the header comes from the
 * register, not from a string here.
 */

interface PublishedRow {
  lab: string;
  framework: string;
  version: string;
  doc_date: string;
  source: string;
  note?: string;
}
interface EmptyChairRow {
  lab: string;
  method_note: string;
  context?: string;
  source: string;
}
interface FrameworkRegister {
  as_of: string;
  method: string;
  corrections_policy: string;
  cross_confirmation: { fli_index: string; metr_index: string };
  published: PublishedRow[];
  empty_chairs: EmptyChairRow[];
}

const REG = register as unknown as FrameworkRegister;

export default function Frameworks() {
  useEffect(() => {
    document.title = "Frontier-safety frameworks — published presence and empty chairs | Council of AI";
    setMetaDescription(
      "Which frontier AI labs have — and have not — published a frontier-safety governance framework. A measured-presence register: every row sourced to the official document, empty chairs stated with their search method. Presence and provenance, never quality. Measurement, not certification.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          Governance · measured presence
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Who has published a framework.{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            And who has not.
          </span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">{REG.method}</p>
        <p className="mt-2 max-w-3xl text-[13px] text-emerald-100/60">
          Council of AI does <strong>measurement, not certification</strong> — this register grades
          nothing. Register as_of{" "}
          <span className="font-mono text-emerald-200">{REG.as_of}</span>. Cross-confirmed against
          the FLI AI Safety Index (Summer 2026) and the METR safety-policy index. Corrections
          policy: {REG.corrections_policy}.
        </p>

        {/* Published. */}
        <section className="mt-10" data-testid="frameworks-published">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            <ScrollText className="mr-1 inline h-3.5 w-3.5" /> Published
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-emerald-500/20 bg-[#05140d]">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-emerald-500/20 text-left text-[11px] uppercase tracking-wide text-emerald-300/60">
                  <th scope="col" className="p-3">Lab</th>
                  <th scope="col" className="p-3">Framework</th>
                  <th scope="col" className="p-3">Version</th>
                  <th scope="col" className="p-3">Doc date</th>
                  <th scope="col" className="p-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {REG.published.map((r) => (
                  <tr key={r.lab} className="border-b border-emerald-500/10 align-top last:border-0">
                    <td className="p-3 font-semibold text-emerald-100">{r.lab}</td>
                    <td className="p-3 text-emerald-100/80">{r.framework}</td>
                    <td className="p-3 font-mono text-[13px] text-emerald-100/70">{r.version}</td>
                    <td className="p-3 font-mono text-[13px] text-emerald-200">{r.doc_date}</td>
                    <td className="p-3">
                      <a
                        href={r.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-emerald-200 underline"
                      >
                        official document →
                      </a>
                      {r.note && (
                        <span className="mt-1 block text-[12px] text-emerald-100/60">{r.note}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Empty chairs. */}
        <section className="mt-12" data-testid="frameworks-empty-chairs">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-amber-300/70">
            <Armchair className="mr-1 inline h-3.5 w-3.5" /> Empty chairs
          </p>
          <h2 className="mt-2 text-2xl font-black text-emerald-50">
            No published framework found as of {REG.as_of}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-emerald-100/70">
            An empty chair records the outcome of a documented search — nothing more. It is not a
            verdict on any lab&apos;s practice, and it flips the moment a framework is published:
            corrections are appended, never silently edited.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {REG.empty_chairs.map((r) => (
              <div
                key={r.lab}
                className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.05] p-5"
                data-testid={`empty-chair-${r.lab.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <h3 className="text-lg font-black text-amber-100">{r.lab}</h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-amber-200/60">
                  none found
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-amber-100/75">{r.method_note}</p>
                {r.context && (
                  <p className="mt-2 text-[13px] leading-relaxed text-amber-100/75">{r.context}</p>
                )}
                <a
                  href={r.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-[13px] font-semibold text-amber-200 underline"
                >
                  official site →
                </a>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-emerald-100/50">
          Sources are the official document pages linked per row; independent indexes used for
          cross-confirmation: {REG.cross_confirmation.fli_index} · {REG.cross_confirmation.metr_index}.
          This register records publication presence; it is not legal advice, not a conformity
          assessment, and not a ranking of the frameworks&apos; substance.
        </p>
      </div>
    </div>
  );
}
