import { createElement, useEffect, useState } from "react";

const COMPONENT_VERSION = "0.2.1";
type ReaderConstructor = CustomElementConstructor & { componentVersion?: string; componentProtocol?: string };
const registeredReaderState = () => {
  const reader = customElements.get("council-safe-companion") as ReaderConstructor | undefined;
  return !reader ? null : reader.componentVersion === COMPONENT_VERSION
    && reader.componentProtocol === "csoai.safe-companion.mount/1" ? "ready" : "conflict";
};

/** A local reader in the existing learning surface. It receives no host context. */
export default function SafeExportReview() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error" | "conflict">("idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    const existing = registeredReaderState();
    if (existing) { setState(existing); return; }
    setState("loading");
    let script = document.querySelector<HTMLScriptElement>('script[data-council-safe-companion="1"]');
    if (script?.dataset.failed === "1") { script.remove(); script = null; }
    const created = !script;
    if (!script) {
      script = document.createElement("script");
      script.type = "module";
      script.src = `/safe-companion/element.mjs?v=${COMPONENT_VERSION}&retry=${attempt}`;
      script.dataset.councilSafeCompanion = "1";
    }
    const loaded = () => {
      const registered = registeredReaderState();
      if (registered) setState(registered);
      else failed();
    };
    const failed = () => { if (script) script.dataset.failed = "1"; setState("error"); };
    script.addEventListener("load", loaded);
    script.addEventListener("error", failed);
    if (created) document.head.appendChild(script);
    const timeout = window.setTimeout(() => {
      if (!customElements.get("council-safe-companion")) failed();
    }, 15000);
    return () => {
      window.clearTimeout(timeout);
      script?.removeEventListener("load", loaded);
      script?.removeEventListener("error", failed);
    };
  }, [open, attempt]);

  return (
    <details className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-slate-100"
      data-testid="safe-export-review" onToggle={event => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
        Review a SAFE export
      </summary>
      <p className="my-3 text-sm text-slate-300">
        Inspect a local export, compare versions or reopen a saved check. For restricted files,
        use the standalone reader in a trusted browser.
      </p>
      <a className="mb-3 inline-block underline" href="/safe-companion/" target="_blank" rel="noopener noreferrer">
        Open standalone reader
      </a>
      {open && state === "loading" && <p role="status">Loading the local reader…</p>}
      {open && state === "error" && <div role="alert">
        <p>The reader could not load. Your file has not been selected or inspected.</p>
        <button type="button" className="mt-2 rounded border border-slate-500 px-3 py-2"
          onClick={() => setAttempt(value => value + 1)}>Retry reader</button>
      </div>}
      {open && state === "conflict" && <p role="alert">
        A different reader version is already loaded on this page. Open the standalone reader to continue with this version.
      </p>}
      {open && state === "ready" && createElement("council-safe-companion")}
    </details>
  );
}
