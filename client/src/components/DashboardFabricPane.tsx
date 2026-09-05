import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Network,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import EvidenceLifecycleView from "@/components/EvidenceLifecycleView";
import JourneyStages from "@/components/JourneyStages";
import {
  fabricCounts,
  fetchCapabilityFabric,
  type CapabilityFabric,
  type FabricState,
} from "@/lib/capabilityFabric";

const STATE_STYLE: Record<FabricState, string> = {
  RUNTIME_OBSERVED: "border-emerald-700/20 bg-emerald-50 text-emerald-900",
  SIGNED: "border-sky-700/20 bg-sky-50 text-sky-900",
  CATALOGUED: "border-slate-700/15 bg-slate-100 text-slate-800",
  STALE: "border-amber-700/25 bg-amber-50 text-amber-950",
  UNREACHABLE: "border-red-700/20 bg-red-50 text-red-900",
  UNCHECKABLE: "border-amber-700/25 bg-amber-50 text-amber-950",
};

const PROTOCOLS = [
  {
    name: "MCP",
    use: "Tool and data access",
    href: "https://modelcontextprotocol.io/specification/latest",
  },
  {
    name: "A2A",
    use: "Durable peer-agent tasks",
    href: "https://a2a-protocol.org/latest/specification/",
  },
  {
    name: "AG-UI",
    use: "Live agent events in this workspace",
    href: "https://docs.ag-ui.com/introduction",
  },
  {
    name: "A2UI",
    use: "Allowlisted declarative native UI",
    href: "https://a2ui.org/",
  },
] as const;

function StateChip({ state }: { state: FabricState }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.08em] ${STATE_STYLE[state]}`}
    >
      {state}
    </span>
  );
}

function age(seconds: number | null): string | null {
  if (seconds === null) return null;
  if (seconds < 60) return `${Math.round(seconds)}s old`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m old`;
  return `${Math.round(seconds / 3600)}h old`;
}

export default function DashboardFabricPane() {
  const [fabric, setFabric] = useState<CapabilityFabric | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetchCapabilityFabric(fetch, controller.signal)
      .then(setFabric)
      .catch((caught) => {
        if (!controller.signal.aborted) {
          setFabric(null);
          setError(caught instanceof Error ? caught.message : String(caught));
        }
      });
    return () => controller.abort();
  }, [reload]);

  const counts = useMemo(
    () => (fabric ? fabricCounts(fabric) : null),
    [fabric],
  );

  return (
    <section
      className="mx-auto max-w-6xl px-5 py-7 sm:px-8"
      aria-labelledby="fabric-title"
      data-testid="dashboard-fabric-pane"
    >
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            Council of AI · governed capability fabric
          </p>
          <h1
            id="fabric-title"
            className="mt-2 text-3xl font-semibold tracking-tight text-foreground"
          >
            One control plane for every real connection.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The dashboard, plugins and agents should all reach the same MCP
            action schemas. A2A delegates work, AG-UI streams progress, and A2UI
            may render allowlisted controls. None of those protocols can award a
            GSPC state; the evidence gate below does that separately.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReload((value) => value + 1)}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold hover:border-emerald-700/30 hover:text-emerald-800"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh live
        </button>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-emerald-800/15 bg-emerald-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">
            Automatic now
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-950">
            Read, inspect, compare, verify
          </p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-950/75">
            Safe reads may run directly against the live board and public MCP
            tools. The reply names the endpoint and observation state.
          </p>
        </article>
        <article className="rounded-2xl border border-amber-800/15 bg-amber-50/65 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-900">
            Review required
          </p>
          <p className="mt-2 text-sm font-semibold text-amber-950">
            Write, pay, send, remediate
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-950/75">
            The Council prepares the exact action and consequence. A person
            approves it before any external or state-changing call.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800/10 bg-slate-100/80 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
            Fail closed
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            Missing adapters stay missing
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700">
            A provider canary now exposes configuration and a separately
            authenticated probe, but no live provider execution, A2A task
            service, A2UI renderer or fix worker is inferred from a button.
          </p>
        </article>
      </div>

      <section className="mt-8" aria-labelledby="fabric-live-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="fabric-live-title" className="text-lg font-semibold">
              Live connection evidence
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Read from <code>/api/fabric</code> on this load; runtime
              observations are kept distinct from configured or catalogued
              capabilities.
            </p>
          </div>
          {fabric ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              {fabric.observed_at}
              {counts
                ? ` · ${counts.RUNTIME_OBSERVED} runtime · ${counts.SIGNED} signed · ${counts.STALE} stale`
                : ""}
            </p>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-amber-700/25 bg-amber-50 p-4 text-sm text-amber-950"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Capability manifest UNREACHABLE: {error}. No connection is
              promoted from stale local knowledge.
            </span>
          </div>
        ) : null}

        {!fabric && !error ? (
          <div className="mt-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Reading the fabric…
          </div>
        ) : null}

        {fabric ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {fabric.rails.map((rail) => (
              <article
                key={rail.id}
                className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {rail.label}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {rail.protocol} · {rail.role}
                    </p>
                  </div>
                  <StateChip state={rail.state} />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {rail.summary}
                </p>
                {rail.last_error ? (
                  <p className="mt-2 text-[10px] leading-relaxed text-red-800">
                    {rail.last_error}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] text-muted-foreground">
                  <span>writes_board=false</span>
                  {age(rail.freshness_seconds) ? (
                    <span>{age(rail.freshness_seconds)}</span>
                  ) : null}
                  {rail.endpoint ? (
                    <a
                      href={rail.endpoint}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
                    >
                      endpoint <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {/* WP-3: the case model, with the exact unavailable capability named at each stage
          that has no runtime. Sits beside the fabric because this pane's own remit is
          "missing adapters kept explicit". */}
      <div className="mt-8">
        <JourneyStages />
      </div>

      <div className="mt-8">
        <EvidenceLifecycleView
          actionContract={
            fabric?.action_contract ?? {
              schema: null,
              state: "UNCHECKABLE",
              mode: null,
              execution_enabled: false,
              action_count: 0,
              last_error: error || "action contract has not been observed",
            }
          }
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-emerald-800" aria-hidden="true" />
            <h2 className="text-base font-semibold">Protocol roles</h2>
          </div>
          <div className="mt-3 divide-y divide-border">
            {PROTOCOLS.map((protocol) => (
              <a
                key={protocol.name}
                href={protocol.href}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center justify-between gap-3 py-2.5 text-xs hover:text-emerald-800"
              >
                <span>
                  <strong>{protocol.name}</strong>
                  <span className="ml-2 text-muted-foreground">
                    {protocol.use}
                  </span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-4 w-4 text-emerald-800"
              aria-hidden="true"
            />
            <h2 className="text-base font-semibold">
              Learning, without leakage
            </h2>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Start with provenance-preserving RAG over admitted signed evidence
            and versioned regulation snapshots. A GNN becomes useful only after
            the subject–instrument–provision graph has a defined labelled task.
            Neural training is not required for orchestration and never follows
            automatically from product use.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Task use, audit retention and model-training consent are three
            separate choices. Evaluation questions and answers stay out of the
            training corpus to prevent benchmark contamination.
          </p>
        </section>
      </div>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Fabric workflows">
        <Link
          href="/dashboard?tab=tools"
          className="rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900"
        >
          Run MCP tools
        </Link>
        <Link
          href="/dashboard?tab=space"
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:text-emerald-800"
        >
          Open Council Space
        </Link>
        <Link
          href="/dashboard?tab=attestations"
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:text-emerald-800"
        >
          Inspect roots & witnesses
        </Link>
      </nav>
    </section>
  );
}
