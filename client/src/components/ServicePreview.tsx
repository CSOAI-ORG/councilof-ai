import { useState } from "react";
import { previewFields, resolvePreview } from "@/lib/previewTemplate";

export function ServicePreview({ template }: { template: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const fields = previewFields(template);
  const href = resolvePreview(template, values);
  return (
    <div className="mt-3 space-y-3">
      {fields.map(({ key, hint }) => (
        <label key={key} className="block text-sm text-slate-300">
          {key === "asset" ? "Asset symbol or XRPL address" : hint}
          <input
            value={values[key] ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
            autoComplete="off"
            className="mt-1 block w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
      ))}
      {href ? (
        <a href={href} className="text-sm font-semibold text-emerald-300 underline underline-offset-4">
          Free preview →
        </a>
      ) : (
        <p className="text-sm text-slate-400">Enter the required value to open the free preview.</p>
      )}
    </div>
  );
}
