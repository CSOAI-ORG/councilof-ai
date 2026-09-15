import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

/**
 * /status — service status, read live, component by component.
 *
 * WHY THIS PAGE WAS REBUILT (2026-09-15). The deployed /status/ rendered the
 * homepage proposition and board under a "Yield status" title, and the old page
 * was a list of derived counters — neither told a reader whether the public
 * site, the evidence API, the verification resources, the measurement queue or
 * the publication mirrors were reachable, or when that was last observed.
 *
 * RULES.
 *   · Every row is fetched at render time. Nothing here is typed.
 *   · A row is OK only when its own source answered with the field this page
 *     names. A site that loaded does not make any other component OK.
 *   · "Observed at" is the source's own timestamp when it publishes one; when it
 *     does not, the row says "read at" and shows this browser's clock, labelled.
 *   · UNKNOWN means this page could not read the source (network, CORS, shape).
 *     It is evidence of nothing either way. UNAVAILABLE means the source
 *     answered that the component is not up, or answered with an error.
 *   · No uptime percentage, no incident history and no SLA are invented. The
 *     incident row is UNAVAILABLE until a producer publishes one.
 *   · Measurement, not certification. Not a grade.
 */

type State = "OK" | "DEGRADED" | "UNAVAILABLE" | "UNKNOWN";

type Row = {
  group: string;
  label: string;
  state: State;
  observation: string;
  /** ISO timestamp the SOURCE published, or null when it publishes none. */
  observedAt: string | null;
  /** Which field the timestamp came from, or the read-at note. */
  observedFrom: string;
  href: string;
};

type Read<T> = { ok: true; body: T; readAt: string } | { ok: false; error: string; readAt: string };

async function readJson<T>(path: string, init?: RequestInit): Promise<Read<T>> {
  const readAt = new Date().toISOString();
  try {
    const response = await fetch(path, {
      cache: "no-store",
      headers: { accept: "application/json" },
      ...init,
    });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}`, readAt };
    return { ok: true, body: (await response.json()) as T, readAt };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "unreachable", readAt };
  }
}

/** The failure text of a Read, narrowed explicitly so a ternary branch never has to. */
function readError(r: Read<unknown>): string {
  return "error" in r ? r.error : "";
}

const GROUPS = [
  "Public website",
  "Evidence API",
  "Verification resources",
  "Measurement queue",
  "Publication mirrors",
  "Incidents",
] as const;

const STATE_TONE: Record<State, string> = {
  OK: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  DEGRADED: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  UNAVAILABLE: "border-rose-400/40 bg-rose-500/10 text-rose-200",
  UNKNOWN: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

function unknownRow(group: string, label: string, error: string, readAt: string, href: string): Row {
  return {
    group,
    label,
    state: "UNKNOWN",
    observation: `This page could not read the source (${error}). Not evidence either way.`,
    observedAt: null,
    observedFrom: `read attempted at ${readAt} (this browser's clock)`,
    href,
  };
}

export default function YieldStatus() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [health, gspc, state, root, did, chain, worker, queue, xrpl, rev, hf, gh] = await Promise.allSettled([
        readJson<{ status?: string; timestamp?: string }>("/api/health"),
        readJson<{ totals?: { public_count?: string; measured_axes?: number; axes?: number } }>("/api/gspc"),
        readJson<{
          public_root?: { card_count?: { value?: number; as_of?: string } };
          card_chain?: { bodies_verified_valid?: { value?: number; as_of?: string }; bodies_published?: { value?: number; as_of?: string } };
        }>("/api/state"),
        readJson<{ card_count?: number; as_of?: string; merkle_root?: string }>("/root.json"),
        readJson<{ id?: string; verificationMethod?: unknown[] }>("/.well-known/did.json"),
        readJson<{ head?: string; n_cards?: number; cards?: unknown[] }>("/signed/chain.json"),
        readJson<{ status?: string; http?: number; read_at?: string; worker?: { state?: string } }>("/api/worker"),
        readJson<{ status?: string; as_of?: string; queued?: number; count?: number }>("/api/commission-queue"),
        readJson<{ assets?: Array<{ sig_ed25519?: string | null }> }>("/api/xrpl"),
        readJson<{ one_number?: { all_time?: number; settlements?: number } }>("/api/revenue"),
        readJson<{ id?: string; lastModified?: string; private?: boolean }>(
          "https://huggingface.co/api/datasets/csoai/gspc-hub-cards",
          { headers: { accept: "application/json" } },
        ),
        readJson<{ full_name?: string; pushed_at?: string }>("https://api.github.com/repos/CSOAI-ORG/councilof-ai", {
          headers: { accept: "application/vnd.github+json" },
        }),
      ]);

      const settled = <T,>(entry: PromiseSettledResult<Read<T>>): Read<T> =>
        entry.status === "fulfilled"
          ? entry.value
          : { ok: false, error: entry.reason instanceof Error ? entry.reason.message : "unreachable", readAt: new Date().toISOString() };

      const next: Row[] = [];

      // ── Public website ─────────────────────────────────────────────────────
      {
        const r = settled(health);
        next.push(
          r.ok
            ? {
                group: "Public website",
                label: "Pages deployment answers /api/health",
                state: r.body.status === "ok" ? "OK" : "DEGRADED",
                observation: `status "${r.body.status ?? "not published"}" — one request from this browser; not uptime history.`,
                observedAt: typeof r.body.timestamp === "string" ? r.body.timestamp : null,
                observedFrom: typeof r.body.timestamp === "string" ? "/api/health → timestamp" : `read at ${r.readAt} (this browser's clock)`,
                href: "/api/health",
              }
            : unknownRow("Public website", "Pages deployment answers /api/health", readError(r), r.readAt, "/api/health"),
        );
      }

      // ── Evidence API ───────────────────────────────────────────────────────
      {
        const r = settled(gspc);
        const count = r.ok ? r.body.totals?.public_count : undefined;
        next.push(
          r.ok
            ? {
                group: "Evidence API",
                label: "GET /api/gspc — the living board",
                state: typeof count === "string" && count.trim() ? "OK" : "DEGRADED",
                observation: typeof count === "string" ? `totals.public_count "${count}" (derived by the API, never typed here).` : "answered, but totals.public_count is missing.",
                observedAt: null,
                observedFrom: `read at ${r.readAt} (this browser's clock; the board publishes no single as_of)`,
                href: "/api/gspc",
              }
            : unknownRow("Evidence API", "GET /api/gspc — the living board", readError(r), r.readAt, "/api/gspc"),
        );
        const s = settled(state);
        const rootCount = s.ok ? s.body.public_root?.card_count : undefined;
        const verified = s.ok ? s.body.card_chain?.bodies_verified_valid ?? s.body.card_chain?.bodies_published : undefined;
        next.push(
          s.ok
            ? {
                group: "Evidence API",
                label: "GET /api/state — corpus counts and their kinds",
                state: typeof rootCount?.value === "number" ? "OK" : "DEGRADED",
                observation: `public_root.card_count ${rootCount?.value ?? "not published"} · card_chain verified ${verified?.value ?? "not published"}. Three corpora, never added.`,
                observedAt: typeof rootCount?.as_of === "string" ? rootCount.as_of : null,
                observedFrom: typeof rootCount?.as_of === "string" ? "/api/state → public_root.card_count.as_of" : `read at ${s.readAt} (this browser's clock)`,
                href: "/api/state",
              }
            : unknownRow("Evidence API", "GET /api/state — corpus counts and their kinds", readError(s), s.readAt, "/api/state"),
        );
      }

      // ── Verification resources ─────────────────────────────────────────────
      {
        const r = settled(root);
        next.push(
          r.ok
            ? {
                group: "Verification resources",
                label: "/root.json — the signed public root",
                state: typeof r.body.merkle_root === "string" && typeof r.body.card_count === "number" ? "OK" : "DEGRADED",
                observation: `card_count ${r.body.card_count ?? "not published"} · merkle_root ${typeof r.body.merkle_root === "string" ? r.body.merkle_root.slice(0, 12) + "…" : "not published"}.`,
                observedAt: typeof r.body.as_of === "string" ? r.body.as_of : null,
                observedFrom: typeof r.body.as_of === "string" ? "/root.json → as_of" : `read at ${r.readAt} (this browser's clock)`,
                href: "/root.json",
              }
            : unknownRow("Verification resources", "/root.json — the signed public root", readError(r), r.readAt, "/root.json"),
        );
        const d = settled(did);
        next.push(
          d.ok
            ? {
                group: "Verification resources",
                label: "/.well-known/did.json — the published keys",
                state: Array.isArray(d.body.verificationMethod) && d.body.verificationMethod.length > 0 ? "OK" : "DEGRADED",
                observation: `${d.body.id ?? "id not published"} · ${Array.isArray(d.body.verificationMethod) ? d.body.verificationMethod.length : 0} verification method(s).`,
                observedAt: null,
                observedFrom: `read at ${d.readAt} (this browser's clock; the DID document carries no timestamp)`,
                href: "/.well-known/did.json",
              }
            : unknownRow("Verification resources", "/.well-known/did.json — the published keys", readError(d), d.readAt, "/.well-known/did.json"),
        );
        const c = settled(chain);
        next.push(
          c.ok
            ? {
                group: "Verification resources",
                label: "/signed/chain.json — the signed card chain manifest",
                state: typeof c.body.head === "string" ? "OK" : "DEGRADED",
                observation: `head ${typeof c.body.head === "string" ? c.body.head.slice(0, 12) + "…" : "not published"} · ${typeof c.body.n_cards === "number" ? c.body.n_cards : Array.isArray(c.body.cards) ? c.body.cards.length : "n not published"} card(s) indexed. Verifier: /signed/verify-card.mjs.`,
                observedAt: null,
                observedFrom: `read at ${c.readAt} (this browser's clock)`,
                href: "/signed/chain.json",
              }
            : unknownRow("Verification resources", "/signed/chain.json — the signed card chain manifest", readError(c), c.readAt, "/signed/chain.json"),
        );
        const x = settled(xrpl);
        const assets = x.ok && Array.isArray(x.body.assets) ? x.body.assets : null;
        next.push(
          assets
            ? {
                group: "Verification resources",
                label: "/api/xrpl — signed asset leaves",
                state: "OK",
                observation: `${assets.filter((asset) => typeof asset.sig_ed25519 === "string" && asset.sig_ed25519.length > 0).length} of ${assets.length} leaves carry an Ed25519 signature.`,
                observedAt: null,
                observedFrom: `read at ${x.readAt} (this browser's clock)`,
                href: "/api/xrpl",
              }
            : unknownRow("Verification resources", "/api/xrpl — signed asset leaves", x.ok ? "malformed XRPL response" : readError(x), x.readAt, "/api/xrpl"),
        );
      }

      // ── Measurement queue ──────────────────────────────────────────────────
      {
        const w = settled(worker);
        next.push(
          w.ok
            ? {
                group: "Measurement queue",
                label: "/api/worker — the GPU compute worker's own /health",
                state: w.body.status === "LIVE" ? "OK" : w.body.status === "OFFLINE" ? "UNAVAILABLE" : "DEGRADED",
                observation: `status ${w.body.status ?? "not published"} · worker state ${w.body.worker?.state ?? "not published"}. A compute lane, not an authority lane: nothing here is signed or MEASURED.`,
                observedAt: typeof w.body.read_at === "string" ? w.body.read_at : null,
                observedFrom: typeof w.body.read_at === "string" ? "/api/worker → read_at" : `read at ${w.readAt} (this browser's clock)`,
                href: "/api/worker",
              }
            : unknownRow("Measurement queue", "/api/worker — the GPU compute worker's own /health", readError(w), w.readAt, "/api/worker"),
        );
        const q = settled(queue);
        next.push(
          q.ok
            ? {
                group: "Measurement queue",
                label: "/api/commission-queue — commissioned intents waiting for the mill",
                state: typeof q.body.queued === "number" ? "OK" : "DEGRADED",
                observation: `${q.body.queued ?? "queued not published"} queued of ${q.body.count ?? "count not published"}. Never a measurement.`,
                observedAt: typeof q.body.as_of === "string" ? q.body.as_of : null,
                observedFrom: typeof q.body.as_of === "string" ? "/api/commission-queue → as_of" : `read at ${q.readAt} (this browser's clock)`,
                href: "/api/commission-queue",
              }
            : unknownRow("Measurement queue", "/api/commission-queue — commissioned intents waiting for the mill", readError(q), q.readAt, "/api/commission-queue"),
        );
        const rv = settled(rev);
        const payers = rv.ok ? rv.body.one_number?.all_time : undefined;
        const settles = rv.ok ? rv.body.one_number?.settlements : undefined;
        next.push(
          rv.ok
            ? {
                group: "Measurement queue",
                label: "/api/revenue — settled non-self payers (derived)",
                state: typeof payers === "number" ? "OK" : "DEGRADED",
                observation: typeof payers === "number" ? `${payers} payer(s) · ${settles ?? "settlements not published"} settlement(s). Zero is a measured zero.` : "answered, but one_number.all_time is not a number.",
                observedAt: null,
                observedFrom: `read at ${rv.readAt} (this browser's clock)`,
                href: "/api/revenue",
              }
            : unknownRow("Measurement queue", "/api/revenue — settled non-self payers (derived)", readError(rv), rv.readAt, "/api/revenue"),
        );
      }

      // ── Publication mirrors ────────────────────────────────────────────────
      {
        const h = settled(hf);
        next.push(
          h.ok
            ? {
                group: "Publication mirrors",
                label: "Hugging Face — csoai/gspc-hub-cards dataset",
                state: typeof h.body.id === "string" && h.body.private !== true ? "OK" : "DEGRADED",
                observation: `${h.body.id ?? "id not published"} answered the Hub API. A mirror, never the authority.`,
                observedAt: typeof h.body.lastModified === "string" ? h.body.lastModified : null,
                observedFrom: typeof h.body.lastModified === "string" ? "Hub API → lastModified" : `read at ${h.readAt} (this browser's clock)`,
                href: "https://huggingface.co/datasets/csoai/gspc-hub-cards",
              }
            : unknownRow("Publication mirrors", "Hugging Face — csoai/gspc-hub-cards dataset", `${readError(h)}; a browser read of a third-party API can fail for reasons unrelated to the mirror`, h.readAt, "https://huggingface.co/datasets/csoai/gspc-hub-cards"),
        );
        const g = settled(gh);
        next.push(
          g.ok
            ? {
                group: "Publication mirrors",
                label: "GitHub — CSOAI-ORG/councilof-ai source",
                state: typeof g.body.full_name === "string" ? "OK" : "DEGRADED",
                observation: `${g.body.full_name ?? "repository not published"} answered the GitHub API.`,
                observedAt: typeof g.body.pushed_at === "string" ? g.body.pushed_at : null,
                observedFrom: typeof g.body.pushed_at === "string" ? "GitHub API → pushed_at" : `read at ${g.readAt} (this browser's clock)`,
                href: "https://github.com/CSOAI-ORG/councilof-ai",
              }
            : unknownRow("Publication mirrors", "GitHub — CSOAI-ORG/councilof-ai source", `${readError(g)}; a browser read of a third-party API can fail for reasons unrelated to the mirror`, g.readAt, "https://github.com/CSOAI-ORG/councilof-ai"),
        );
      }

      // ── Incidents ──────────────────────────────────────────────────────────
      next.push({
        group: "Incidents",
        label: "Dated incident history",
        state: "UNAVAILABLE",
        observation: "No producer publishes an incident feed yet, so none is shown. Corrections to published records live in the refutation ledger.",
        observedAt: null,
        observedFrom: "no source — nothing invented",
        href: "/refutation-ledger",
      });

      if (!cancelled) {
        setRows(next);
        setLoadedAt(new Date().toISOString());
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100" data-testid="service-status">
      <Helmet>
        <title>Service status | Council of AI</title>
        <meta
          name="description"
          content="Current observations for the public site, evidence API, verification resources, measurement queue and publication mirrors, each with its observed-at time. An unavailable check is never reported as healthy."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">Service status · read live · never typed</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Service status</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Current observations for the public website, the evidence API, the verification resources, the
          measurement queue and the publication mirrors. Each row is one read from this browser with the
          time its source reported. An unavailable check is not reported as healthy, and a page that loaded
          proves nothing about any other component.
        </p>
        <dl className="mt-5 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
          <div><dt className="inline font-bold text-emerald-200">OK</dt> — <dd className="inline">the source answered with the field this row names.</dd></div>
          <div><dt className="inline font-bold text-amber-200">DEGRADED</dt> — <dd className="inline">it answered, but not with that field.</dd></div>
          <div><dt className="inline font-bold text-rose-200">UNAVAILABLE</dt> — <dd className="inline">the source says the component is down, or no source exists.</dd></div>
          <div><dt className="inline font-bold text-slate-200">UNKNOWN</dt> — <dd className="inline">this page could not read it. Not evidence either way.</dd></div>
        </dl>
        <p className="mt-3 font-mono text-[11px] text-slate-500">
          {loadedAt ? `page read completed at ${loadedAt} (this browser's clock)` : "reading…"}
        </p>

        {GROUPS.map((group) => {
          const items = rows.filter((r) => r.group === group);
          return (
            <section key={group} aria-labelledby={`status-${group.replace(/\s+/g, "-").toLowerCase()}`} className="mt-8">
              <h2 id={`status-${group.replace(/\s+/g, "-").toLowerCase()}`} className="text-lg font-bold text-slate-100">
                {group}
              </h2>
              <ul className="mt-3 space-y-3">
                {items.length === 0 ? (
                  <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs text-slate-500">
                    reading…
                  </li>
                ) : (
                  items.map((r) => (
                    <li key={r.label} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4" data-state={r.state}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-100">{r.label}</div>
                        <span className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold ${STATE_TONE[r.state]}`}>
                          {r.state}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-300">{r.observation}</div>
                      <div className="mt-2 font-mono text-[11px] text-slate-500">
                        {r.observedAt ? (
                          <>
                            observed at <time dateTime={r.observedAt}>{r.observedAt}</time> · {r.observedFrom}
                          </>
                        ) : (
                          r.observedFrom
                        )}
                      </div>
                      {r.href.startsWith("/") ? (
                        <Link href={r.href} className="mt-2 inline-block text-xs text-emerald-400 underline">
                          {r.href}
                        </Link>
                      ) : (
                        <a href={r.href} className="mt-2 inline-block text-xs text-emerald-400 underline" rel="noreferrer">
                          {r.href}
                        </a>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}

        <p className="mt-10 text-sm text-slate-400">
          Corrections:{" "}
          <Link href="/refutation-ledger" className="text-emerald-400 underline">
            the refutation ledger
          </Link>
          . Board totals:{" "}
          <Link href="/dashboard?tab=board" className="text-emerald-400 underline">
            the living board
          </Link>
          . Measurement, not certification.
        </p>
      </section>
    </section>
  );
}
