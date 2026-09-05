/**
 * DashboardAtlasPane — browser with built-in measurement.
 *
 * Every page visit is signed.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AtlasVisit = { url: string; sha256: string; as_of: string };

export default function DashboardAtlasPane() {
  const [visits, setVisits] = useState<AtlasVisit[]>([]);

  useEffect(() => {
    fetch("/api/atlas")
      .then((r) => r.json())
      .then((d) => {
        setVisits((d as { visits?: AtlasVisit[] }).visits ?? []);
      });
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Atlas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Browser with built-in measurement. Every page visit is signed.
          </p>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits yet.</p>
          ) : (
            <ul className="space-y-2">
              {visits.map((v) => (
                <li key={v.sha256} className="rounded border border-border bg-card p-3 text-sm">
                  <div className="font-medium">{v.url}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.as_of} · sha256: {v.sha256.slice(0, 16)}…
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
