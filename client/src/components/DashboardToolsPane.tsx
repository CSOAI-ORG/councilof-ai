import {
  ArrowUpRight,
  Braces,
  CircleDollarSign,
  Eye,
  ShieldCheck,
} from "lucide-react";
import ToolRunner from "./ToolRunner";
import { FREE_TOOL_NAMES, PAID_TOOL_NAMES } from "@/lib/mcpTools";
import { useSearch } from "wouter";

// Derived from the two files the /mcp door reads, not typed. This list was correct on
// 2026-09-05 and that is exactly the problem: a hand-kept duplicate of the door's tool set is
// right until the day someone adds or drops a tool, and nothing here would have noticed.
// /products carried the same kind of list and had drifted to four of eleven.
export const FREE_TOOLS = FREE_TOOL_NAMES;

export const METERED_TOOLS = PAID_TOOL_NAMES;

export const PUBLISHED_TOOL_COUNT = FREE_TOOLS.length + METERED_TOOLS.length;

export default function DashboardToolsPane() {
  const search = useSearch();
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const selectedTool = params.get("tool") || undefined;
  const initialArguments = Object.fromEntries(
    [...params.entries()].filter(
      ([name]) => !["tab", "tool", "view"].includes(name),
    ),
  );
  return (
    <section
      className="mx-auto max-w-6xl px-5 py-7 sm:px-8"
      aria-labelledby="dashboard-tools-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            Council of AI · MCP tools
          </p>
          <h1
            id="dashboard-tools-title"
            className="mt-2 text-3xl font-semibold tracking-tight text-foreground"
          >
            Call the public tools without leaving the workspace.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The runner reads the current catalogue from{" "}
            <code className="font-mono text-xs">POST /mcp</code>, builds inputs
            from each tool’s JSON Schema, and prints the endpoint’s reply.
            The current runtime advertises {PUBLISHED_TOOL_COUNT} tools: {FREE_TOOLS.length} free
            reads and {METERED_TOOLS.length} metered paths. The quarantined
            witness path is not advertised.
            Discovery is <strong className="text-foreground">CATALOGUED</strong>
            ; only a completed call is{" "}
            <strong className="text-foreground">RUNTIME_OBSERVED</strong>. It is
            never promoted to MEASURED, REPRODUCED or SIGNED by this interface.
          </p>
        </div>
        <a
          href="/mcp"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:border-emerald-700/35 hover:text-emerald-800"
        >
          MCP discovery{" "}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-emerald-800/15 bg-emerald-50/55 p-4">
          <div className="flex items-center gap-2 text-emerald-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {FREE_TOOLS.length} free tools
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800">
                Read and verify
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-emerald-950/80">
            Live board reads, signed-card verification, card listing,
            public-root reads and Merkle-inclusion checks. Verification remains
            free.
          </p>
          <p className="mt-2 break-words font-mono text-[10px] leading-relaxed text-emerald-900/65">
            {FREE_TOOLS.join(" · ")}
          </p>
        </article>

        <article className="rounded-2xl border border-amber-800/15 bg-amber-50/65 p-4">
          <div className="flex items-center gap-2 text-amber-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {METERED_TOOLS.length} x402 paths
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-900">
                Challenge first
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-amber-950/85">
            Call without payment to inspect the route’s 402 challenge and any
            free preview. Nothing is charged. When a 402 returns, the Pay
            button signs it in your wallet and retries — this page never asks
            for a seed phrase or private key.
          </p>
          <p className="mt-2 break-words font-mono text-[10px] leading-relaxed text-amber-950/65">
            {METERED_TOOLS.join(" · ")}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-3">
        <div className="flex items-start gap-2 px-1 py-1">
          <Braces
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"
            aria-hidden="true"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Schema-aware.</strong> Numbers,
            booleans and JSON objects are sent as their advertised types.
          </p>
        </div>
        <div className="flex items-start gap-2 px-1 py-1">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"
            aria-hidden="true"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">
              No automatic trust claim.
            </strong>{" "}
            A tool response is evidence to inspect, not a grade or
            certification.
          </p>
        </div>
        <div className="flex items-start gap-2 px-1 py-1">
          <CircleDollarSign
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"
            aria-hidden="true"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Payment stays explicit.</strong>{" "}
            The endpoint carries the challenge; the Pay button signs it in your
            wallet. Only the signature is sent.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ToolRunner
          initialToolName={selectedTool}
          initialArguments={initialArguments}
        />
      </div>
    </section>
  );
}
