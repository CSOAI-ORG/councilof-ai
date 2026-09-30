/**
 * DashboardSandboxPane — code interpreter sandbox.
 *
 * NOT MOUNTED. /api/sandbox answers 503 (no sandbox runtime); nothing here is signed or attested.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardSandboxPane() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ stdout: string; stderr: string; signed: boolean } | null>(null);

  const run = async () => {
    const res = await fetch("/api/sandbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setResult(await res.json());
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sandbox</CardTitle>
          <p className="text-sm text-muted-foreground">
            Code interpreter sandbox: not running. /api/sandbox answers 503, so no result is produced, signed or attested.
          </p>
        </CardHeader>
        <CardContent>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Write code here"
            className="block w-full rounded border border-border bg-card p-2 text-sm font-mono"
            rows={6}
          />
          <button
            onClick={run}
            className="mt-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Run
          </button>
          {result && (
            <pre className="mt-4 rounded border border-border bg-card p-3 text-xs">
              {result.stdout}
              {result.stderr && <span className="text-red-500">{result.stderr}</span>}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
