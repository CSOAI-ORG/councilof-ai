import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, RefreshCw, AlertTriangle, Hash } from "lucide-react";

interface InstrumentStatus {
  id: string;
  label: string;
  jurisdiction: string;
  provisions: number;
  status: "unchanged" | "baseline_seeded" | "DRIFT" | "UNKNOWN";
  hash?: string;
}

interface Heartbeat {
  started_at: string;
  finished_at: string;
  normaliser: string;
  instruments: InstrumentStatus[];
  drift_events: number;
  unknown: number;
  total_provisions: number;
  artifact_uri?: string;
  signed?: boolean;
}

interface HeartbeatResponse {
  issued_at: string;
  served_fresh: boolean;
  fallback_used: boolean;
  baseline_seed: Heartbeat;
  heartbeat: Heartbeat;
}

const STATUS_TONE: Record<string, { badge: string; row: string; label: string }> = {
  unchanged: { badge: "bg-emerald-200 text-emerald-800", row: "bg-emerald-50 border-emerald-200", label: "UNCHANGED" },
  baseline_seeded: { badge: "bg-emerald-200 text-emerald-800", row: "bg-emerald-50 border-emerald-200", label: "BASELINE SEEDED" },
  DRIFT: { badge: "bg-red-200 text-red-800", row: "bg-red-50 border-red-200", label: "DRIFT" },
  UNKNOWN: { badge: "bg-amber-200 text-amber-800", row: "bg-amber-50 border-amber-200", label: "UNKNOWN" },
};

/** WHAT WE PROBE LIVE — corpus-watcher heartbeat panel mounted on /status.
 *  Reads the same JSON DriftProduct reads. If the live artefact is unreachable we render the
 *  honest 2026-08-01 baseline seed (timestamped, named) instead of greenwashing. */
export default function StatusCorpusWatch() {
  const [data, setData] = useState<HeartbeatResponse | null>(null);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setReloading(true);
    setError(null);
    try {
      const r = await fetch("/api/corpus-watch/status", { cache: "no-store" });
      if (!r.ok) throw new Error(`status ${r.status}`);
      const j = (await r.json()) as HeartbeatResponse;
      setData(j);
    } catch (e: unknown) {
      setError(String((e as Error)?.message ?? e));
    } finally {
      setReloading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const hb = data?.heartbeat ?? null;
  const stable = hb ? hb.instruments.filter((i) => i.status === "unchanged" || i.status === "baseline_seeded").length : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <div>
            <h3 className="text-lg font-bold">What we probe live</h3>
            <p className="text-xs text-muted-foreground">
              EUR-Lex CELLAR + legislation.gov.uk — daily normaliser-v2 hash diff, fail-closed on unreachable authority
            </p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          disabled={reloading}
        >
          <RefreshCw className={"h-3 w-3 " + (reloading ? "animate-spin" : "")} />
          {reloading ? "refreshing" : "refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded border border-amber-200 bg-amber-50 text-amber-900 text-xs">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Live heartbeat fetch failed ({error}). Falling back to the measured 2026-08-01 baseline seed —
            <span className="font-semibold"> never rendered as "all green".</span>
          </span>
        </div>
      )}

      {hb && (
        <>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-bold">{hb.total_provisions}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">provisions under hash</div>
            </div>
            <div>
              <div className={"text-2xl font-bold " + (hb.drift_events > 0 ? "text-red-600" : "text-amber-500")}>
                {hb.drift_events}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">drift events to date</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {stable}/{hb.instruments.length}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">instruments stable</div>
            </div>
          </div>

          <div className="space-y-2">
            {hb.instruments.map((i) => {
              const tone = STATUS_TONE[i.status] ?? STATUS_TONE.baseline_seeded;
              return (
                <div key={i.id} className={"flex items-center justify-between p-3 border rounded-lg " + tone.row}>
                  <div className="flex items-center gap-3">
                    <Badge className={tone.badge + " font-mono"}>{tone.label}</Badge>
                    <div>
                      <div className="text-sm font-medium">{i.label}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {i.id} · {i.provisions} provisions{i.hash ? " · sha256:" + i.hash.slice(0, 12) + "…" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {i.jurisdiction}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t text-[10px] text-muted-foreground font-mono flex items-center justify-between">
            <span>
              last run: {new Date(hb.finished_at).toLocaleString()} · normaliser {hb.normaliser}
              {hb.unknown > 0 && <span className="text-amber-600"> · {hb.unknown} instrument(s) UNKNOWN (fetch failed)</span>}
            </span>
            <span>
              {hb.artifact_uri && (
                <a className="underline hover:text-foreground" href={hb.artifact_uri} target="_blank" rel="noreferrer">
                  raw signed artefact
                </a>
              )}
            </span>
          </div>

          {data?.fallback_used && (
            <div className="mt-2 text-[10px] text-muted-foreground">
              <Hash className="inline h-3 w-3 mr-1" />
              Showing the measured 2026-08-01 baseline seed; live heartbeat unavailable.
            </div>
          )}
        </>
      )}
    </Card>
  );
}
