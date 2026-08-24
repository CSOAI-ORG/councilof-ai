import { useEffect, useState } from "react";
import { FOCUS } from "./lobby/glass";

/** Opt-in public verify tally — ✓/✗ bit only; no record content. */
export default function VerifyTallyOptIn({ ok, variant = "dark" }: { ok: boolean; variant?: "light" | "dark" }) {
  const [state, setState] = useState<"idle" | "sent" | "err">("idle");
  const [tally, setTally] = useState<{ ok: number; fail: number } | null>(null);
  useEffect(() => {
    fetch("/api/verify-tally")
      .then((r) => r.json())
      .then(setTally)
      .catch(() => {});
  }, []);
  if (state === "sent")
    return (
      <p className={`text-[12px] ${variant === "light" ? "text-emerald-800" : "text-emerald-300"}`}>
        Counted — thank you.
      </p>
    );
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={async () => {
          try {
            await fetch("/api/verify-tally", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ ok }),
            });
            setState("sent");
          } catch {
            setState("err");
          }
        }}
        className={`rounded-md border px-3 py-1.5 text-[12px] ${FOCUS} ${
          variant === "light"
            ? "border-emerald-700/30 text-emerald-900 hover:bg-emerald-50"
            : "border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10"
        }`}
      >
        Add to public tally (opt-in — ✓/✗ only)
      </button>
      {tally && (
        <p className={`text-[11px] ${variant === "light" ? "text-slate-500" : "text-emerald-100/40"}`}>
          Self-reported opt-in signal: {tally.ok} valid · {tally.fail} invalid — not a MEASURED number.
        </p>
      )}
      {state === "err" && <p className="text-[11px] text-red-400">Tally unreachable — verification still local.</p>}
    </div>
  );
}
