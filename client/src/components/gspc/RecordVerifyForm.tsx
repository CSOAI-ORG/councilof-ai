import { useEffect, useId, useState } from "react";
import { FOCUS } from "../lobby/glass";
import { verifyRecord, type RecordVerdict } from "@/lib/recordVerify";

type Tally = { ok: number; fail: number };

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

export default function RecordVerifyForm({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<RecordVerdict | null>(null);
  const [busy, setBusy] = useState(false);
  const light = variant === "light";
  const fieldId = useId();

  const run = async () => {
    setBusy(true);
    setVerdict(await verifyRecord(text));
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
        onChange={(e) => setText(e.target.value)}
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
        <div className="mt-4 space-y-2">
          {/* Headline states the verdict in words, not only a glyph. A reader who takes
              nothing else from the panel must still leave knowing which way it went. */}
          <p
            data-testid="record-verdict-headline"
            className={`text-[14px] font-bold ${
              verdict.valid ? (light ? "text-emerald-800" : "text-emerald-300") : "text-red-500"
            }`}
          >
            {verdict.valid ? "✓ VERIFIED" : "✗ NOT VERIFIED"} —{" "}
            {verdict.valid
              ? "this record reproduces its own id and its signature checks out against a published key."
              : "see which check failed below; each failure is reported for what it is."}
          </p>
          {verdict.lines.map((l, i) => (
            <div key={`${l.code}-${i}`} className="flex items-start gap-2 text-[13px]">
              <span className={l.ok === true ? "text-emerald-600" : l.ok === false ? "text-red-600" : light ? "text-slate-500" : "text-emerald-100/50"}>
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
          <TallyOptIn ok={verdict.valid} variant={variant} />
        </div>
      )}
    </div>
  );
}
