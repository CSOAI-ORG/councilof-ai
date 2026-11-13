import { createElement, useEffect, useState } from "react";
import SafeExportReview from "./SafeExportReview";

/** The same public-source reader and synthetic lesson runner used by the private
 * research hub. Native Council OS shell; no cross-origin iframe or private data.
 * Local drafts are not canonical evidence events, a case store or a human decision. */
export default function DashboardEvidenceLearningPane() {
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (customElements.get("council-evidence-learning")) {
      setState("ready");
      return;
    }
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-council-evidence-learning="1"]',
    );
    const loaded = () => setState(customElements.get("council-evidence-learning") ? "ready" : "error");
    const failed = () => setState("error");
    const created = !script;
    if (!script) {
      script = document.createElement("script");
      script.type = "module";
      // Asset revision follows rendered bytes; v tracks the compatible local-state protocol.
      script.src = "/evidence-learning/element.js?v=0.3.0&rev=d86d5307e36e";
      script.dataset.councilEvidenceLearning = "1";
    }
    script.addEventListener("load", loaded);
    script.addEventListener("error", failed);
    if (created) document.head.appendChild(script);
    const timeout = window.setTimeout(() => {
      if (!customElements.get("council-evidence-learning")) failed();
    }, 15000);
    return () => {
      window.clearTimeout(timeout);
      script?.removeEventListener("load", loaded);
      script?.removeEventListener("error", failed);
    };
  }, [attempt]);
  return (
    <section className="mx-auto max-w-6xl p-4 md:p-6" data-testid="evidence-learning-pane">
      {state === "loading" && <p role="status">Loading the evidence and learning workspace…</p>}
      {state === "error" && (
        <div role="alert" className="rounded-lg border p-5 text-sm">
          <p>The evidence and learning component could not load. No current state is assumed.</p>
          <button type="button" className="mt-3 mr-4 rounded border px-3 py-2" onClick={() => {
            document.querySelector('script[data-council-evidence-learning="1"]')?.remove();
            setState("loading");
            setAttempt((value) => value + 1);
          }}>Retry loading</button>
          <a href="/dashboard?tab=learn" className="mt-3 inline-block underline">Open the existing learning arena</a>
        </div>
      )}
      {state === "ready" && createElement("council-evidence-learning")}
      <SafeExportReview />
    </section>
  );
}
