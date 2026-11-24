import { useState } from "react";
import { renderOperatingView, summarizeReactionCases } from "../../../measurement/experiments/reaction-bridge/operating-view.mjs";

const MAX_BYTES = 256 * 1024;
const DEMO = JSON.stringify([{
  schema: "csoai.reaction-experiment/0.1",
  realm: "SIMULATED",
  condition: "NO_HUMAN",
  experiment_id: "synthetic-example",
  case_id: "case-1",
  input_sha256: "a".repeat(64),
  method_sha256: "b".repeat(64),
  stages: {},
}], null, 2);

/** Read-only, browser-local CouncilOS projection.
 * The inputs are self-reported event pointers. It never authenticates a human,
 * creates a canonical record, fetches, executes, signs, submits or stores data. */
export default function ReactionResearchReview() {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState("No evidence reviewed. All acceptance states remain unknown.");
  const review = () => {
    try {
      if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) {
        throw new Error("Input exceeds the 256 KiB local-only limit.");
      }
      setResult(renderOperatingView(summarizeReactionCases(JSON.parse(raw))));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "invalid input";
      setResult("REVIEW REFUSED: " + reason + "\nNothing was accepted, verified, executed or submitted.");
    }
  };
  return (
    <details
      data-testid="reaction-research-review"
      className="mt-6 rounded-xl border border-emerald-700/30 bg-white p-4 text-slate-900 shadow-sm md:p-6"
    >
      <summary className="cursor-pointer text-base font-bold text-emerald-900">
        Reaction research · with/without human · read-only
      </summary>
      <p className="mt-3 text-sm leading-relaxed">
        Examine self-reported experiment pointers and missing stages. Simulation never becomes a measured
        outcome. Reported approval is not authenticated human authorization. This is not a live Council
        decision, independent verifier, customer acceptance or model tool.
      </p>
      <label htmlFor="council-reaction-episode-json" className="mt-4 block text-sm font-semibold">
        JSON episode array (public or synthetic, non-sensitive records only)
      </label>
      <textarea
        id="council-reaction-episode-json"
        value={raw}
        onChange={event => setRaw(event.target.value)}
        rows={7}
        maxLength={MAX_BYTES}
        spellCheck={false}
        autoComplete="off"
        className="mt-2 w-full resize-y rounded-lg border border-emerald-800/40 bg-emerald-50 p-3 font-mono text-xs text-slate-900"
        aria-describedby="council-reaction-local-note"
      />
      <p id="council-reaction-local-note" className="text-xs text-slate-700">
        Processed in this browser only. No upload, storage, payment, signing, network request, scheduler
        or execution. Do not enter private case details, credentials, customer data or personal data.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={review} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900">
          Review reported stages
        </button>
        <button type="button" onClick={() => {setRaw(DEMO); setResult("Synthetic example loaded. Nothing has been verified.");}} className="rounded-lg border border-emerald-800 px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Load synthetic example
        </button>
        <button type="button" onClick={() => {setRaw(""); setResult("Cleared. No evidence reviewed.");}} className="rounded-lg border border-slate-400 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Clear local input
        </button>
      </div>
      <h3 className="mt-5 text-sm font-semibold">Unqualified evidence-stage readback</h3>
      <pre role="status" aria-live="polite" className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-emerald-950 p-3 text-xs leading-5 text-white">{result}</pre>
    </details>
  );
}
