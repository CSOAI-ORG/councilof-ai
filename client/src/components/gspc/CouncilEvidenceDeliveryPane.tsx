import { useEffect, useMemo, useRef, useState } from "react";

type Json = Record<string, unknown>;
const record = (value: unknown): Json | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : null;

/** Accept only the module's prepared Evidence Delivery request. The server repeats
 * full draft validation; this boundary never trusts a caller-supplied endpoint. */
export function evidenceHandoffRequest(payload: unknown): Json {
  const handoff = record(payload);
  if (handoff?.schema !== "council-os.a2a-evidence-handoff/1.1" || handoff.handoff_state !== "PREPARED_NOT_SUBMITTED") {
    throw new Error("Unsupported evidence handoff");
  }
  const request = record(handoff.request);
  const message = record(record(request?.params)?.message);
  const parts = Array.isArray(message?.parts) ? message.parts : [];
  const data = record(record(parts[0])?.data);
  if (request?.jsonrpc !== "2.0" || request.method !== "SendMessage" ||
      (typeof request.id !== "string" && typeof request.id !== "number") ||
      !record(message) || parts.length !== 1 || data?.skill !== "evidence-delivery" || !record(data.input)) {
    throw new Error("Handoff must be one Evidence Delivery SendMessage request");
  }
  return request;
}

/** Same-origin by construction. No remote request occurs until the user presses Submit. */
export async function submitEvidenceHandoff(
  payload: unknown,
  fetcher: typeof fetch = fetch,
): Promise<Json> {
  const request = evidenceHandoffRequest(payload);
  const response = await fetcher("/api/a2a", {
    method: "POST",
    credentials: "omit",
    headers: { "content-type": "application/json", "a2a-version": "1.0" },
    body: JSON.stringify(request),
  });
  const body = record(await response.json());
  const message = record(record(body?.result)?.message);
  if (!response.ok || !message || body?.error) {
    const error = record(body?.error);
    throw new Error(typeof error?.message === "string" ? error.message : `Council A2A returned HTTP ${response.status}`);
  }
  return message;
}

/** Native Council Dashboard pane around the published static module. Preparing a
 * handoff and submitting it are separate, explicit states. No Task store is invented. */
export default function CouncilEvidenceDeliveryPane() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState("CONNECTING");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const moduleOrigin = "https://b5o4e267xnlai.kimi.page";
  const source = useMemo(() => `${moduleOrigin}/?embed=1&host_origin=${encodeURIComponent(window.location.origin)}`, []);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== moduleOrigin || event.source !== frame.current?.contentWindow) return;
      const data = event.data as { protocol?: string; type?: string; payload?: { receipt_id?: string } };
      if (data.protocol !== "council-os.evidence-bridge/v1") return;
      if (data.type === "ready") setState("READY");
      if (data.type === "draft-ready") {
        setState("LOCAL_DRAFT_READY");
        setReceipt(data.payload?.receipt_id ?? null);
        setHandoff(null);
        setError(null);
      }
      if (data.type === "handoff-ready") {
        try {
          evidenceHandoffRequest(data.payload);
          setHandoff(data.payload);
          setState("PREPARED_NOT_SUBMITTED");
          setError(null);
        } catch (cause) {
          setHandoff(null);
          setState("HOST_ACTION_REQUIRED");
          setError(cause instanceof Error ? cause.message : "Invalid evidence handoff");
        }
      }
      if (data.type === "error") setState("HOST_ACTION_REQUIRED");
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  const submit = async () => {
    if (!handoff || busy) return;
    setBusy(true);
    setError(null);
    setState("SUBMITTING_UNSIGNED_DRAFT");
    try {
      const message = await submitEvidenceHandoff(handoff);
      const parts = Array.isArray(message.parts) ? message.parts : [];
      const result = record(record(parts[1])?.data);
      setReceipt(typeof result?.receipt_id === "string" ? result.receipt_id : receipt);
      setState("MESSAGE_RECEIVED_UNSIGNED");
    } catch (cause) {
      setState("SUBMISSION_FAILED");
      setError(cause instanceof Error ? cause.message : "Council A2A submission failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-background" data-testid="council-evidence-delivery-pane">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">Council OS / Evidence Delivery</p>
          <p className="mt-1 text-xs text-muted-foreground">Local evidence and MEOK H.I.M. review. Submission returns an unsigned A2A Message; it does not measure, sign, anchor or durably store the evidence.</p>
        </div>
        <output className="rounded-lg bg-emerald-50 px-3 py-2 font-mono text-[10px] font-bold text-emerald-900" aria-live="polite">{state}</output>
        {receipt ? <code className="max-w-full truncate text-[10px] text-muted-foreground">{receipt}</code> : null}
        {handoff ? (
          <button type="button" onClick={submit} disabled={busy} className="min-h-11 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {busy ? "Submitting…" : "Submit unsigned draft to Council A2A"}
          </button>
        ) : null}
      </header>
      {state === "MESSAGE_RECEIVED_UNSIGNED" ? <p className="border-b border-border px-4 py-2 text-xs text-emerald-900">Council A2A returned a Message. Envelope checks passed; source bytes were not re-hashed. No GSPC measurement, certification, signature, anchor or durable storage was created.</p> : null}
      {error ? <p role="alert" className="border-b border-border px-4 py-2 text-xs text-red-800">{error}</p> : null}
      <iframe
        ref={frame}
        src={source}
        title="Council OS Evidence Delivery"
        className="min-h-0 w-full flex-1 border-0"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-modals"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}
