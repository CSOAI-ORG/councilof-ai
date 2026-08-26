import { useCallback, useState } from "react";
import { FOCUS, MEASURE, TYPE } from "./glass";

/**
 * paneKit — the small shared parts every NATIVE Council OS workflow pane needs.
 *
 * A native pane is not a framed marketing page: it takes real input and hands the
 * reader a real artefact. That means three things need to look and behave the same
 * everywhere, so they live here once:
 *
 *   PaneHead    the pane's own title band (native panes have no site chrome).
 *   WireNotice  what a pane shows while the live board is loading, and what it
 *               shows when the board did NOT answer. The failure state is a first
 *               -class design object here: it renders the error and NO numbers.
 *   CopyBlock   the takeaway. Selectable text plus a copy button that reports
 *               honestly when the clipboard is blocked instead of lying "Copied".
 *   Field/Check plain labelled inputs on the white glass ground.
 */

export function PaneHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header>
      <p className={TYPE.section}>{eyebrow}</p>
      <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">{title}</h2>
      {children && <div className={`mt-2 ${MEASURE} ${TYPE.body}`}>{children}</div>}
    </header>
  );
}

/** Loading / failed states for a pane that reads the live board. Never a stale number. */
export function WireNotice({ phase, error }: { phase: "loading" | "failed"; error?: string }) {
  if (phase === "loading") {
    return (
      <p className={`mt-6 rounded-xl border border-slate-900/10 bg-white/80 px-4 py-3 ${TYPE.muted}`}>
        Reading <code className="font-mono text-[11px]">GET /api/gspc</code>…
      </p>
    );
  }
  return (
    <div className="mt-6 rounded-xl border border-amber-600/35 bg-amber-50 px-4 py-3.5">
      <p className="text-[13px] font-semibold text-amber-900">The live board did not answer.</p>
      <p className={`mt-1.5 ${MEASURE} text-[12px] leading-relaxed text-amber-900/90`}>
        This pane builds from <code className="font-mono text-[11px]">GET /api/gspc</code> and has no
        offline copy on purpose — an artefact assembled from a stale snapshot while looking live is
        the same defect as quoting a score an axis never earned. Nothing is shown until the board
        answers.
      </p>
      {error && <p className="mt-2 font-mono text-[11px] text-amber-900/80">{error}</p>}
    </div>
  );
}

/** Selectable takeaway text with an honest copy control. */
export function CopyBlock({ text, label }: { text: string; label: string }) {
  const [said, setSaid] = useState<"" | "copied" | "blocked">("");
  const copy = useCallback(() => {
    const done = (s: "copied" | "blocked") => {
      setSaid(s);
      setTimeout(() => setSaid(""), 2200);
    };
    try {
      const p = navigator.clipboard?.writeText(text);
      if (p && typeof p.then === "function") p.then(() => done("copied"), () => done("blocked"));
      else done(navigator.clipboard ? "copied" : "blocked");
    } catch {
      done("blocked");
    }
  }, [text]);

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={TYPE.section}>{label}</span>
        <span className="flex items-center gap-2">
          {said === "copied" && <span className="text-[11px] font-semibold text-emerald-800">Copied</span>}
          {said === "blocked" && (
            <span className="text-[11px] font-semibold text-amber-800">
              Clipboard blocked — select the text
            </span>
          )}
          <button
            type="button"
            onClick={copy}
            className={`rounded-lg border border-slate-900/12 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
          >
            Copy
          </button>
        </span>
      </div>
      <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-slate-900/10 bg-slate-50 p-4 font-mono text-[11.5px] leading-relaxed text-slate-800">
        <code>{text}</code>
      </pre>
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-[12.5px] font-semibold text-slate-900">{label}</span>
      {hint && <span className={`mt-0.5 block ${TYPE.fine}`}>{hint}</span>}
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 w-full rounded-xl border border-slate-900/15 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-500 ${FOCUS}`}
      />
    </label>
  );
}

export function Check({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`mt-0.5 h-4 w-4 shrink-0 accent-emerald-700 ${FOCUS}`}
      />
      <span className="min-w-0">{children}</span>
    </label>
  );
}
