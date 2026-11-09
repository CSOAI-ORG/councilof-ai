import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

/**
 * LanguagePicker — the Council OS language door.
 *
 * The estate's i18next layer (13 locales) shipped configured but never wired to
 * any component, so the site rendered English-only. This picker is the visible
 * switch: it calls i18next's changeLanguage, which persists through the
 * detector's own localStorage cache. Selection changes the menu language
 * immediately; page bodies remain English until their copy passes the same
 * review the English words went through — the picker never pretends otherwise.
 */
export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const active = i18n.resolvedLanguage ?? i18n.language ?? "en-US";

  const onChange = useCallback(
    (code: string) => {
      void i18n.changeLanguage(code);
      const dir = code === "ar" ? "rtl" : "ltr";
      document.documentElement.setAttribute("lang", code);
      document.documentElement.setAttribute("dir", dir);
    },
    [i18n],
  );

  return (
    <label
      className={
        "flex items-center gap-2 rounded-lg border border-border bg-white text-slate-700 focus-within:ring-2 focus-within:ring-emerald-700 " +
        (compact ? "px-2 py-1.5 text-xs" : "px-2.5 py-2 text-sm")
      }
    >
      <Globe className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      <span className="sr-only">{t("common.language", "Language")}</span>
      <select
        value={active}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer bg-transparent font-medium outline-none"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, meta]) => (
          <option key={code} value={code}>
            {meta.flag} {meta.name}
          </option>
        ))}
      </select>
    </label>
  );
}
