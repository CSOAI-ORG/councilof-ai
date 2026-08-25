import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /financial-axes — the 8 financial/domain axes of the 22-axis canon, honestly displayed.
 *
 * Half the canon was invisible: the 8 financial axes 404'd at /gspc/<axis> and were absent
 * from the board. This page reads /interop/financial-axes.json (the three-state grammar for
 * all 8) and /interop/financial-measure-run.json (the MEASURED on-chain control facts for
 * provenance-controls) and renders each axis with its real status — MEASURED or UNMEASURED —
 * never a number that is not in the JSON.
 *
 * Rule: provenance-controls is MEASURED (6 instruments, deterministic on-chain control facts,
 * signed run — the devnet txs are linked from the measure-run). The other 7 are UNMEASURED
 * with their rubric and (for the 3 candidates) their honest bank status. UNMEASURED is
 * reported, never hidden, never claimed as built.
 */

interface FinAxis {
  id: string;
  name: string;
  status: string;
  rubric?: string;
  measured_count?: number;
  surface?: string;
  risk_verdict?: string;
  data?: string;
  candidate?: boolean;
  bank_status?: string;
  declared_as?: string;
  note?: string;
}

interface MeasuredInstrument {
  instrument: string;
  mainnet_issuer: string;
  control_facts: {
    status: string;
    as_of: string;
    facts: Record<string, boolean>;
    domain?: string;
  };
  risk_verdict_status: string;
  devnet_tx: string;
  explorer: string;
}

const STATUS_CHIP: Record<string, string> = {
  MEASURED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  UNMEASURED: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function FinancialAxes() {
  const [axes, setAxes] = useState<FinAxis[] | null>(null);
  const [axesNote, setAxesNote] = useState<string>("");
  const [honesty, setHonesty] = useState<string>("");
  const [run, setRun] = useState<{ measured: MeasuredInstrument[]; network?: string; honesty?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Financial axes — the 8 financial slots of the 22-axis canon | Council of AI";
    setMetaDescription(
      "The 8 financial/domain axes of the 22-axis canon, honestly displayed. Provenance-controls is MEASURED (6 instruments, deterministic on-chain control facts, signed). The other 7 are UNMEASURED — rubric declared, never claimed as built.",
    );
    Promise.all([
      fetch("/interop/financial-axes.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)))),
      fetch("/interop/financial-measure-run.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([fa, mr]) => {
        if (fa && Array.isArray(fa.axes)) {
          setAxes(fa.axes);
          setAxesNote(fa.note || "");
          setHonesty(fa.honesty || "");
        } else {
          throw new Error("not a financial-axes payload");
        }
        if (mr && Array.isArray(mr.measured)) setRun(mr);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  const measuredCount = axes ? axes.filter((a) => a.status === "MEASURED").length : 0;
  const unmeasuredCount = axes ? axes.filter((a) => a.status !== "MEASURED").length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          The 22-axis canon — financial half
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">Financial axes</h1>
        <p className="mt-3 max-w-3xl text-gray-600">
          The 8 financial and domain axes of the 22-axis canon. Same spine, same three-state
          grammar as the behavioural board: <strong>MEASURED</strong> means a deterministic rubric
          and real, recomputable data exist and a run is signed; <strong>UNMEASURED</strong> means
          the slot is declared and public but not yet built. We never claim an axis before it is
          measured. Read live from{" "}
          <a className="font-semibold text-emerald-700 underline" href="/interop/financial-axes.json">
            /interop/financial-axes.json
          </a>
          .
        </p>

        {axes && (
          <p className="mt-4 text-sm text-gray-500">
            {measuredCount} MEASURED · {unmeasuredCount} UNMEASURED · 8 declared slots.
          </p>
        )}

        {err && (
          <p className="mt-8 text-red-600">
            Could not load the financial-axes registry: {err} — the JSON at{" "}
            <a className="underline" href="/interop/financial-axes.json">/interop/financial-axes.json</a>{" "}
            is the source of truth.
          </p>
        )}
        {!axes && !err && <p className="mt-8 text-gray-500">Loading the financial-axes registry…</p>}

        {axes && (
          <div className="mt-8 grid gap-5">
            {axes.map((a) => (
              <section
                key={a.id}
                id={a.id}
                className="rounded-xl border border-emerald-600/15 bg-white p-6 shadow-sm scroll-mt-24"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{a.name}</h2>
                    <p className="mt-0.5 font-mono text-xs text-gray-400">/gspc/{a.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.candidate && (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        candidate slot
                      </span>
                    )}
                    <span
                      className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold ${STATUS_CHIP[a.status] || STATUS_CHIP.UNMEASURED}`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>

                {a.rubric && <p className="mt-3 text-sm text-gray-700"><strong>Rubric.</strong> {a.rubric}</p>}

                {a.status === "MEASURED" && typeof a.measured_count === "number" && (
                  <p className="mt-2 text-sm text-emerald-800">
                    {a.measured_count} instruments measured · deterministic on-chain control facts.
                  </p>
                )}

                {a.data && <p className="mt-2 text-xs text-gray-500"><strong>Data.</strong> {a.data}</p>}
                {a.bank_status && (
                  <p className="mt-2 text-xs text-gray-500"><strong>Input bank.</strong> {a.bank_status}</p>
                )}
                {a.risk_verdict && (
                  <p className="mt-2 text-xs text-gray-500"><strong>Risk verdict.</strong> {a.risk_verdict}</p>
                )}
                {a.declared_as && <p className="mt-2 text-xs text-gray-500">{a.declared_as}</p>}
                {a.note && <p className="mt-2 text-xs italic text-gray-400">{a.note}</p>}

                {/* MEASURED provenance-controls: render the signed on-chain control facts + link the devnet txs. */}
                {a.id === "provenance-controls" && run && (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-600/10 bg-emerald-50/40 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      On-chain control facts — signed run
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {run.network ? `${run.network}. ` : ""}
                      {run.honesty || ""}
                    </p>
                    <table className="mt-3 w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-600">
                          <th className="py-2 pr-3 font-semibold">Instrument</th>
                          <th className="py-2 px-3 font-semibold">Allowlisting</th>
                          <th className="py-2 px-3 font-semibold">Issuer can freeze</th>
                          <th className="py-2 px-3 font-semibold">Identity domain</th>
                          <th className="py-2 px-3 font-semibold">As of</th>
                          <th className="py-2 pl-3 font-semibold">Devnet tx</th>
                        </tr>
                      </thead>
                      <tbody>
                        {run.measured.map((m) => (
                          <tr key={m.instrument} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 pr-3 font-medium text-gray-800">{m.instrument}</td>
                            <td className="py-2 px-3 font-mono text-xs">
                              {m.control_facts.facts.allowlisting_enforced ? "enforced" : "none"}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">
                              {m.control_facts.facts.issuer_can_freeze ? "yes" : "no"}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">
                              {m.control_facts.facts.identity_domain_declared ? "declared" : "none"}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs text-gray-500">{m.control_facts.as_of}</td>
                            <td className="py-2 pl-3">
                              <a
                                className="font-mono text-xs text-emerald-700 underline"
                                href={m.explorer}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {m.devnet_tx.slice(0, 10)}…
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-[11px] text-gray-400">
                      Facts only — deterministic on-chain reads. Risk verdicts remain UNMEASURED
                      pending counsel. Not ratings, advice, or endorsements.
                    </p>
                  </div>
                )}

                {a.surface && a.surface !== "none (declared; no live surface yet)" && (
                  <p className="mt-3 text-xs">
                    <span className="text-gray-400">Surface: </span>
                    {a.surface.startsWith("/") ? (
                      <a className="font-mono text-emerald-700 underline" href={a.surface.split(" ")[0]}>
                        {a.surface}
                      </a>
                    ) : (
                      <span className="font-mono text-gray-500">{a.surface}</span>
                    )}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}

        {axesNote && (
          <p className="mt-8 rounded-lg border border-emerald-600/15 bg-emerald-50/50 p-4 text-sm text-gray-700">
            {axesNote}
          </p>
        )}
        {honesty && (
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Honesty.</strong> {honesty}
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
          <Link href="/gspc-scoreboard" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            The behavioural board — 14 axes →
          </Link>
          <Link href="/honesty" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            The honesty gate — our own losses →
          </Link>
          <Link href="/methodology" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            How we measure →
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Measurement, not certification. The three candidate index slots (AI-economy, human-labour,
          humanoid-labour) have no deterministic rubric or public input bank yet — they are declared
          UNMEASURED so the slot is honest and public, never claimed as built. They become MEASURED
          only when a deterministic rubric and real data exist and a run is signed.
        </p>
      </div>
    </div>
  );
}
