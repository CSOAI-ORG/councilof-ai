import { useEffect, useState } from "react";
import { EXPOSURE_LABELS_URL, PLAIN_LANGUAGE, exposureLine, type ExposureLine } from "@/lib/bankExposure";

/**
 * One plain-language line under an axis: was the bank behind these cards public?
 * Reads the board-signed label record's payload. Renders nothing when the record is absent:
 * an unread label is not a clean one, so no line is better than a guessed one.
 */
export default function BankExposureNote({ axis }: { axis: string }) {
  const [line, setLine] = useState<ExposureLine | null>(null);
  useEffect(() => {
    let live = true;
    fetch(EXPOSURE_LABELS_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live) setLine(d ? exposureLine(d, axis) : null); })
      .catch(() => { if (live) setLine(null); });
    return () => { live = false; };
  }, [axis]);
  if (!line) return null;
  return (
    <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900" data-testid="bank-exposure-note">
      <p>
        <strong>Bank exposure{line.label ? `: ${line.label}` : ""}.</strong>{" "}
        {line.sentence ??
          `The ${line.liveCards} live signed cards on this axis pin banks with different exposure: ` +
            line.counts.map(([k, v]) => `${v} ${k}`).join(", ") + ". " +
            (PLAIN_LANGUAGE.PUBLIC_BANK && line.counts.some(([k]) => k === "PUBLIC_BANK") ? PLAIN_LANGUAGE.PUBLIC_BANK : "")}
      </p>
      <p className="mt-1 text-xs text-amber-800">
        {line.liveCards} live signed cards on this axis ·{" "}
        <a className="underline" href="/interop/instrument-guard/bank-exposure-labels.json">per-card labels</a> ·{" "}
        <a className="underline" href={EXPOSURE_LABELS_URL}>signed record</a> · the label changes no score.
      </p>
    </div>
  );
}
