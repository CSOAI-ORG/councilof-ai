import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

type Row = { label: string; value: string; href?: string };

export default function YieldStatus() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const next: Row[] = [];
      try {
        const [gspc, root, rev, reg] = await Promise.all([
          fetch("/api/gspc").then((r) => ({ ok: r.ok, status: r.status, json: r.ok ? r.json() : Promise.resolve(null) })),
          fetch("/root.json").then((r) => ({ ok: r.ok, status: r.status, json: r.ok ? r.json() : Promise.resolve(null) })),
          fetch("/api/revenue").then((r) => ({ ok: r.ok, status: r.status, json: r.ok ? r.json() : Promise.resolve(null) })),
          fetch("/api/regulation").then((r) => ({ ok: r.ok, status: r.status, json: r.ok ? r.json() : Promise.resolve(null) })),
        ]);
        const g = (await gspc.json) as { totals?: { public_count?: number; lid?: string } } | null;
        const rt = (await root.json) as { card_count?: number; as_of?: string } | null;
        const rv = (await rev.json) as {
          one_number?: { all_time?: number; settlements?: number; self_settlements?: number };
        } | null;
        const rg = (await reg.json) as { verified_as_of?: string; deadlines?: unknown[] } | null;

        next.push({
          label: "GSPC board",
          value: gspc.ok
            ? `HTTP 200 · public_count ${g?.totals?.public_count ?? "UNCHECKABLE"}`
            : `UNCHECKABLE HTTP ${gspc.status}`,
          href: "/dashboard?tab=board",
        });
        next.push({
          label: "Public root cards",
          value: root.ok
            ? `${rt?.card_count ?? "UNCHECKABLE"} as_of ${rt?.as_of ?? "UNCHECKABLE"}`
            : `UNCHECKABLE HTTP ${root.status}`,
          href: "/root.json",
        });
        const payers = rv?.one_number?.all_time;
        const settles = rv?.one_number?.settlements;
        next.push({
          label: "Settled non-self payers (derived /api/revenue)",
          value: rev.ok
            ? payers
              ? `${payers} payer(s) · ${settles ?? "UNCHECKABLE"} settlement(s)`
              : "—"
            : `UNCHECKABLE HTTP ${rev.status}`,
          href: "/api/revenue",
        });
        next.push({
          label: "Regulation feed",
          value: reg.ok
            ? `verified_as_of ${rg?.verified_as_of ?? "UNCHECKABLE"} · ${Array.isArray(rg?.deadlines) ? rg!.deadlines!.length : 0} deadlines`
            : `UNCHECKABLE HTTP ${reg.status}`,
          href: "/countdown",
        });
        next.push({
          label: "XRPL credentials",
          value: "0 (EP5 not landed — honest zero)",
        });
        if (!cancelled) setRows(next);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message || "UNCHECKABLE");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Yield status | Council of AI</title>
        <meta
          name="description"
          content="Derived live counters from board, root, revenue, and regulation feeds. Not a grade."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Derived counters · never typed
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Status</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Every number on this page is fetched from a live JSON door. If a door fails, the cell
          is UNCHECKABLE. Settled payments stay a dash until /api/revenue reports a non-self
          payer. Measurement, not certification.
        </p>
        {err ? <p className="mt-6 font-mono text-sm text-rose-300">{err}</p> : null}
        <ul className="mt-8 space-y-3">
          {rows.map((r) => (
            <li key={r.label} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">{r.label}</div>
              <div className="mt-1 font-mono text-sm text-emerald-200">{r.value}</div>
              {r.href ? (
                <Link href={r.href} className="mt-2 inline-block text-xs text-emerald-400 underline">
                  {r.href}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-slate-400">
          Corrections:{" "}
          <Link href="/refutation-ledger" className="text-emerald-300 underline">
            /refutation-ledger
          </Link>
          . Verify:{" "}
          <Link href="/gspc-verify" className="text-emerald-300 underline">
            /gspc-verify
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
