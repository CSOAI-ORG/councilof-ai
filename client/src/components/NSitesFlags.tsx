import { useState } from "react";
import {
  NSITES_BOOTSTRAP,
  NSITES_ENVELOPE,
  NSITES_FLAGS,
  NSITES_PUBLIC_CLAIM,
  NSITES_RULING,
  PLUGIN_HARVEST,
  type FlagStatus,
  type NSiteFlag,
} from "@/lib/nSitesFlags";

const GROUPS: { status: FlagStatus; label: string; hint: string }[] = [
  {
    status: "planted",
    label: "Already planted — copy and drop",
    hint: "Same receipt, many hosts. Do not mint a new repo for each paste.",
  },
  {
    status: "next",
    label: "Next permissionless drops",
    hint: "One object per platform, after the census and one external rerun.",
  },
  {
    status: "do-not",
    label: "Do not",
    hint: "These manufacture footprint or liability. They do not manufacture coverage.",
  },
];

function FlagRow({ flag }: { flag: NSiteFlag }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4" data-testid={`n-sites-flag-${flag.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{flag.title}</h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-800">{flag.status}</span>
      </div>
      <p className="mt-1 text-[13px] text-slate-600">{flag.note}</p>
      <p className="mt-2 text-[12px] text-slate-500">
        Plant: {flag.plant}{" "}
        <a href={flag.href} className="font-medium text-emerald-800 hover:underline">
          open
        </a>
      </p>
      {flag.snippet ? (
        <>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-[12px] text-emerald-100">
            <code>{flag.snippet}</code>
          </pre>
          <button
            type="button"
            data-testid={`copy-flag-${flag.id}`}
            className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(flag.snippet!);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy this flag"}
          </button>
        </>
      ) : null}
    </li>
  );
}

export default function NSitesFlags() {
  return (
    <section className="mt-16 space-y-8" data-testid="n-sites-flags" aria-labelledby="n-sites-h">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-700">
          N-sites · one receipt, many drops
        </p>
        <h2 id="n-sites-h" className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          {NSITES_RULING}
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          There is no honest way to inference-test millions of Hub models. Hugging Face
          reports more than two million models. The 2,200-subject set is a dated
          eligibility cohort. Full minimum coverage is{" "}
          {NSITES_ENVELOPE.responses.toLocaleString()} responses — about{" "}
          {(NSITES_ENVELOPE.tokens_approx / 1_000_000).toFixed(0)} million tokens under
          the documented planning assumption. Census and flags scale. Sweeps do not,
          until card v2, a signed lineage census, a sandbox, a separate signer and one
          external rerun exist.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Public claim, when the census is signed: {NSITES_PUBLIC_CLAIM}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          The same cell fills Verify, GPAI, RAS and Ledger. XRPL, T-REX and
          OpenTelemetry do not write MEASURED.{" "}
          <a href="/products" className="font-medium text-emerald-800 hover:underline">
            See the product fill path
          </a>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5" data-testid="n-sites-envelope">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-900">
          Scale envelope · do not launch the sweep
        </p>
        <p className="mt-2 font-mono text-sm text-amber-950">
          {NSITES_ENVELOPE.cohort.toLocaleString()} × {NSITES_ENVELOPE.measured_axes} × n=
          {NSITES_ENVELOPE.n} = {NSITES_ENVELOPE.responses.toLocaleString()} responses
        </p>
        <p className="mt-1 text-sm text-amber-900/80">{NSITES_ENVELOPE.assumption}</p>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-amber-950">
          {NSITES_BOOTSTRAP.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5" data-testid="n-sites-plugin-harvest">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-600">
          Plugin · Article 50 · regulators
        </p>
        <p className="mt-2 text-sm text-slate-700">{PLUGIN_HARVEST.plugin_reads}</p>
        <p className="mt-2 text-sm text-slate-700">
          The plugin never collects {PLUGIN_HARVEST.plugin_never.join(", ")}.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          <span className="font-semibold">Article 50 is </span>
          {PLUGIN_HARVEST.art50_is}
        </p>
        <p className="mt-2 text-sm text-slate-700">
          <span className="font-semibold">It is not </span>
          {PLUGIN_HARVEST.art50_is_not}
        </p>
        <p className="mt-3 text-sm text-slate-700">{PLUGIN_HARVEST.publisher_path}</p>
        <p className="mt-2 text-sm text-slate-700">{PLUGIN_HARVEST.regulator_path}</p>
      </div>

      {GROUPS.map((group) => {
        const flags = NSITES_FLAGS.filter((f) => f.status === group.status);
        return (
          <div key={group.status} data-testid={`n-sites-group-${group.status}`}>
            <h3 className="text-lg font-bold text-slate-900">{group.label}</h3>
            <p className="mt-1 text-[13px] text-slate-500">{group.hint}</p>
            <ul className="mt-3 space-y-3">
              {flags.map((flag) => (
                <FlagRow key={flag.id} flag={flag} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
