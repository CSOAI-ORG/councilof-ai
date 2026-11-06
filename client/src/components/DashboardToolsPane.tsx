import { useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import ToolRunner from "./ToolRunner";
import ToolReceiptsPane from "./ToolReceiptsPane";
import { FREE_TOOL_NAMES, PAID_TOOL_NAMES } from "@/lib/mcpTools";

/** Published definitions and runtime discovery are separate sources. */
export const FREE_TOOLS = FREE_TOOL_NAMES;
export const METERED_TOOLS = PAID_TOOL_NAMES;
export const PUBLISHED_TOOL_COUNT = FREE_TOOLS.length + METERED_TOOLS.length;

export default function DashboardToolsPane() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = useMemo(
    () =>
      new URLSearchParams(search.startsWith("?") ? search.slice(1) : search),
    [search],
  );
  const selectedTool = params.get("tool") || undefined;
  const initialArguments = useMemo(
    () =>
      Object.fromEntries(
        [...params.entries()].filter(
          ([name]) => !["tab", "tool", "view", "label"].includes(name),
        ),
      ),
    [params],
  );
  const selectTool = useCallback(
    (name: string) => {
      // Tool identity is shareable. User input and payment payloads stay out of navigation.
      setLocation(
        "/dashboard?" +
          new URLSearchParams({ tab: "tools", tool: name }).toString(),
      );
    },
    [setLocation],
  );

  return (
    <section
      className="mx-auto max-w-6xl px-4 py-6 sm:px-8"
      aria-labelledby="dashboard-tools-title"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Council OS / Tools
          </p>
          <h1
            id="dashboard-tools-title"
            className="mt-2 text-3xl font-semibold tracking-tight text-foreground"
          >
            Your evidence workbench.
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Find a tool, inspect its inputs and run it when you are ready. Keep
            the returned state, source and local run history beside the work.
          </p>
        </div>
        <nav aria-label="Workbench resources" className="flex flex-wrap gap-2">
          <a
            href="#workbench-history"
            className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            Run history
          </a>
          <a
            href="/mcp"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            MCP discovery
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </nav>
      </header>
      <details className="group mt-4 rounded-xl border border-border bg-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-semibold text-muted-foreground">
          About these tools and payment
          <ChevronDown
            className="h-4 w-4 transition group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </summary>
        <div className="grid gap-5 border-t border-border px-4 py-4 text-xs leading-6 text-muted-foreground sm:grid-cols-2">
          <div>
            <h2 className="font-semibold text-foreground">
              Published tool definitions
            </h2>
            <p>
              This release declares {PUBLISHED_TOOL_COUNT} tools:{" "}
              {FREE_TOOLS.length} free reads and {METERED_TOOLS.length} metered
              paths. The runner reads the current callable catalogue from{" "}
              <code>POST /mcp</code>; its discovery count is reported
              separately.
            </p>
            <p>
              Discovery is CATALOGUED. A completed call is RUNTIME_OBSERVED.
              This interface does not promote evidence to MEASURED, REPRODUCED
              or SIGNED.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">
              Payment stays explicit
            </h2>
            <p>
              Metered tools first return their actual 402 challenge and any free
              preview. Inspect the terms before choosing a wallet action. A
              challenge is not a payment or proof of delivery.
            </p>
            <p>
              Verification remains free. A tool reply is evidence to inspect,
              never a grade or certification.
            </p>
          </div>
          <p className="sm:col-span-2">
            Working through a framework? The{" "}
            <a
              href="/tools#governance-library"
              data-testid="tools-pane-govlib-link"
              className="font-semibold text-emerald-800 underline underline-offset-2"
            >
              governance library
            </a>{" "}
            lists deterministic readiness checklists. A checklist is not a
            determination.
          </p>
        </div>
      </details>
      <div id="workbench-runner" className="mt-5 scroll-mt-4">
        <ToolRunner
          initialToolName={selectedTool}
          initialArguments={initialArguments}
          onToolSelect={selectTool}
        />
      </div>
      <div id="workbench-history" className="scroll-mt-4">
        <ToolReceiptsPane />
      </div>
    </section>
  );
}
