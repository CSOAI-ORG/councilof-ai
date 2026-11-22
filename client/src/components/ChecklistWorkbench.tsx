import { useCallback, useEffect, useMemo, useState } from "react";
import { PenLine, RefreshCw, ShieldCheck } from "lucide-react";
import { callTool, sealArtifact } from "@/lib/sovTools";
import { READINESS_FRAMEWORKS } from "@/lib/mcpTools";
import { recordToolReceipt, hashArgs } from "@/lib/toolReceipts";

/**
 * ChecklistWorkbench — work through a framework_readiness checklist in the browser and seal
 * your own answers (2026-11-03, lane csoai-frontend-consol, plan item U1).
 *
 * The flow, honestly bounded:
 *   1. pick a framework; the checklist is fetched LIVE from the tools door (the same
 *      framework_readiness tool the MCP and A2A doors serve — no second copy of the content);
 *   2. tick items as you have evidence for them (everything the item asks: the provision, the
 *      requirement, the question it opens);
 *   3. "seal my answers" hands the completed answer document to POST /api/sign, which returns
 *      the estate's Ed25519 artifact seal plus a content fingerprint.
 *
 * WHAT THE SEAL IS. Per /api/sign's own contract: "the estate's server saw exactly these bytes
 * at time T" — a timestamped, tamper-evident fingerprint of YOUR answers. It measures nothing
 * about your compliance, certifies nothing, and carries no estate endorsement of the content.
 * This component says that on its face, next to the result, and in the sealed document itself.
 *
 * WHAT LEAVES THE BROWSER. The checklist fetch is a read; the seal posts the answer document you
 * explicitly submit. Ticks before sealing stay local. The run is also recorded in your local
 * receipts (toolReceipts), like every other tool execution in this workspace.
 */

type Item = { id: string; provision: string; requirement: string; opens_question: string };
type Checklist = {
  state: string;
  framework: string;
  framework_label: string | null;
  header: string | null;
  item_count: number;
  items: Item[];
  estate_links?: Array<Record<string, string>>;
  not_a_certification?: boolean;
};
type Sealed = { fingerprint: string; signature_prefix: string; at: string; bytes: number };

const ANSWERS_SCHEMA = "csoai.readiness-answers/1";

export function buildAnswerDocument(
  framework: string,
  items: Item[],
  done: Set<string>,
  answered_at: string,
): Record<string, unknown> {
  return {
    schema: ANSWERS_SCHEMA,
    not_a_certification: true,
    what_this_is:
      "The caller's own answers to a framework_readiness checklist: which items they marked as having evidence for. The estate sealed these bytes at the time shown; it measured nothing about the caller's compliance and certifies nothing.",
    framework,
    answered_at,
    answered_count: done.size,
    item_count: items.length,
    answers: items.map((i) => ({
      id: i.id,
      provision: i.provision,
      has_evidence: done.has(i.id),
    })),
  };
}

export default function ChecklistWorkbench({ framework }: { framework?: string }) {
  const [fw, setFw] = useState(framework ?? READINESS_FRAMEWORKS[0] ?? "eu-ai-act");
  const [state, setState] = useState<"idle" | "loading" | "working" | "sealing" | "sealed" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [sealed, setSealed] = useState<Sealed | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (framework) setFw(framework);
  }, [framework]);

  const load = useCallback(async (id: string) => {
    setBusy(true);
    setError(null);
    setSealed(null);
    setChecklist(null);
    setDone(new Set());
    setState("loading");
    try {
      const r = await callTool("framework_readiness", { framework: id });
      const sc = (r.raw?.result?.structuredContent ??
        r.raw?.structuredContent ??
        null) as Checklist | null;
      if (!sc || sc.state !== "OK" || !Array.isArray(sc.items) || !sc.items.length) {
        setState("error");
        setError("The door did not return a checklist for this framework. Nothing invented in its place.");
        return;
      }
      setChecklist(sc);
      setState("working");
    } catch {
      setState("error");
      setError("Could not reach the tools door. Nothing invented in its place.");
    } finally {
      setBusy(false);
    }
  }, []);

  const seal = useCallback(async () => {
    if (!checklist) return;
    setBusy(true);
    setState("sealing");
    try {
      const doc = buildAnswerDocument(
        checklist.framework,
        checklist.items,
        done,
        new Date().toISOString(),
      );
      const message = JSON.stringify(doc, null, 2);
      const r = await sealArtifact(message);
      if (!r.ok) {
        setState("error");
        setError(r.text || "The seal did not complete. Nothing was claimed in its place.");
        return;
      }
      const fp = /([0-9a-f]{16,64}|COAI:[A-Za-z0-9+/=_-]{8,})/.exec(r.text)?.[1] ?? "sealed";
      setSealed({
        fingerprint: fp,
        signature_prefix: r.text.slice(0, 160),
        at: doc.answered_at as string,
        bytes: message.length,
      });
      setState("sealed");
      // The seal is recorded in the local receipts like any other run (P5's log).
      void hashArgs({ framework: checklist.framework, answers: doc.answers }).then((h) =>
        recordToolReceipt({ tool: "framework-readiness seal (/api/sign)", argsHash: h, outcome: "SEALED" }),
      );
    } finally {
      setBusy(false);
    }
  }, [checklist, done]);

  const progress = useMemo(
    () => (checklist ? Math.round((done.size / checklist.items.length) * 100) : 0),
    [checklist, done],
  );

  if (!READINESS_FRAMEWORKS.length) return null;

  return (
    <section
      aria-labelledby="cwb-h"
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"
      data-testid="checklist-workbench"
    >
      <h3 id="cwb-h" className="flex items-center gap-2 text-base font-bold text-slate-900">
        <PenLine className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        Work through a checklist here
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Fetch a checklist from the live door, mark the items you hold evidence for, and seal your
        answers. The seal is the estate's Ed25519 artifact seal:{" "}
        <strong>it says the server saw exactly your bytes at a time — it measures nothing about
        your compliance and certifies nothing.</strong>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="cwb-fw" className="text-sm font-semibold text-slate-700">Framework</label>
        <select
          id="cwb-fw"
          value={fw}
          onChange={(e) => setFw(e.target.value)}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
          data-testid="cwb-framework"
        >
          {READINESS_FRAMEWORKS.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load(fw)}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
          data-testid="cwb-load"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> {busy && state === "loading" ? "Fetching…" : "Fetch the checklist"}
        </button>
      </div>

      {state === "error" ? (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="cwb-error">
          {error}
        </p>
      ) : null}

      {checklist ? (
        <>
          <p className="mt-4 text-sm text-slate-600" data-testid="cwb-header">
            {checklist.framework_label} — {checklist.item_count} items ·{" "}
            <span className="font-semibold">{done.size} marked</span> ({progress}%).
            Ticking means <em>you hold the evidence the item names</em> — the tool cannot check that for you.
          </p>
          <ul className="mt-3 list-none space-y-2 p-0" aria-label="Checklist items">
            {checklist.items.map((item) => {
              const checked = done.has(item.id);
              return (
                <li
                  key={item.id}
                  className={`rounded-xl border px-4 py-3 ${checked ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white"}`}
                  data-testid={`cwb-item-${item.id}`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = new Set(done);
                        if (checked) next.delete(item.id);
                        else next.add(item.id);
                        setDone(next);
                      }}
                      className="mt-1 h-4 w-4 accent-emerald-700"
                      aria-label={`I hold evidence for ${item.id}`}
                    />
                    <span className="min-w-0 text-sm leading-6 text-slate-800">
                      <span className="font-semibold">{item.provision}</span>
                      <span className="block text-slate-600">{item.requirement}</span>
                      <span className="block text-xs text-slate-500">Opens: {item.opens_question}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void seal()}
              disabled={busy || done.size === 0}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-emerald-800/40 bg-emerald-50 px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
              data-testid="cwb-seal"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {state === "sealing" ? "Sealing…" : `Seal my answers (${done.size}/${checklist.items.length})`}
            </button>
            <span className="text-xs text-slate-500">Sealing posts your answer document to /api/sign. Ticks stay local until you seal.</span>
          </div>
        </>
      ) : null}

      {state === "sealed" && sealed ? (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4" data-testid="cwb-sealed">
          <p className="text-sm font-bold text-emerald-950">Sealed.</p>
          <p className="mt-1 break-all font-mono text-xs text-emerald-900">
            fingerprint {sealed.fingerprint} · {sealed.bytes} bytes · {sealed.at}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-emerald-800">{sealed.signature_prefix}…</p>
          <p className="mt-2 text-xs leading-5 text-emerald-900">
            The seal says the estate's server saw exactly these bytes at this time. It is not a
            measurement of your compliance, a certification, or legal advice — it is a tamper-evident
            timestamp over the answers you submitted.
          </p>
        </div>
      ) : null}
    </section>
  );
}
