import { useEffect, useState } from "react";
import { Link } from "wouter";
import i18n from "i18next";
import { FOCUS, MEASURE, SURFACE, TYPE } from "./glass";
import {
  ALL_DESK_OPTIONS,
  confirmJurisdiction,
  fetchJurisdictionHint,
  overrideDesk,
  type DeskId,
  type JurisdictionHint,
} from "@/lib/jurisdictionStore";

/**
 * Soft geo → East-West desk banner for Council OS home.
 * Default only — user confirms or overrides. Not a compliance determination.
 */
export default function JurisdictionDeskBanner({
  onOpenDesk,
}: {
  onOpenDesk: (path: string, label: string) => void;
}) {
  const [hint, setHint] = useState<JurisdictionHint | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const h = await fetchJurisdictionHint();
      if (cancelled) return;
      setHint(h);
      try {
        const raw = localStorage.getItem("csoai.jurisdiction-hint.v1");
        if (raw && JSON.parse(raw).confirmed) setConfirmed(true);
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !hint) return null;

  return (
    <aside
      className={`${SURFACE} mt-6 border-emerald-700/20 bg-emerald-50/70 px-4 py-3`}
      aria-label="Suggested regulator desk"
    >
      <p className={TYPE.section}>Suggested desk · regional default</p>
      <p className="mt-1 text-[15px] font-semibold text-slate-900">{hint.deskLabel}</p>
      <p className={`mt-1.5 ${MEASURE} ${TYPE.muted}`}>
        {hint.country
          ? `Edge signal: country ${hint.country} (${hint.source}).`
          : `No country signal (${hint.source}).`}{" "}
        Language soft-default: <span className="font-mono">{hint.language}</span>
        {confirmed ? " · confirmed for this browser." : " · not confirmed yet."}
      </p>
      <p className={`mt-2 ${TYPE.muted}`}>{hint.doctrine}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="coai-desk-override">
          Override desk
        </label>
        <select
          id="coai-desk-override"
          className={`${FOCUS} rounded-lg border border-slate-900/15 bg-white px-2 py-1.5 text-[12px]`}
          value={hint.desk}
          onChange={(e) => {
            const next = overrideDesk(e.target.value as DeskId, hint);
            setHint(next);
            setConfirmed(false);
          }}
        >
          {ALL_DESK_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`${FOCUS} rounded-lg bg-emerald-800 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-900`}
          onClick={() => {
            confirmJurisdiction(hint);
            setConfirmed(true);
            if (hint.language && !localStorage.getItem("i18nextLng")) {
              void i18n.changeLanguage(hint.language);
            }
          }}
        >
          Confirm desk
        </button>
        <button
          type="button"
          className={`${FOCUS} rounded-lg border border-emerald-800/25 bg-white px-3 py-1.5 text-[12px] font-semibold text-emerald-950 hover:bg-emerald-100`}
          onClick={() => onOpenDesk(hint.deskPath, hint.deskLabel)}
        >
          Open desk
        </button>
        <Link
          href="/east-west/crosswalk"
          className={`${FOCUS} rounded-lg border border-emerald-800/25 bg-white px-3 py-1.5 text-[12px] font-semibold text-emerald-950 hover:bg-emerald-100`}
        >
          Full crosswalk
        </Link>
      </div>
    </aside>
  );
}
