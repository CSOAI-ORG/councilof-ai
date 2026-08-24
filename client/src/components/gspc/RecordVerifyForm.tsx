import { useState } from "react";
import { FOCUS } from "../lobby/glass";
import { verifyRecord, type RecordVerdict } from "@/lib/recordVerify";
import VerifyTallyOptIn from "@/components/VerifyTallyOptIn";

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
          {verdict.lines.map((l) => (
            <div key={l.label} className="flex items-start gap-2 text-[13px]">
              <span className={l.ok === true ? "text-emerald-600" : l.ok === false ? "text-red-600" : light ? "text-slate-500" : "text-emerald-100/50"}>
                {l.ok === true ? "✓" : l.ok === false ? "✗" : "○"}
              </span>
              <span className={light ? "text-slate-800" : "text-emerald-100/80"}>
                <strong>{l.label}:</strong> {l.detail}
              </span>
            </div>
          ))}
          <VerifyTallyOptIn ok={verdict.lines.every((l) => l.ok !== false)} variant={variant} />
        </div>
      )}
    </div>
  );
}
