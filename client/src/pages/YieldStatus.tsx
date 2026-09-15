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
      const read = async (path: string) => {
        const response = await fetch(path, { cache: "no-store", headers: { accept: "application/json" } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      };
      const paths = ["/api/gspc", "/root.json", "/api/revenue", "/api/regulation", "/api/xrpl"];
      const [gspc, root, rev, reg, xrpl] = await Promise.allSettled(paths.map(read));
      const result = (entry: PromiseSettledResult<any>, path: string) => entry.status === "fulfilled"
        ? { ok: true as const, body: entry.value }
        : { ok: false as const, body: null, error: `${path} ${entry.reason instanceof Error ? entry.reason.message : "unreachable"}` };
      const gspcResult = result(gspc, paths[0]);
      const rootResult = result(root, paths[1]);
      const revResult = result(rev, paths[2]);
      const regResult = result(reg, paths[3]);
      const xrplResult = result(xrpl, paths[4]);
      const g = gspcResult.body as { totals?: { public_count?: number } } | null;
      const rt = rootResult.body as { card_count?: number; as_of?: string } | null;
      const rv = revResult.body as { one_number?: { all_time?: number; settlements?: number } } | null;
      const rg = regResult.body as { verified_as_of?: string; deadlines?: unknown[] } | null;
      const xr = xrplResult.body as { assets?: Array<{ sig_ed25519?: string | null }> } | null;

        next.push({
          label: "GSPC board",
          value: gspcResult.ok
            ? `HTTP 200 · public_count ${g?.totals?.public_count ?? "UNCHECKABLE"}`
            : `UNCHECKABLE · ${gspcResult.error}`,
          href: "/dashboard?tab=board",
        });
        next.push({
          label: "Public root cards",
          value: rootResult.ok
            ? `${rt?.card_count ?? "UNCHECKABLE"} as_of ${rt?.as_of ?? "UNCHECKABLE"}`
            : `UNCHECKABLE · ${rootResult.error}`,
          href: "/root.json",
        });
        const payers = rv?.one_number?.all_time;
        const settles = rv?.one_number?.settlements;
        next.push({
          label: "Settled non-self payers (derived /api/revenue)",
          value: revResult.ok
            ? typeof payers === "number"
              ? `${payers} payer(s) · ${settles ?? "UNCHECKABLE"} settlement(s)`
              : "UNCHECKABLE · malformed revenue response"
            : `UNCHECKABLE · ${revResult.error}`,
          href: "/api/revenue",
        });
        next.push({
          label: "Regulation feed",
          value: regResult.ok
            ? `verified_as_of ${rg?.verified_as_of ?? "UNCHECKABLE"} · ${Array.isArray(rg?.deadlines) ? rg!.deadlines!.length : 0} deadlines`
            : `UNCHECKABLE · ${regResult.error}`,
          href: "/countdown",
        });
        next.push({
          label: "Signed XRPL asset leaves",
          value: xrplResult.ok && Array.isArray(xr?.assets)
            ? `${xr.assets.filter((asset) => typeof asset.sig_ed25519 === "string" && asset.sig_ed25519.length > 0).length} of ${xr.assets.length}`
            : `UNCHECKABLE · ${xrplResult.ok ? "malformed XRPL response" : xrplResult.error}`,
          href: "/api/xrpl",
        });
      if (!cancelled) {
        setRows(next);
        setErr(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
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
    </section>
  );
}
