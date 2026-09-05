/**
 * DashboardOperatorPane — browser agent (operator).
 *
 * Every action is signed + attested.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardOperatorPane() {
  const [goal, setGoal] = useState("");
  const [trace, setTrace] = useState<{ step: string; sha256: string }[]>([]);

  const run = async () => {
    const res = await fetch("/api/operator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });
    const data = await res.json();
    setTrace((data as { trace?: { step: string; sha256: string }[] }).trace ?? []);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Operator</CardTitle>
          <p className="text-sm text-muted-foreground">
            Browser agent. Every action is signed + attested.
          </p>
        </CardHeader>
        <CardContent>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Visit https://councilof.ai/pay"
            className="block w-full rounded border border-border bg-card p-2 text-sm"
          />
          <button
            onClick={run}
            className="mt-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Run
          </button>
          {trace.length > 0 && (
            <ol className="mt-4 space-y-2">
              {trace.map((s, i) => (
                <li key={i} className="rounded border border-border bg-card p-3 text-sm">
                  <div className="font-medium">Step {i + 1}: {s.step}</div>
                  <div className="text-xs text-muted-foreground">
                    sha256: {s.sha256.slice(0, 16)}…
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
