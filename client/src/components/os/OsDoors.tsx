import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { FOCUS } from "@/components/lobby/glass";
import { osDoorHref, osPanelHref } from "@/lib/lobbyLink";
import { BOARD_PANE, type DoorId } from "./doors";

const VerifyPane = lazy(() => import("@/components/lobby/LobbyVerifyPane"));
const CardsPane = lazy(() => import("@/components/lobby/LobbyCardsPane"));

function BoardDoor() {
  return <BOARD_PANE />;
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

function HarnessDoor() {
  const [probe, setProbe] = useState<McpProbe>({ status: "checking" });

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

  const tools = probe.status === "live" ? probe.tools : HARNESS_TOOLS_FALLBACK;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Measurement harness</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connect your MCP client or agent to the live measurement rail.
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
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">AG-UI panel (optional chrome)</h3>
        <p className="mt-1 text-sm text-slate-600">
          MCP is the portable OS. Never an iframe of /os or /products.
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
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          Head-to-head comparisons on frozen provisions. Winner is a signed measurement, not a model beauty contest.
        </p>
        <Link
          href="/gspc-arena"
          className={`mt-4 inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 ${FOCUS}`}
        >
          Open the Arena →
        </Link>
      </div>
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
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">{copy.body}</p>
        <Link
          href="/assess"
          className={`mt-4 inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 ${FOCUS}`}
        >
          {copy.cta}
        </Link>
      </div>
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
