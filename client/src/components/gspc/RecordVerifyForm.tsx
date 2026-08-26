import { useEffect, useState } from "react";
import { FOCUS, SP, TYPE } from "../lobby/glass";
import { verifyRecord, type RecordVerdict } from "@/lib/recordVerify";

function TallyOptIn({ ok, variant }: { ok: boolean; variant: "light" | "dark" }) {
  const [state, setState] = useState<"idle" | "sent" | "err">("idle");
  const [tally, setTally] = useState<{ ok: number; fail: number } | null>(null);
  useEffect(() => {
    fetch("/api/verify-tally").then((r) => r.json()).then(setTally).catch(() => {});
  }, []);
  const muted = variant === "light" ? "text-slate-600" : "text-emerald-100/50";
  if (state === "sent")
    return <p className={`text-[12px] ${variant === "light" ? "text-emerald-800" : "text-emerald-300"}`}>Counted — thank you.</p>;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await fetch("/api/verify-tally", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ok }) });
          setState("sent");
        } catch { setState("err"); }
      }}
      className={`rounded-md border px-3 py-1.5 text-[12px] ${FOCUS} ${
        variant === "light"
          ? "border-emerald-700/30 text-emerald-900 hover:bg-emerald-50"
          : "border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10"
      }`}
    >
      Add to public tally (opt-in — ✓/✗ only)
    </button>
  );
}

export default function RecordVerifyForm({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<RecordVerdict | null>(null);
  const [busy, setBusy] = useState(false);
  const light = variant === "light";

  const run = async () => {
    setBusy(true);
    setVerdict(await verifyRecord(text));
    setBusy(false);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste one estate record JSON — verification runs entirely in your browser."
        className={
          light
            ? "h-36 w-full rounded-xl border border-slate-900/15 bg-white p-3 font-mono text-[12px] text-slate-900 placeholder:text-slate-400"
            : "h-40 w-full rounded-xl border border-emerald-500/25 bg-[#03110b] p-3 font-mono text-[12px] text-emerald-100 placeholder:text-emerald-100/30"
        }
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy || !text.trim()}
          className={
            light
              ? `rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 ${FOCUS}`
              : "rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] disabled:opacity-40"
          }
        >
          {busy ? "Verifying…" : "Verify this record"}
        </button>
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
