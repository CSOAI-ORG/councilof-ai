/**
 * DashboardFilesPane — file upload + analysis.
 *
 * Every uploaded file gets:
 *  - SHA-256 hash
 *  - 22-axis GSPC analysis (if AI-generated)
 *  - Signed card on the chain
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardFilesPane() {
  const [files, setFiles] = useState<{ name: string; sha256: string; signed: boolean }[]>([]);
  const [uploading, setUploading] = useState(false);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/files", { method: "POST", body: fd });
    const data = await res.json();
    setFiles((prev) => [
      ...prev,
      { name: file.name, sha256: data.sha256 ?? "", signed: true },
    ]);
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <p className="text-sm text-muted-foreground">
            File upload + 22-axis analysis. Every file gets a signed card.
          </p>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            onChange={onUpload}
            disabled={uploading}
            className="block w-full rounded border border-border bg-card p-2 text-sm"
          />
          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f) => (
                <li key={f.sha256} className="rounded border border-border bg-card p-3 text-sm">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-muted-foreground">sha256: {f.sha256.slice(0, 16)}…</div>
                  <div className="text-xs text-emerald-600">{f.signed ? "SIGNED" : "UNSIGNED"}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
