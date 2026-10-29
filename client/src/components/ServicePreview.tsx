import { useState } from "react";
import { hasSlot, previewFields, resolvePreview } from "@/lib/previewTemplate";

/**
 * The free preview of one door, from the manifest's own `free_preview`.
 *
 * A concrete preview is a link. A preview published as a template (`?id=<wrapped-symbol:chain>`)
 * is shown as code text with a field per slot, and becomes a link only once every slot holds a
 * value the reader typed. The anchor's href is never the template itself: that was the dead link
 * the outward gate found on /services/ on 2026-10-13 (HTTP 400).
 */
export function ServicePreview({ template }: { template: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const slots = previewFields(template);
  // A field is offered only if filling every field would produce a link. A slot in the path, or
  // inside a longer value, cannot be offered as a field, and a form that can never succeed is worse
  // than no form.
  const fillable = slots.length > 0 && resolvePreview(template, Object.fromEntries(slots.map(({ key }) => [key, "x"]))) !== null;
  const fields = fillable ? slots : [];
  const href = resolvePreview(template, values);
  return (
    <div className="mt-3 space-y-3">
      {hasSlot(template) ? (
        <p className="text-[12px] leading-5 text-slate-400">
          Free preview, as a pattern:{" "}
          <code data-testid="service-preview-pattern" className="break-all font-mono text-slate-200">
            {template}
          </code>
        </p>
      ) : null}
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
        <p className="text-sm text-slate-400">
          {fields.length
            ? "Enter the required value to open the free preview."
            : "This address is a pattern to fill in, so no link is shown."}
        </p>
      )}
    </div>
  );
}
