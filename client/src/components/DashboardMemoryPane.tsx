/**
 * DashboardMemoryPane — cross-session memory via signed cards.
 *
 * Memory = every chat becomes a signed card on the chain.
 * Same user across sessions = same memory (cards chain).
 *
 * GET /api/memory?user_id=<id>  → returns memory entries
 * POST /api/memory              → writes a memory card
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MemoryEntry = {
  sha256: string;
  as_of: string;
  kind: "chat" | "game" | "measure" | "verify" | "attest";
  summary: string;
  council_vote: { yes: number; no: number; quorum_reached: boolean };
  anchors: { opentimestamps: string; sigstore_rekor: string; eas_base: string };
};

export default function DashboardMemoryPane() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // A failed read is NOT an empty store. The previous version swallowed the error and then
  // rendered "No memory entries yet.", so an endpoint that was down looked exactly like a
  // user who had none. Absence has to be distinguishable from not knowing.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => {
        if (!r.ok) throw new Error(`/api/memory returned HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setEntries((d as { entries?: MemoryEntry[] }).entries ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Memory</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cross-session memory via signed cards. Every chat becomes a card on the chain.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground" role="status">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-600" role="alert">
              Memory could not be read: {error}. This is not an empty store — nothing is known
              either way until the endpoint answers.
            </p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No memory entries yet.</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.sha256} className="rounded border border-border bg-card p-3 text-sm">
                  <div className="font-medium">{e.kind} · {e.as_of}</div>
                  <div className="text-muted-foreground">{e.summary}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    sha256: {e.sha256.slice(0, 16)}…
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
