import { useEffect, useId, useRef, useState } from "react";
import { FOCUS } from "../lobby/glass";
import { lookupRecordUseStatus, verifyRecord, type RecordUseStatus, type RecordVerdict } from "@/lib/recordVerify";
import { InputBoundVerifier } from "@/lib/inputBoundVerification";

type Tally = { ok: number; fail: number };
type UseAwareVerdict = RecordVerdict & { useStatus: RecordUseStatus };

/**
 * TallyOptIn — the opt-in public count of completed verifications.
 *
 * GRAMMAR (fixed by /api/verify-tally): the tally is a SELF-REPORTED, OPT-IN
 * signal, not a MEASURED number, and every surface that shows it must say so.
 * 2026-08-26: the count was fetched and then never rendered, and a failed POST
 * left the button looking untouched. Both are now visible.
 */
function TallyOptIn({ ok, variant }: { ok: boolean; variant: "light" | "dark" }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "err">("idle");
  const [tally, setTally] = useState<Tally | null>(null);
  const light = variant === "light";

  useEffect(() => {
    let live = true;
    fetch("/api/verify-tally")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((t) => { if (live && t && typeof t.ok === "number") setTally(t); })
      .catch(() => { /* the tally is a nicety; its absence is not an error worth shouting */ });
    return () => { live = false; };
  }, []);

  const muted = light ? "text-slate-600" : "text-emerald-100/70";
  const count = tally ? (
    <p className={`text-[12px] ${muted}`}>
      {tally.ok + tally.fail} verification{tally.ok + tally.fail === 1 ? "" : "s"} added to the
      public tally so far ({tally.ok} matched · {tally.fail} did not) — a self-reported, opt-in
      signal, not a measurement.
    </p>
  ) : null;

  if (state === "sent")
    return (
      <div className="space-y-1" role="status">
        <p className={`text-[12px] font-semibold ${light ? "text-emerald-800" : "text-emerald-300"}`}>
          Counted — thank you.
        </p>
        {count}
      </div>
    );

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={state === "sending"}
        onClick={async () => {
          setState("sending");
          try {
            const r = await fetch("/api/verify-tally", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ ok }),
            });
            if (!r.ok) throw new Error("HTTP " + r.status);
            const t = await r.json();
            if (typeof t?.ok === "number") setTally({ ok: t.ok, fail: t.fail });
            setState("sent");
          } catch {
            setState("err");
          }
        }}
        className={`min-h-[44px] rounded-md border px-3 py-1.5 text-[12px] disabled:opacity-50 ${FOCUS} ${
          light
            ? "border-emerald-700/30 text-emerald-900 hover:bg-emerald-50"
            : "border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10"
        }`}
      >
        {state === "sending" ? "Adding…" : "Add to public tally (opt-in — ✓/✗ only)"}
      </button>
      {state === "err" && (
        <p className="text-[12px] font-semibold text-red-500" role="alert">
          Could not reach the tally — your verdict above is unaffected; it never left your browser.
        </p>
      )}
      {count}
    </div>
  );
}

export default function RecordVerifyForm({
  variant = "dark",
  seed,
  seedNonce,
  onVerdict,
}: {
  variant?: "light" | "dark";
  /**
   * Text a HOST surface wants loaded into the box — the Council OS pane uses it to
   * hand the reader a real published card off /signed/chain.json so the tool can be
   * exercised without first going and finding one. `seedNonce` changes on every
   * load so the same card can be re-seeded after the reader has edited it. The box
   * stays fully editable: seeding fills it, it never locks it.
   */
  seed?: string;
  seedNonce?: number;
  /** Told the verdict after every run. The Council OS pane uses it to mark the
   *  "verify a published card" quest on a REAL pass rather than on a link click. */
  onVerdict?: (v: RecordVerdict) => void;
}) {
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<{ result: UseAwareVerdict; inputHash: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const verifier = useRef(new InputBoundVerifier<UseAwareVerdict>());
  const light = variant === "light";
  const fieldId = useId();

  useEffect(() => () => verifier.current.invalidate(), []);

  useEffect(() => {
    if (typeof seed === "string" && seed) {
      verifier.current.invalidate();
      setText(seed);
      setVerdict(null); // a new record has not been checked yet — never show the old verdict beside it
      setBusy(false);
    }
  }, [seed, seedNonce]);

  const run = async () => {
    setBusy(true);
    const snapshot = text;
    const bound = await verifier.current.run(snapshot, async (value) => {
      const [signature, useStatus] = await Promise.all([
        verifyRecord(value),
        lookupRecordUseStatus(value),
      ]);
      return { ...signature, useStatus };
    });
    if (!bound) return;
    setVerdict(bound);
    onVerdict?.(bound.result);
    setBusy(false);
  };

  const edit = (next: string) => {
    verifier.current.invalidate();
    setText(next);
    setVerdict(null);
    setBusy(false);
  };

  return (
    <div>
      {/* The textarea had no label of any kind — a screen reader announced only
          "edit text". The label is visible, not sr-only, because the field also
          needs a heading a sighted reader can scan to. */}
      <label
        htmlFor={fieldId}
        className={`mb-2 block text-[12px] font-semibold ${light ? "text-slate-800" : "text-emerald-100/80"}`}
      >
        Estate record JSON
      </label>
      <textarea
        id={fieldId}
        value={text}
        onChange={(e) => edit(e.target.value)}
        placeholder="Paste one estate record JSON — verification runs entirely in your browser."
        className={
          (light
            ? "h-36 w-full rounded-xl border border-slate-900/15 bg-white p-3 font-mono text-[12px] text-slate-900 placeholder:text-slate-500 [color-scheme:light]"
            : "h-40 w-full rounded-xl border border-emerald-500/25 bg-[#03110b] p-3 font-mono text-[12px] text-emerald-100 placeholder:text-emerald-100/50 [color-scheme:dark]") +
          " " +
          FOCUS
        }
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy || !text.trim()}
          className={
            (light
              ? "rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-40"
              : "rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-40") +
            " min-h-[44px] " +
            FOCUS
          }
        >
          {busy ? "Verifying…" : "Verify this record"}
        </button>
        {!text.trim() && (
          <span className={`text-[12px] ${light ? "text-slate-600" : "text-emerald-100/70"}`}>
            Paste a record above to enable this.
          </span>
        )}
      </div>
      {verdict && (
        <div className="mt-4 space-y-2" role="status">
          {/* role="status" announces the panel when it appears, and the headline is
              the first thing in that live region — so a screen-reader user hears the
              outcome in words before the per-check list. The headline states the
              verdict in words, not only a glyph: a reader who takes nothing else from
              the panel must still leave knowing which way it went.
              THREE STATES, NEVER TWO: UNCHECKABLE (could not check) is a different
              claim from INVALID (checked and failed) and is never rendered as one. */}
          <p
            data-testid="record-verdict-headline"
            className={`text-[14px] font-bold ${
              verdict.result.state === "VALID"
                ? light ? "text-emerald-800" : "text-emerald-300"
                : verdict.result.state === "INVALID"
                  ? light ? "text-red-700" : "text-red-300"
                  : light ? "text-amber-700" : "text-amber-300"
            }`}
          >
            {verdict.result.state === "VALID"
              ? "✓ VALID — "
              : verdict.result.state === "INVALID"
                ? "✗ INVALID — "
                : "○ UNCHECKABLE — "}
            {verdict.result.state === "VALID"
              ? verdict.result.lines.some((l) => l.code === "signature_valid")
                ? "this record reproduces its own id and its signature checks out against a published key."
                : "this record reproduces its declared id, but it carries no signature — a hash match only, not proof of who wrote it."
              : verdict.result.state === "INVALID"
                ? `a check ran and failed (${verdict.result.reasons.join(", ")}); each failure below is reported for what it is.`
                : `the check could not be completed (${verdict.result.reasons.join(", ") || "see below"}). This is not a finding that the record is forged.`}
          </p>
          {verdict.result.useStatus.state !== "NOT_APPLICABLE" && (
            <div
              data-testid="record-use-status"
              className={`rounded-lg border p-3 text-[13px] ${verdict.result.useStatus.state === "WITHDRAWN"
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
          <p className={`break-all font-mono text-[11px] ${light ? "text-slate-600" : "text-emerald-100/60"}`}>
            Input SHA-256: {verdict.inputHash}
          </p>
          {/* Keyed by code+index, not by label: two checks can carry the same label
              and a duplicate React key silently drops a reported failure. */}
          {verdict.result.lines.map((l, i) => (
            <div key={`${l.code}-${i}`} className="flex items-start gap-2 text-[13px]">
              <span
                aria-hidden="true"
                className={l.ok === true ? (light ? "text-emerald-700" : "text-emerald-300") : l.ok === false ? (light ? "text-red-700" : "text-red-300") : light ? "text-slate-600" : "text-emerald-100/70"}
              >
                {l.ok === true ? "✓" : l.ok === false ? "✗" : "○"}
              </span>
              <span className={light ? "text-slate-800" : "text-emerald-100/80"}>
                <span className="sr-only">{l.ok === true ? "Pass: " : l.ok === false ? "Fail: " : "Not checked: "}</span>
                <strong>{l.label}:</strong> {l.detail}
              </span>
            </div>
          ))}
          {/* The tally follows the ACTUAL verdict. It used to be fed a value derived from
              a verifier that failed every genuine card, so every honest visitor who
              clicked it filed a false failure into a public counter. */}
          <TallyOptIn ok={verdict.result.valid} variant={variant} />
        </div>
      )}
    </div>
  );
}
