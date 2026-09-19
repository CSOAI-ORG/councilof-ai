import { useId, useState } from "react";
import { inspectPreviewTemplate, PREVIEW_VALUE_LIMIT, resolvePreview, type PreviewField } from "@/lib/previewTemplate";

/** A template change remounts its inputs, so values cannot follow a different destination. */
export function ServicePreview({ template }: { template: string }) {
  const inspected = inspectPreviewTemplate(template);
  if (!inspected) {
    return <p role="status" className="mt-3 text-sm text-amber-200">Preview unavailable: the manifest link needs review.</p>;
  }
  return <PreviewInputs key={template} template={template} fields={inspected.fields} />;
}

function PreviewInputs({ template, fields }: { template: string; fields: PreviewField[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const id = useId();
  const hintId = `${id}-hint`;
  const href = resolvePreview(template, values);
  return (
    <div className="mt-3 space-y-3">
      {fields.length > 0 && <p id={hintId} className="text-xs text-slate-400">Use public or redacted values. All listed fields are required; entering them sends no request.</p>}
      {fields.map(({ key, hint }) => {
        const urlValue = /^https:\/\//i.test(hint);
        const label = key === "asset" ? "Asset symbol or XRPL address" : urlValue ? "Public HTTPS URL" : `${key} (${hint})`;
        return (
          <label key={key} htmlFor={`${id}-${key}`} className="block text-sm text-slate-300">
            {label}
            <input
              id={`${id}-${key}`}
              value={values[key] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
              autoComplete="off"
              spellCheck={false}
              required
              maxLength={PREVIEW_VALUE_LIMIT}
              inputMode={urlValue ? "url" : "text"}
              aria-describedby={hintId}
              className="mt-1 block w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
        );
      })}
      <div role="status" aria-live="polite">
        {href ? (
          <a href={href} className="text-sm font-semibold text-emerald-300 underline underline-offset-4">
            Open listed preview →
          </a>
        ) : (
          <p className="text-sm text-slate-400">Complete the required values to prepare the preview link. URL fields require a valid HTTPS address.</p>
        )}
      </div>
    </div>
  );
}
