/**
 * DashboardFilesPane — file upload, and an honest signature state.
 *
 * WHAT WAS WRONG, 2026-09-05. The upload path hardcoded `signed: true` on every row:
 *
 *     const res = await fetch("/api/files", { method: "POST", body: fd });
 *     const data = await res.json();
 *     setFiles(prev => [...prev, { name: file.name, sha256: data.sha256 ?? "", signed: true }]);
 *
 * and the list rendered that as a green "SIGNED". So a file the endpoint never signed — or a
 * request that returned a 500 with a JSON error body — displayed as SIGNED anyway. This estate
 * measures and signs; asserting a signature nothing produced is the one claim it cannot make.
 *
 * There were three more faults in those four lines. `res.ok` was never checked, so an error
 * response was parsed as a success. There was no try/catch, so a network failure left an
 * unhandled rejection and `uploading` stuck true — the spinner that never resolves. And the
 * list key was `f.sha256`, which is `""` whenever the response omits it, so two such files
 * collide on one React key.
 *
 * WHAT IT DOES NOW. The signature state is READ from the response and is never assumed. A
 * response that does not say carries UNKNOWN, which renders as "signature state not stated"
 * rather than as either verdict — absence is not a "no" any more than it is a "yes". A failed
 * upload says so, in words, and clears the control so the user can try again.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SigState = "SIGNED" | "UNSIGNED" | "UNKNOWN";

type Row = { id: string; name: string; sha256: string; signed: SigState };

/**
 * The signature state the endpoint actually reported. Never inferred from the request
 * having succeeded — a 200 says the upload was accepted, not that anything was signed.
 */
export function signatureStateOf(data: unknown): SigState {
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.signed === true) return "SIGNED";
  if (d.signed === false) return "UNSIGNED";
  if (typeof d.signature === "string" && d.signature.length > 0) return "SIGNED";
  return "UNKNOWN";
}

const SIG_LABEL: Record<SigState, string> = {
  SIGNED: "SIGNED",
  UNSIGNED: "UNSIGNED",
  UNKNOWN: "signature state not stated",
};

const SIG_CLASS: Record<SigState, string> = {
  SIGNED: "text-emerald-600",
  UNSIGNED: "text-muted-foreground",
  UNKNOWN: "text-amber-600",
};

export default function DashboardFilesPane() {
  const [files, setFiles] = useState<Row[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/files", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`/api/files returned HTTP ${res.status}`);
      const data = await res.json();
      setFiles((prev) => [
        ...prev,
        {
          // sha256 may be absent; it must not become the React key or two such rows collide.
          id: `${file.name}:${prev.length}:${Date.now()}`,
          name: file.name,
          sha256: typeof data?.sha256 === "string" ? data.sha256 : "",
          signed: signatureStateOf(data),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      // Always. A stuck control is how a failed upload becomes a spinner with no end.
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <p className="text-sm text-muted-foreground">
            File upload and 22-axis analysis. Each row shows the signature state the endpoint
            reported — nothing is marked signed unless it said so.
          </p>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            onChange={onUpload}
            disabled={uploading}
            aria-label="Upload a file for analysis"
            className="block w-full rounded border border-border bg-card p-2 text-sm"
          />
          {uploading && (
            <p className="mt-2 text-sm text-muted-foreground" role="status">
              Uploading…
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              Upload failed: {error}. Nothing was added to the list.
            </p>
          )}
          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f) => (
                <li key={f.id} className="rounded border border-border bg-card p-3 text-sm">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-muted-foreground">
                    {f.sha256 ? `sha256: ${f.sha256.slice(0, 16)}…` : "no sha256 returned"}
                  </div>
                  <div className={`text-xs ${SIG_CLASS[f.signed]}`}>{SIG_LABEL[f.signed]}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
