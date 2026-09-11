import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

const DOORS = [
  "/api/gspc",
  "/root.json",
  "/api/regulation",
  "/api/revenue",
  "/api/x402",
  "/.well-known/agent-card.json",
  "/.well-known/x402.json",
  "/llms.txt",
  "/receipt",
  "/countdown",
  "/status",
  "/custody",
];

type Row = { path: string; status: string; note: string };

export default function HealthInventory() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      DOORS.map(async (path) => {
        try {
          const r = await fetch(path, { method: "GET" });
          return { path, status: String(r.status), note: r.ok ? "ok" : "not 2xx" };
        } catch (e) {
          return { path, status: "UNCHECKABLE", note: (e as Error).message || "fetch failed" };
        }
      }),
    ).then((next) => {
      if (!cancelled) setRows(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Health inventory | Council of AI</title>
        <meta name="robots" content="noindex" />
        <meta
          name="description"
          content="Same-origin door check. Derived HTTP statuses. Not a certification."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          v0 scanner · same-origin only
        </p>
        <h1 className="mt-3 text-3xl font-black">Health inventory</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Each row is a live GET from this browser. Failures are UNCHECKABLE. This is not an
          uptime SLA and not a certification.
        </p>
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-500">
              <th className="py-2">Door</th>
              <th>HTTP</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {rows.map((r) => (
              <tr key={r.path} className="border-b border-slate-800">
                <td className="py-2 text-emerald-200">{r.path}</td>
                <td>{r.status}</td>
                <td className="text-slate-500">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
