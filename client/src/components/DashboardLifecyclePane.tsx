import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

type StageState = "AVAILABLE" | "OBSERVED" | "HOLD" | "UNCHECKABLE";

type ProductStage = {
  id: string;
  order: number;
  label: string;
  engine: string;
  state: StageState;
  source: string;
  href: string;
  meaning: string;
  observed?: Record<string, unknown>;
};

type ProductFlow = {
  schema: "csoai.product-flow/0.1";
  product: string;
  doctrine: string;
  contract: {
    one_product: string;
    order: string;
    non_equivalences: string[];
    job_state_rule: string;
  };
  stages: ProductStage[];
  commercial: {
    distinct_nonself_payers?: number | null;
    qualifying_settlements?: number | null;
    settled_usdc_atomic?: number | null;
  };
};

const STATE_COPY: Record<
  StageState,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  OBSERVED: {
    label: "Observed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: CheckCircle2,
  },
  AVAILABLE: {
    label: "Available",
    className: "border-sky-200 bg-sky-50 text-sky-900",
    icon: CircleDashed,
  },
  HOLD: {
    label: "Hold",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    icon: ShieldAlert,
  },
  UNCHECKABLE: {
    label: "Uncheckable",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    icon: CircleDashed,
  },
};

export function isProductFlow(value: unknown): value is ProductFlow {
  if (!value || typeof value !== "object") return false;
  const body = value as ProductFlow;
  return body.schema === "csoai.product-flow/0.1"
    && Array.isArray(body.stages) && body.stages.length > 0
    && body.stages.every((stage) => stage && typeof stage.id === "string"
      && typeof stage.label === "string" && typeof stage.engine === "string"
      && typeof stage.meaning === "string" && typeof stage.source === "string"
      && typeof stage.order === "number" && Number.isSafeInteger(stage.order)
      && Object.prototype.hasOwnProperty.call(STATE_COPY, stage.state)
      && typeof stage.href === "string" && stage.href.startsWith("/") && !stage.href.startsWith("//") && !stage.href.includes(String.fromCharCode(92)))
    && typeof body.contract?.one_product === "string"
    && typeof body.contract?.order === "string"
    && !!body.commercial && typeof body.commercial === "object";
}

function localHref(value: string): string {
  try {
    const url = new URL(value, "https://councilof.ai");
    return url.origin === "https://councilof.ai"
      ? url.pathname + url.search + url.hash
      : value;
  } catch {
    return value;
  }
}

function compactObserved(observed?: Record<string, unknown>): string[] {
  if (!observed) return [];
  return Object.entries(observed)
    .filter(([, value]) => value !== null && value !== undefined)
    .slice(0, 4)
    .map(([key, value]) => key.replaceAll("_", " ") + ": " + String(value));
}

export default function DashboardLifecyclePane() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = useMemo(
    () => new URLSearchParams(search.startsWith("?") ? search.slice(1) : search),
    [search],
  );
  const [subject, setSubject] = useState(params.get("subject") || "");
  const [axis, setAxis] = useState(params.get("axis") || "");
  const [flow, setFlow] = useState<
    | { state: "loading" }
    | { state: "ready"; body: ProductFlow }
    | { state: "unavailable" }
  >({ state: "loading" });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      if (active) setFlow({ state: "unavailable" });
    }, 12_000);
    fetch("/api/product-flow", {
      signal: controller.signal,
      headers: { accept: "application/json", "cache-control": "no-cache" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return (await response.json()) as ProductFlow;
      })
      .then((body) => {
        if (!active) return;
        setFlow(
          isProductFlow(body)
            ? { state: "ready", body }
            : { state: "unavailable" },
        );
      })
      .catch(() => active && setFlow({ state: "unavailable" }))
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const startRequest = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    next.set("tab", "measured");
    if (subject.trim()) next.set("subject", subject.trim());
    if (axis.trim()) next.set("axis", axis.trim().toLowerCase());
    setLocation("/dashboard?" + next.toString());
  };

  const body = flow.state === "ready" ? flow.body : null;
  const hold = body?.stages.find((stage) => stage.state === "HOLD") ?? null;
  const payerCount = body?.commercial.distinct_nonself_payers;
  const settledAtomic = body?.commercial.settled_usdc_atomic;

  return (
    <section
      className="mx-auto max-w-6xl px-5 py-7 sm:px-8"
      aria-labelledby="product-lifecycle-title"
      data-testid="dashboard-lifecycle"
    >
      <div className="rounded-3xl border border-emerald-400/15 bg-[#06150f] p-6 text-white shadow-[0_24px_70px_rgba(3,17,11,0.14)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              <Workflow className="h-4 w-4" aria-hidden="true" />
              One product · one evidence lifecycle
            </p>
            <h1
              id="product-lifecycle-title"
              className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Request → evidence → measure → verify → maintain.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-50/75 sm:text-base">
              Request a measurement, inspect the evidence, verify the signed
              result and keep track of corrections. Each step opens the tools
              and records that support your work.
            </p>
          </div>
          <div className="max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-emerald-50/70">
            <strong className="text-white">State rule:</strong> infrastructure
            health is not customer-job completion. Payment, execution,
            measurement, signature, delivery and repeat use remain distinct.
          </div>
        </div>

        <form
          onSubmit={startRequest}
          className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 sm:grid-cols-[1fr_0.55fr_auto]"
        >
          <label className="text-xs font-semibold text-emerald-50">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="model-or-subject-id"
              className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-emerald-100/35 focus:border-emerald-300"
            />
          </label>
          <label className="text-xs font-semibold text-emerald-50">
            Optional axis
            <input
              value={axis}
              onChange={(event) => setAxis(event.target.value)}
              placeholder="governance"
              className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-emerald-100/35 focus:border-emerald-300"
            />
          </label>
          <button
            type="submit"
            className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-[#03110b] transition hover:bg-emerald-300"
          >
            Start request <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>

      {flow.state === "loading" ? (
        <div className="mt-6 rounded-2xl border bg-white p-6 text-sm text-muted-foreground">
          Reading the live product lifecycle…
        </div>
      ) : flow.state === "unavailable" ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          The lifecycle endpoint is unavailable. No stage has been inferred from cached data.
        </div>
      ) : (
        <>
          {hold ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <strong>Current product hold: {hold.label}.</strong>{" "}
              {hold.meaning}
            </div>
          ) : null}

          <ol className="mt-6 grid gap-4 lg:grid-cols-2">
            {body!.stages.map((stage) => {
              const meta = STATE_COPY[stage.state];
              const StateIcon = meta.icon;
              const facts = compactObserved(stage.observed);
              return (
                <li
                  key={stage.id}
                  className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-[0_10px_30px_rgba(6,21,15,0.04)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                        {String(stage.order).padStart(2, "0")} · {stage.engine}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-950">
                        {stage.label}
                      </h2>
                    </div>
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold " +
                        meta.className
                      }
                    >
                      <StateIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {stage.meaning}
                  </p>
                  {facts.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {facts.map((item) => (
                        <span
                          key={item}
                          className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <code className="min-w-0 truncate text-[10px] text-slate-400">
                      {stage.source}
                    </code>
                    <Link
                      href={localHref(stage.href)}
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline"
                    >
                      Open stage <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
                Commercial truth
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-950">
                Distinct qualifying non-self payers:{" "}
                <strong>{typeof payerCount === "number" ? payerCount : "unknown"}</strong>.
                Qualifying settled amount:{" "}
                <strong>
                  {typeof settledAtomic === "number"
                    ? String(settledAtomic) + " atomic USDC"
                    : "unknown"}
                </strong>.
                {" "}Demand evidence does not alter measurement or delivery state.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                Product contract
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {body!.contract.one_product}
              </p>
              <p className="mt-2 font-mono text-[11px] leading-5 text-slate-500">
                {body!.contract.order}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
