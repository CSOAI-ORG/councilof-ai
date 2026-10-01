import { useEffect, useId, useRef, useState } from "react";
import { FOCUS } from "../lobby/glass";
import { lookupRecordUseStatus, verifyRecord, type RecordUseStatus, type RecordVerdict } from "@/lib/recordVerify";
import { InputBoundVerifier } from "@/lib/inputBoundVerification";

type Tally = { ok: number; fail: number };
type UseAwareVerdict = RecordVerdict & { useStatus: RecordUseStatus };

function readTally(value: unknown): Tally | null {
  if (!value || typeof value !== "object") return null;
  const { ok, fail } = value as Partial<Tally>;
  if (typeof ok !== "number" || typeof fail !== "number" ||
      !Number.isSafeInteger(ok) || !Number.isSafeInteger(fail) || ok < 0 || fail < 0 ||
      !Number.isSafeInteger(ok + fail)) return null;
  return { ok, fail };
}

/** Only a completed VALID/INVALID result reaches this explicit opt-in control.
 * Unknown outcomes are not failures. This count is never a measurement or usage proof.
 * A lost acknowledgement does not prove a write failed, so there is no auto-retry.
 */
function TallyOptIn({ ok, variant }: { ok: boolean; variant: "light" | "dark" }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "unknown">("idle");
  const [tally, setTally] = useState<Tally | null>(null);
  const attempted = useRef(false);
  const light = variant === "light";
  const muted = light ? "text-slate-600 forced-colors:text-[CanvasText]" : "text-emerald-100/80 forced-colors:text-[CanvasText]";

  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch("/api/verify-tally", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((value) => { if (live) setTally(readTally(value)); })
      .catch(() => { /* Optional count availability never changes the verdict. */ })
      .finally(() => clearTimeout(timer));
    return () => { live = false; clearTimeout(timer); controller.abort(); };
  }, []);

  const count = tally ? (
    <p className={`text-sm leading-relaxed ${muted}`}>
      {(tally.ok + tally.fail).toLocaleString()} outcomes in the public tally
      ({tally.ok.toLocaleString()} matched · {tally.fail.toLocaleString()} did not) —
      a self-reported, opt-in signal, not a measurement.
    </p>
  ) : null;

  if (state === "sent") return (
    <div className="space-y-1" role="status">
      <p className={`text-sm font-semibold forced-colors:text-[CanvasText] ${light ? "text-emerald-800" : "text-emerald-300"}`}>Counted — thank you.</p>
      {count}
    </div>
  );

  return (
    <div className="space-y-2">
      <p className={`text-sm leading-relaxed ${muted}`}>
        Optional: share only a yes/no outcome. Your record JSON and input hash are not included.
      </p>
      <button
        type="button"
        disabled={state !== "idle"}
        onClick={async () => {
          if (attempted.current) return;
          attempted.current = true;
          setState("sending");
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          try {
            const response = await fetch("/api/verify-tally", {
              method: "POST", signal: controller.signal,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ ok }),
            });
            if (!response.ok) throw new Error("Tally acknowledgement unavailable");
            const value: unknown = await response.json();
            const counts = readTally(value);
            if (!counts || (value as { counted?: unknown }).counted !== true)
              throw new Error("Tally acknowledgement invalid");
            setTally(counts); setState("sent");
          } catch {
            setState("unknown");
          } finally { clearTimeout(timer); }
        }}
        className={`min-h-[44px] min-w-[44px] rounded-lg border px-3 py-2 text-sm disabled:opacity-60 forced-colors:border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:text-[ButtonText] forced-colors:disabled:opacity-100 ${FOCUS} ${
          light ? "border-emerald-700/40 text-emerald-900 hover:bg-emerald-50" : "border-emerald-400/50 text-emerald-100 hover:bg-emerald-500/10"
        }`}
      >
        {state === "sending" ? "Adding…" : state === "unknown" ? "Tally confirmation unavailable" : "Add result to public tally (optional)"}
      </button>
      {state === "unknown" && (
        <p className={`text-sm leading-relaxed forced-colors:text-[CanvasText] ${light ? "text-amber-800" : "text-amber-200"}`} role="alert">
          Tally update not confirmed. It may have reached the service, so it will not be sent again automatically.
          Your record JSON was not included, and your verification result is unchanged.
        </p>
      )}
      {count}
    </div>
  );
}

export default function RecordVerifyForm({ variant = "dark", seed, seedNonce, onVerdict, onInputChange, autoVerify = false }: {
  variant?: "light" | "dark";
  /** Host-provided original text; editable. Verified automatically only when autoVerify is set. */
  seed?: string;
  /** Verify the seed as soon as it loads. Only for a record the reader asked for by URL
   *  (/gspc-verify/?card=…); the seed is still the unaltered fetched bytes. */
  autoVerify?: boolean;
  /** Allows the same host-provided record to be loaded again. */
  seedNonce?: number;
  /** Called only for a completed, current-input verdict, never a click. */
  onVerdict?: (v: RecordVerdict) => void;
  /** Called when a reader edits or clears the input, so the host can discard source labels tied to earlier bytes. */
  onInputChange?: () => void;
}) {
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<{ result: UseAwareVerdict; inputHash: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(false);
  const [notice, setNotice] = useState("Paste a record to begin. Nothing has been checked yet.");
  const verifier = useRef(new InputBoundVerifier<UseAwareVerdict>());
  const attempt = useRef(0);
  const field = useRef<HTMLTextAreaElement>(null);
  const light = variant === "light";
  const fieldId = useId();
  const helpId = `${fieldId}-help`;
  const resultId = `${fieldId}-result`;
  const muted = light ? "text-slate-600 forced-colors:text-[CanvasText]" : "text-emerald-100/80 forced-colors:text-[CanvasText]";

  useEffect(() => () => { attempt.current += 1; verifier.current.invalidate(); }, []);

  useEffect(() => {
    if (typeof seed === "string") {
      attempt.current += 1; verifier.current.invalidate();
      setText(seed); setVerdict(null); setBusy(false); setFailure(false);
      setNotice(seed.trim() ? "Record loaded. This text has not been checked." : "Ready for a record. Nothing has been checked.");
      if (autoVerify && seed.trim()) void run(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, seedNonce]);

  const run = async (input?: string) => {
    const value0 = typeof input === "string" ? input : text;
    if ((busy && typeof input !== "string") || !value0.trim()) return;
    const current = ++attempt.current;
    setBusy(true); setFailure(false); setVerdict(null);
    setNotice("Checking this record. An optional public-key cross-check may take up to three seconds.");
    let bound: { result: UseAwareVerdict; inputHash: string } | null;
    try {
      bound = await verifier.current.run(value0, async (value) => {
        const [signature, useStatus] = await Promise.all([
          verifyRecord(value),
          lookupRecordUseStatus(value),
        ]);
        return { ...signature, useStatus };
      });
    } catch {
      if (current !== attempt.current) return;
      setBusy(false); setFailure(true); setNotice("Check not completed. Your input is unchanged.");
      return;
    }
    if (!bound || current !== attempt.current) return;
    setVerdict(bound); setBusy(false);
    setNotice(`Check complete: ${bound.result.state}. Read the result and its limits below.`);
    onVerdict?.(bound.result);
  };

  const edit = (next: string) => {
    attempt.current += 1; verifier.current.invalidate();
    onInputChange?.();
    setText(next); setVerdict(null); setBusy(false); setFailure(false);
    setNotice(next.trim() ? "Input changed. This text has not been checked." : "Ready for a record. Nothing has been checked.");
  };

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <label htmlFor={fieldId} className={`mb-2 block text-base font-semibold forced-colors:text-[CanvasText] ${light ? "text-slate-900" : "text-emerald-50"}`}>Record JSON</label>
        <p id={helpId} className={`mb-3 max-w-[65ch] text-sm leading-relaxed ${muted}`}>
          Paste one original record. The check runs in this browser; the record is not uploaded.
          A separate request may read published public-key metadata. Editing clears the previous result.
        </p>
        <textarea
          ref={field} id={fieldId} value={text} onChange={(event) => edit(event.target.value)}
          aria-describedby={helpId}
          aria-invalid={verdict?.result.reasons.includes("parse_error") || undefined}
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          placeholder="Paste one complete JSON record here"
          className={`min-h-[176px] w-full rounded-xl border p-3 font-mono text-base leading-relaxed forced-colors:border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:placeholder:text-[GrayText] ${FOCUS} ${
            light ? "border-slate-400 bg-white text-slate-900 placeholder:text-slate-600 [color-scheme:light]"
              : "border-emerald-500/50 bg-[#03110b] text-emerald-100 placeholder:text-emerald-100/70 [color-scheme:dark]"
          }`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void run()} disabled={busy || !text.trim()}
          className={`min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 forced-colors:border forced-colors:border-[ButtonText] forced-colors:bg-[ButtonFace] forced-colors:text-[ButtonText] forced-colors:disabled:opacity-100 ${FOCUS} ${
            light ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-emerald-400 text-[#03110b] hover:bg-emerald-300"
          }`}>{busy ? "Verifying…" : "Verify this record"}</button>
        <button type="button" disabled={!text} onClick={() => { edit(""); field.current?.focus(); }}
          className={`min-h-[44px] min-w-[44px] rounded-lg border px-3 py-2 text-sm disabled:opacity-50 forced-colors:border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:text-[ButtonText] forced-colors:disabled:opacity-100 ${FOCUS} ${
            light ? "border-slate-400 text-slate-800 hover:bg-slate-50" : "border-emerald-500/50 text-emerald-100 hover:bg-emerald-500/10"
          }`}>Clear record</button>
      </div>
      <p className={`text-sm leading-relaxed ${muted}`} role="status" aria-live="polite" aria-atomic="true">{notice}</p>
      {failure && <p role="alert" className={`text-sm leading-relaxed forced-colors:text-[CanvasText] ${light ? "text-amber-800" : "text-amber-200"}`}>
        This browser could not finish the check. Your text is unchanged. Try again, or open the verifier in an up-to-date browser.
        No VALID or INVALID result has been established.
      </p>}
      {verdict && (
        <section key={`${verdict.inputHash}-${verdict.result.state}`} aria-labelledby={resultId}
          className={`min-w-0 space-y-3 rounded-xl border p-4 forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] ${light ? "border-slate-300 bg-slate-50" : "border-emerald-500/30 bg-[#03110b]"}`}>
          <p id={resultId} data-testid="record-verdict-headline" className={`text-base font-semibold leading-relaxed forced-colors:text-[CanvasText] ${
            verdict.result.state === "VALID" ? light ? "text-emerald-800" : "text-emerald-200"
              : verdict.result.state === "INVALID" ? light ? "text-red-800" : "text-red-200"
                : light ? "text-amber-800" : "text-amber-200"
          }`}>
            {verdict.result.state === "VALID" ? "✓ VALID — " : verdict.result.state === "INVALID" ? "✗ INVALID — " : "○ UNCHECKABLE — "}
            {verdict.result.state === "VALID"
              ? verdict.result.lines.some((line) => line.code === "signature_valid")
                ? "this record reproduces its own id and its signature checks out against a published key."
                : "this record reproduces its declared id, but it carries no signature — a hash match only, not proof of who wrote it."
              : verdict.result.state === "INVALID" ? "a check ran and failed. The check details identify the mismatch."
                : "the check could not be completed. This is not a finding that the record is forged."}
          </p>
          {verdict.result.useStatus.state !== "NOT_APPLICABLE" && (
            <div
              data-testid="record-use-status"
              className={`rounded-lg border p-3 text-[13px] forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] ${verdict.result.useStatus.state === "WITHDRAWN"
                ? light ? "border-red-400 bg-red-50 text-red-900" : "border-red-400/60 bg-red-500/10 text-red-100"
                : light ? "border-amber-400 bg-amber-50 text-amber-900" : "border-amber-400/60 bg-amber-500/10 text-amber-100"}`}
            >
              <strong>Use status: {verdict.result.useStatus.state === "WITHDRAWN"
                ? "WITHDRAWN"
                : verdict.result.useStatus.state === "UNCHECKABLE" ? "UNCHECKABLE" : "NOT ESTABLISHED"}.</strong>{" "}
              {verdict.result.useStatus.detail}
              {verdict.result.useStatus.reference && (
                <> <a className="underline underline-offset-2" href={verdict.result.useStatus.reference}>Read the public withdrawal record</a>.</>
              )}
            </div>
          )}
          <p className={`text-sm leading-relaxed ${muted}`}>
            {verdict.result.state === "VALID" ? "This result is not certification. Review source dates, admission and corrections before relying on the evidence."
              : verdict.result.state === "INVALID" ? "Compare this record with the original source. Do not change it merely to make the check pass."
                : verdict.result.reasons.includes("parse_error") ? "Check that you pasted one complete JSON record, without a code fence or surrounding explanation. Correct the text and verify again."
                  : "Use a supported original record or ask its publisher for verification instructions. Review the check details before trying again."}
          </p>
          <p className={`break-all font-mono text-xs leading-relaxed ${muted}`}>Input SHA-256: {verdict.inputHash}</p>
          <details open={verdict.result.state !== "VALID"} className={`min-w-0 text-sm forced-colors:text-[CanvasText] ${light ? "text-slate-800" : "text-emerald-100"}`}>
            <summary className={`min-h-[44px] cursor-pointer rounded-md py-3 font-semibold forced-colors:text-[CanvasText] ${FOCUS}`}>Check details ({verdict.result.lines.length})</summary>
            <div className="space-y-2">
              {verdict.result.lines.map((line, index) => <div key={`${line.code}-${index}`} className="flex min-w-0 items-start gap-2 leading-relaxed">
                <span aria-hidden="true">{line.ok === true ? "✓" : line.ok === false ? "✗" : "○"}</span>
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="sr-only">{line.ok === true ? "Pass: " : line.ok === false ? "Fail: " : "Not checked: "}</span>
                  <strong>{line.label}:</strong> {line.detail}
                </span>
              </div>)}
            </div>
          </details>
          {verdict.result.state !== "UNCHECKABLE" && <TallyOptIn ok={verdict.result.state === "VALID"} variant={variant}/>}
        </section>
      )}
    </div>
  );
}
