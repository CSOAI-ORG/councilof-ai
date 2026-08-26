import { useEffect } from "react";
import { Link } from "wouter";

/**
 * /claims-register — every material public claim, its evidence, and the status
 * that claim has actually earned.
 *
 * WHY THIS PAGE EXISTS. An AI-governance company that overstates its own
 * capabilities has no product. The FTC's Section 5 line is simple: a capability
 * you plan to build is not a capability you can advertise, and planned work must
 * be labelled as future. This page is that discipline made public and checkable —
 * the same posture as /status (which marks what it cannot probe) and
 * /refutation-ledger (which publishes what we withdrew).
 *
 * SINGLE SOURCE OF TRUTH. The table below renders public/claims-register.json —
 * the very file served at /claims-register.json. There is no second copy to drift:
 * the machine-readable artifact and the human page are the same bytes.
 */
import register from "../../../public/claims-register.json";

type Status = "live" | "devnet" | "planned" | "retired";

interface Claim {
  id: string;
  claim: string;
  status: string;
  evidence: string[];
  notes?: string;
}

const STATUS_STYLE: Record<Status, { chip: string; label: string; means: string }> = {
  live: {
    chip: "bg-emerald-100 text-emerald-900 ring-emerald-300",
    label: "LIVE",
    means: "Shipped and checkable today.",
  },
  devnet: {
    chip: "bg-sky-100 text-sky-900 ring-sky-300",
    label: "DEVNET",
    means: "Proven on a test network only — not production.",
  },
  planned: {
    chip: "bg-amber-100 text-amber-900 ring-amber-300",
    label: "PLANNED",
    means: "Intended. Not built, or built and not shipped.",
  },
  retired: {
    chip: "bg-rose-100 text-rose-900 ring-rose-300",
    label: "RETIRED",
    means: "Previously published, now withdrawn — with the reason.",
  },
};

const ORDER: Status[] = ["live", "devnet", "planned", "retired"];

function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLE[status as Status];
  if (!s) return <span className="font-mono text-xs">{status}</span>;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ring-1 ${s.chip}`}
    >
      {s.label}
    </span>
  );
}

function EvidenceLink({ href }: { href: string }) {
  const isFile = href.endsWith(".json") || href.startsWith("/api/") || href.startsWith("/.well-known");
  if (isFile) {
    return (
      <a
        className="inline-flex min-h-[44px] items-center font-mono text-[12px] text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900 sm:min-h-0"
        href={href}
        target="_blank"
        rel="noopener"
      >
        {href}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link
      className="inline-flex min-h-[44px] items-center font-mono text-[12px] text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900 sm:min-h-0"
      href={href}
    >
      {href}
    </Link>
  );
}

export default function ClaimsRegister() {
  useEffect(() => {
    document.title = "Claims register — every public claim, its evidence, its status | CSOAI";
  }, []);

  const claims = register.claims as Claim[];
  const counts = ORDER.map((s) => ({ s, n: claims.filter((c) => c.status === s).length }));

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-700">
            Claims register · {claims.length} claims · generated {register.generated_at}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Every claim we make,{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              and what backs it.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-700">{register.purpose}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {counts.map(({ s, n }) => (
              <span key={s} className="inline-flex items-center gap-2">
                <StatusChip status={s} />
                <span className="text-sm text-slate-600">
                  {n}<span className="sr-only"> {STATUS_STYLE[s].label.toLowerCase()} claims</span>
                </span>
              </span>
            ))}
          </div>

          <p className="mt-6 text-[13px] leading-relaxed text-slate-600">
            Machine-readable at{" "}
            <a
              className="font-mono text-emerald-700 underline underline-offset-2"
              href="/claims-register.json"
              target="_blank"
              rel="noopener"
            >
              /claims-register.json
            </a>
            . This page renders that exact file — there is no second copy to drift.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-14">
        <section>
          <h2 className="text-2xl font-bold">What the statuses mean</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {ORDER.map((s) => (
              <div key={s} className="rounded-xl border border-slate-200 p-4">
                <dt>
                  <StatusChip status={s} />
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-700">
                  {STATUS_STYLE[s].means}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {ORDER.map((s) => {
          const rows = claims.filter((c) => c.status === s);
          if (!rows.length) return null;
          return (
            <section key={s}>
              <div className="mb-4 flex items-center gap-3">
                <StatusChip status={s} />
                <h2 className="text-2xl font-bold">
                  <span className="sr-only">{STATUS_STYLE[s].label} — </span>
                  {rows.length} {rows.length === 1 ? "claim" : "claims"}
                </h2>
              </div>
              <ul className="space-y-4">
                {rows.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-slate-200 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-semibold leading-relaxed text-slate-900">{c.claim}</p>
                      <span className="shrink-0 font-mono text-[11px] text-slate-500">{c.id}</span>
                    </div>
                    {c.notes ? (
                      <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{c.notes}</p>
                    ) : null}
                    {c.evidence?.length ? (
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-[2px] text-slate-500">
                          Evidence
                        </span>
                        {c.evidence.map((e) => (
                          <EvidenceLink key={e} href={e} />
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-xl font-bold text-emerald-950">Found one that does not hold?</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900">
            {register.how_to_challenge}
          </p>
          <p className="mt-3 text-sm">
            <Link className="font-semibold text-emerald-800 underline" href="/refutation-ledger">
              The refutation ledger →
            </Link>{" "}
            <span className="text-emerald-900/85">
              is where claims we withdrew are recorded, with the measurement that killed them.
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}
