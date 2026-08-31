import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { FOCUS } from "@/components/lobby/glass";
import { osDoorHref, osPanelHref } from "@/lib/lobbyLink";
import { BOARD_PANE, type DoorId } from "./doors";
import PublicRootCatalogue from "@/components/gspc/PublicRootCatalogue";

const VerifyPane = lazy(() => import("@/components/lobby/LobbyVerifyPane"));
const CardsPane = lazy(() => import("@/components/lobby/LobbyCardsPane"));

function BoardDoor() {
  return (
    <div className="space-y-8">
      <BOARD_PANE />
      <PublicRootCatalogue variant="light" />
    </div>
  );
}

function VerifyDoor() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Verify a signed card</h2>
        <p className="mt-1 text-sm text-slate-600">
          Recompute the hash and check the signature in your browser. No login. No fee.
        </p>
      </div>
      <Suspense fallback={<div className="py-8 text-center text-sm text-slate-500">Loading…</div>}>
        <VerifyPane />
      </Suspense>
    </div>
  );
}

function CardsDoor() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="py-8 text-center text-sm text-slate-500">Loading…</div>}>
        <CardsPane
          onOpenRoute={(path) => {
            if (path === "/gspc-verify" || path.startsWith("/gspc-verify?")) {
              setLocation(osDoorHref("verify", search));
              return;
            }
            window.location.assign(path);
          }}
        />
      </Suspense>
    </div>
  );
}

const HARNESS_TOOLS_FALLBACK: { name: string; blurb: string }[] = [
  { name: "board_totals", blurb: "live axis counts" },
  { name: "get_axis", blurb: "single axis detail" },
  { name: "verify_card", blurb: "check a signed card" },
  { name: "list_cards", blurb: "published signed-card index" },
];

type McpProbe =
  | { status: "checking" }
  | { status: "live"; tools: { name: string; blurb: string }[]; ms: number }
  | { status: "down"; error: string };

type ComputeLane =
  | { status: "checking" }
  | {
      status: "ready";
      agui: string;
      listed: string;
      graded: string;
      asOf: string;
      inventory: string;
    }
  | { status: "down"; error: string };

function HarnessDoor() {
  const [probe, setProbe] = useState<McpProbe>({ status: "checking" });
  const [lane, setLane] = useState<ComputeLane>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    (async () => {
      try {
        const res = await fetch("/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const tools = ((data?.result?.tools as { name?: string; description?: string }[]) || [])
          .filter((t) => t?.name)
          .map((t) => ({
            name: String(t.name),
            blurb: String(t.description || "").split(".")[0].slice(0, 72) || "MCP tool",
          }));
        if (cancelled) return;
        if (!tools.length) throw new Error("tools/list returned no tools");
        setProbe({ status: "live", tools, ms: Math.round(performance.now() - t0) });
      } catch (e) {
        if (cancelled) return;
        setProbe({
          status: "down",
          error: e instanceof Error ? e.message : "unreachable",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/compute", { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (cancelled) return;
        const listed =
          typeof j?.census?.n_unique_ids === "number"
            ? Number(j.census.n_unique_ids).toLocaleString("en-GB")
            : "see digest";
        const graded = typeof j?.census?.n_measured === "number" ? String(j.census.n_measured) : "0";
        setLane({
          status: "ready",
          agui: String(j?.agui?.status || "unconfigured"),
          listed,
          graded,
          asOf: typeof j?.census?.as_of === "string" ? j.census.as_of : "as_of in the digest",
          inventory: String(j?.runpod?.inventory_kind || "unmeasured"),
        });
      } catch (e) {
        if (cancelled) return;
        setLane({
          status: "down",
          error: e instanceof Error ? e.message : "unreachable",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tools = probe.status === "live" ? probe.tools : HARNESS_TOOLS_FALLBACK;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Measurement harness</h2>
        <p className="mt-1 text-sm text-slate-600">
          Census lists. RunPod / grokbot grades. This door is a view — not a second scoreboard.
        </p>
      </div>
      <div
        className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
          probe.status === "live"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : probe.status === "down"
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-slate-200 bg-slate-50 text-slate-700"
        }`}
        role="status"
        aria-live="polite"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            probe.status === "live"
              ? "bg-emerald-500"
              : probe.status === "down"
                ? "bg-amber-500"
                : "animate-pulse bg-slate-400"
          }`}
          aria-hidden="true"
        />
        {probe.status === "checking" && <span>Probing MCP endpoint…</span>}
        {probe.status === "live" && (
          <span>
            MCP live · {probe.tools.length} tools · {probe.ms} ms
          </span>
        )}
        {probe.status === "down" && (
          <span>
            MCP probe failed ({probe.error}). Showing last-known tool names — try again from your client.
          </span>
        )}
        <a href="https://councilof.ai/mcp" className={`ml-auto font-medium underline-offset-2 hover:underline ${FOCUS}`}>
          https://councilof.ai/mcp
        </a>
      </div>
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          lane.status === "ready" && lane.agui === "live"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
        role="status"
        aria-live="polite"
      >
        {lane.status === "checking" && <p>Reading GET /api/compute…</p>}
        {lane.status === "down" && (
          <p>
            Compute probe failed ({lane.error}). Cite{" "}
            <a className="font-medium underline" href="/api/compute">
              GET /api/compute
            </a>
            . Nothing fabricated.
          </p>
        )}
        {lane.status === "ready" && (
          <div className="space-y-1">
            <p>
              AG-UI wire · {lane.agui}
              {lane.agui === "unconfigured"
                ? " — set AGUI_WIRE_URL on Pages to the RunPod :8785 tunnel."
                : "."}{" "}
              RunPod inventory · {lane.inventory}.
            </p>
            <p>
              Census · {lane.listed} listings observed · {lane.graded} graded · {lane.asOf}. DISCOVERED,
              not MEASURED.
            </p>
          </div>
        )}
        <a href="/api/compute" className={`mt-2 inline-block font-medium underline-offset-2 hover:underline ${FOCUS}`}>
          GET /api/compute
        </a>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">MCP endpoint</h3>
        <code className="mt-2 block rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">
          https://councilof.ai/mcp
        </code>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {tools.map((t) => (
            <li key={t.name} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>
                <code className="font-mono text-slate-600">{t.name}</code>
                {" — "}
                {t.blurb}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Four tools only. COMPUTE is a Council OS terminal function, not a fifth MCP tool.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Grokbot terminal</h3>
        <p className="mt-1 text-sm text-slate-600">
          VERIFY · BOARD · AXIS · CENSUS · CORRECT · WATCH · COMPUTE. A Hub id is DISCOVERED, never
          MEASURED.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">AG-UI panel (optional chrome)</h3>
        <p className="mt-1 text-sm text-slate-600">
          MCP is the portable OS. Never an iframe of /os or /products. The RunPod wire is{" "}
          <code className="font-mono">AGUI_WIRE_URL</code> → <code className="font-mono">/api/agui/*</code>.
        </p>
        <div className="mt-3 space-y-1.5 font-mono text-xs">
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">{osPanelHref("board")}</div>
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">{osPanelHref("verify")}</div>
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">{osPanelHref("cards")}</div>
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">{osPanelHref("harness")}</div>
        </div>
      </div>
    </div>
  );
}

function SpaceDoor() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Council Space</h2>
        <p className="mt-1 text-sm text-slate-600">
          The governed arena — rounds graded deterministically, never by a model jury.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <iframe
          title="Council Space arena"
          src="/gspc-arena?embed=1"
          className="h-[70vh] w-full border-0"
        />
      </div>
      <Link
        href="/gspc-arena"
        className={`inline-flex items-center text-sm font-semibold text-emerald-800 hover:underline ${FOCUS}`}
      >
        Open the Arena as a full page →
      </Link>
    </div>
  );
}

function assessCopy(task: string | null) {
  if (task === "pricing-overview") {
    return {
      title: "How the free rail works",
      lead: "Verify is free forever. A grade is never sold. There are no public prices and no SaaS tiers.",
      body: "Start a signed assessment. What it finds is what it reports. Empty cells stay empty.",
      cta: "Start a free assessment →",
    };
  }
  if (task === "enterprise-start") {
    return {
      title: "Measure an enterprise system",
      lead: "Deterministic checks against the rules that govern your system.",
      body: "The card records what the model did, not an approval. We do not remediate and we do not certify.",
      cta: "Start assessment →",
    };
  }
  return {
    title: "Get measured",
    lead: "Run an assessment against the rules that govern your system.",
    body: "Deterministic checks against frozen provisions. What it finds is what it reports.",
    cta: "Start assessment →",
  };
}

function AssessDoor() {
  const search = useSearch();
  const task = new URLSearchParams(search).get("task");
  const copy = assessCopy(task);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{copy.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{copy.lead}</p>
      </div>
      <p className="text-sm text-slate-600">{copy.body}</p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <iframe
          title="Get measured"
          src="/assess?embed=1"
          className="h-[70vh] w-full border-0"
        />
      </div>
      <Link
        href="/assess"
        className={`inline-flex items-center text-sm font-semibold text-emerald-800 hover:underline ${FOCUS}`}
      >
        {copy.cta}
      </Link>
    </div>
  );
}

export default function OsDoorBody({ door }: { door: DoorId }) {
  if (door === "verify") return <VerifyDoor />;
  if (door === "cards") return <CardsDoor />;
  if (door === "harness") return <HarnessDoor />;
  if (door === "space") return <SpaceDoor />;
  if (door === "assess") return <AssessDoor />;
  return <BoardDoor />;
}
