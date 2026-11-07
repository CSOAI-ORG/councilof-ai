import { useEffect, useId, useState } from "react";
import type { AIExecutionSelection } from "../../../../functions/_lib/aiExecutionSelection";

type Props = {
  value: AIExecutionSelection;
  onChange: (selection: AIExecutionSelection) => void;
  disabled?: boolean;
};
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";
const CONTROL = "min-h-11 rounded-lg border border-border bg-background px-3 text-sm";
type Catalogue = { tools: string[] };

export function parseConversationCatalogue(raw: unknown): Catalogue {
  if (!raw || typeof raw !== "object") throw new Error("The tool catalogue is unavailable.");
  const value = raw as Record<string, unknown>;
  const execution = value.execution as Record<string, unknown> | undefined;
  if (value.schema !== "csoai.agui-run/0.1" || execution?.version !== 1 ||
    execution.host !== "cloud" || execution.provider !== "council-tools" || execution.connectivity !== "online" ||
    !Array.isArray(execution.tools) || execution.tools.length > 256 ||
    execution.tools.some(tool => typeof tool !== "string" || !/^[a-zA-Z0-9_.-]{1,128}$/.test(tool)) ||
    new Set(execution.tools).size !== execution.tools.length) {
    throw new Error("This server has not enabled conversation tool controls.");
  }
  return { tools: [...execution.tools] as string[] };
}

/** Shared controlled view. The host snapshots this preference separately for every request. */
export default function AIAndToolsControl({ value, onChange, disabled = false }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setError("");
    setCatalogue(null);
    void fetch("/api/agui/run", { signal: controller.signal, cache: "no-store", redirect: "error" })
      .then(async response => {
        if (!response.ok) throw new Error("The tool catalogue could not be read.");
        const mime = response.headers.get("content-type") ?? "";
        if (!mime.includes("application/json")) throw new Error("The tool catalogue is unavailable.");
        return parseConversationCatalogue(await response.json());
      })
      .then(result => { if (!controller.signal.aborted) setCatalogue(result); })
      .catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "The tool catalogue is unavailable."); });
    return () => controller.abort();
  }, [open, reload]);
  const selected = value.enabledTools;
  const stale = catalogue && selected !== null ? selected.filter(tool => !catalogue.tools.includes(tool)) : [];
  const summary = selected === null ? "Published tools" : selected.length + " tools selected";
  return (
    <div className="my-3 rounded-xl border border-border bg-card p-3" data-testid="ai-tools-control">
      <button type="button" aria-expanded={open} aria-controls={id}
        className={"flex min-h-11 w-full flex-wrap items-center justify-between gap-2 text-left " + FOCUS}
        onClick={() => setOpen(current => !current)}>
        <span className="font-semibold">AI &amp; tools</span>
        <span className="text-xs text-muted-foreground">Online · Council tools · {summary}</span>
      </button>
      {open ? <div id={id} className="mt-3 space-y-4">
        <p className="text-xs text-muted-foreground">These settings apply to the next public Council question. Company cases and tools opened separately keep their own controls.</p>
        <fieldset disabled={disabled || !catalogue} className="space-y-2">
          <legend className="text-sm font-semibold">Tools for this conversation</legend>
          <p className="text-xs text-muted-foreground">Selecting a tool permits it in a question; existing approval and payment checks still apply. “None” blocks planned tool calls, including page actions.</p>
          {catalogue ? <>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={CONTROL + " " + FOCUS} onClick={() => onChange({ ...value, enabledTools: [...catalogue.tools] })}>Select published tools</button>
              <button type="button" className={CONTROL + " " + FOCUS} onClick={() => onChange({ ...value, enabledTools: [] })}>Select none</button>
            </div>
            <label className="grid gap-1 text-sm">Find a tool
              <input value={query} onChange={event => setQuery(event.target.value)} className={CONTROL + " " + FOCUS} type="search" />
            </label>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              {catalogue.tools.filter(tool => tool.toLowerCase().includes(query.trim().toLowerCase())).map(tool =>
                <label key={tool} className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm">
                  <input type="checkbox" className={FOCUS} checked={selected === null || selected.includes(tool)}
                    onChange={event => {
                      const before = selected ?? catalogue.tools;
                      onChange({ ...value, enabledTools: event.target.checked ? [...before, tool] : before.filter(name => name !== tool) });
                    }} />
                  <span className="break-all">{tool.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, (_match, first, second) => first + " " + second)}</span>
                </label>)}
              {!catalogue.tools.some(tool => tool.toLowerCase().includes(query.trim().toLowerCase())) ? <p className="p-3 text-sm">No matching tools.</p> : null}
            </div>
          </> : <p className="text-sm" role="status">{error || "Reading the published tool catalogue…"}</p>}
        </fieldset>
        {error ? <button type="button" className={CONTROL + " " + FOCUS} onClick={() => setReload(current => current + 1)}>Retry catalogue</button> : null}
        {stale.length ? <p role="alert" className="text-sm text-amber-900">Some selected tools are no longer published. Select the current published tools or choose none before sending.</p> : null}
        <p className="text-xs text-muted-foreground" role="status">{disabled ? "A question is running. Tool settings are held until it finishes." : "Selections stay in this panel for this visit. They do not replay an earlier question."}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <a className={"inline-flex min-h-11 items-center underline " + FOCUS} href="/connect">Connect platforms and plugins</a>
          <a className={"inline-flex min-h-11 items-center underline " + FOCUS} href="/dashboard?tab=fabric">Connection readiness</a>
        </div>
      </div> : null}
    </div>
  );
}
