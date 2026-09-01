import { useEffect, useState } from "react";

/**
 * EstateDoors — the honest doors strip (B1.2, CSOAI_FRONTEND_REACH_AGENTS).
 *
 * Every same-origin door is PROBED on load and its state printed from the
 * probe, never typed: a door that 404s is shown as 404, a signed envelope is
 * only called signed when the sig field is non-null on this load. Cross-origin
 * doors that cannot be cheaply probed from a browser (cobolbridge.ai) and
 * facts that no probe can see (OTel emission) carry static honest words with
 * their date — clearly marked as not probed, never claimed live.
 *
 * Loader grammar (A3): while a probe is in flight the cell says PROBING —
 * no fake status. A failed probe prints UNREACHABLE, not a cached state.
 */

type DoorState = { label: string; detail: string; tone: "ok" | "gap" | "warn" | "probing" };

const TONE: Record<DoorState["tone"], string> = {
  ok: "border-emerald-300 bg-emerald-50 text-emerald-900",
  gap: "border-amber-300 bg-amber-50 text-amber-900",
  warn: "border-rose-300 bg-rose-50 text-rose-900",
  probing: "border-slate-200 bg-slate-50 text-slate-500",
};

const PROBING: DoorState = { label: "PROBING", detail: "checked on this load", tone: "probing" };

// A host that SPA-fallbacks every path answers HTML with a 200 for a missing
// API door. Parsing that as a door state would claim a door that is not there,
// so every probe requires a JSON content-type before it believes the answer.
const isJson = (r: Response) => (r.headers.get("content-type") || "").toLowerCase().includes("json");
const HTML_ANSWERED: DoorState = {
  label: "UNCHECKABLE",
  detail: "the path answered HTML, not the API — no door state is claimed from a fallback page",
  tone: "warn",
};

export default function EstateDoors() {
  const [root, setRoot] = useState<DoorState>(PROBING);
  const [swift, setSwift] = useState<DoorState>(PROBING);
  const [xrpl, setXrpl] = useState<DoorState>(PROBING);
  const [mcp, setMcp] = useState<DoorState>(PROBING);

  useEffect(() => {
    const ac = new AbortController();

    fetch("/root.json", { signal: ac.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) return setRoot({ label: `HTTP ${r.status}`, detail: "envelope not readable this load", tone: "warn" });
        if (!isJson(r)) return setRoot(HTML_ANSWERED);
        const d = await r.json().catch(() => ({}));
        const signed = typeof d?.sig_ed25519 === "string" && d.sig_ed25519.length > 0;
        setRoot(
          signed
            ? { label: "envelope sig present", detail: `card_count=${d.card_count ?? "—"} · sig_ed25519 non-null this load — presence, not your verification; verify it yourself`, tone: "ok" }
            : { label: "UNSIGNED envelope", detail: `card_count=${d.card_count ?? "—"} · sig_ed25519 null — the gap is printed, not painted over`, tone: "gap" },
        );
      })
      .catch(() => !ac.signal.aborted && setRoot({ label: "UNREACHABLE", detail: "GET /root.json did not answer", tone: "warn" }));

    fetch("/api/swift", { signal: ac.signal, headers: { accept: "application/json" } })
      .then((r) =>
        setSwift(
          r.status === 404
            ? { label: "404 honest", detail: "no /api/swift is served — 17 names are a DISCOVERED census, not clients, not a grade", tone: "gap" }
            : r.ok && !isJson(r)
              ? HTML_ANSWERED
              : { label: `HTTP ${r.status}`, detail: "probed on this load", tone: r.ok ? "ok" : "warn" },
        ),
      )
      .catch(() => !ac.signal.aborted && setSwift({ label: "UNREACHABLE", detail: "probe failed this load", tone: "warn" }));

    fetch("/api/xrpl", { signal: ac.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) return setXrpl({ label: `HTTP ${r.status}`, detail: "reader not readable this load", tone: "warn" });
        if (!isJson(r)) return setXrpl(HTML_ANSWERED);
        const d = await r.json().catch(() => ({}));
        if (typeof d.n !== "number") return setXrpl(HTML_ANSWERED);
        setXrpl({ label: `reader · n=${d.n}`, detail: `writes_board=${String(d.writes_board)} — reads the ledger, writes nothing onto the board`, tone: "ok" });
      })
      .catch(() => !ac.signal.aborted && setXrpl({ label: "UNREACHABLE", detail: "GET /api/xrpl did not answer", tone: "warn" }));

    fetch("/mcp", {
      method: "POST",
      signal: ac.signal,
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    })
      .then(async (r) => {
        if (!r.ok) return setMcp({ label: `HTTP ${r.status}`, detail: "tool list not readable this load", tone: "warn" });
        if (!isJson(r)) return setMcp(HTML_ANSWERED);
        const d = await r.json().catch(() => ({}));
        const tools: unknown[] = Array.isArray(d?.result?.tools) ? d.result.tools : [];
        setMcp(
          tools.length > 0
            ? { label: `${tools.length} tools served`, detail: "counted from tools/list on this load, never typed", tone: "ok" }
            : { label: "no tools listed", detail: "tools/list answered empty this load", tone: "gap" },
        );
      })
      .catch(() => !ac.signal.aborted && setMcp({ label: "UNREACHABLE", detail: "POST /mcp did not answer", tone: "warn" }));

    return () => ac.abort();
  }, []);

  const doors: { name: string; href: string; state: DoorState }[] = [
    { name: "/root.json", href: "/root.json", state: root },
    { name: "/api/xrpl", href: "/api/xrpl", state: xrpl },
    { name: "/api/swift", href: "/api/swift", state: swift },
    { name: "/mcp", href: "/tools", state: mcp },
    {
      name: "cobolbridge.ai",
      href: "https://cobolbridge.ai",
      state: { label: "522 — not probed here", detail: "last checked 2026-09-01 from the estate, not from your browser; do not demo it", tone: "warn" },
    },
    {
      name: "OpenTelemetry",
      href: "/methodology",
      state: { label: "not emitted", detail: "the runtime wire is missing and we say so — no probe can make that true", tone: "gap" },
    },
  ];

  return (
    <section aria-labelledby="estate-doors-h" data-testid="estate-doors">
      <h2 id="estate-doors-h" className="text-sm font-black uppercase tracking-wide text-slate-900">
        Estate doors — probed, not promised
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Same-origin doors are checked on this load; a door we cannot probe from your browser says
        so. A door that 404s is never claimed.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {doors.map((d) => (
          <li key={d.name} className={`rounded-xl border p-3 ${TONE[d.state.tone]}`}>
            <div className="flex items-baseline justify-between gap-2">
              <a href={d.href} className="font-mono text-[13px] font-bold underline-offset-2 hover:underline">
                {d.name}
              </a>
              <span className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-wide">
                {d.state.label}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug opacity-80">{d.state.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
