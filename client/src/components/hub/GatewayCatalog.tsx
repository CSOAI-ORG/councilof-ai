/**
 * GatewayCatalog — LiteLLM / OpenRouter-style model list with GSPC overlay.
 */
import { useEffect, useMemo, useState } from "react";
import { fetchGatewayCatalog, gatewayConfigured, type GatewayModel } from "@/lib/litellmProxy";
import { hasFigure, orderedRows, useGspcBoard, type GspcAxis } from "@/components/board/useGspcBoard";
import { openLobby } from "@/lib/lobbyLink";

function normalizeId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function separatedLeadsByModel(axes: GspcAxis[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of axes) {
    if (!a.leader?.trim() || !hasFigure(a)) continue;
    const key = normalizeId(a.leader.trim());
    if (a.separation === "SEPARATED") {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return map;
}

export default function GatewayCatalog() {
  const [catalog, setCatalog] = useState<GatewayModel[]>([]);
  const [catalogState, setCatalogState] = useState<"loading" | "wire" | "unconfigured" | "error">(
    gatewayConfigured() ? "loading" : "unconfigured",
  );
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const { data } = useGspcBoard();

  const gspcByNorm = useMemo(() => separatedLeadsByModel(orderedRows(data)), [data]);

  useEffect(() => {
    if (!gatewayConfigured()) return;
    let cancelled = false;
    void fetchGatewayCatalog().then((res) => {
      if (cancelled) return;
      setCatalog(res.models);
      setCatalogState(res.source === "wire" ? "wire" : res.source);
      setCatalogError(res.error ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!gatewayConfigured()) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Gateway catalog (LiteLLM)</p>
        <p className="mt-2">
          Set <code className="text-xs">VITE_LITELLM_PROXY_URL</code> and{" "}
          <code className="text-xs">VITE_LITELLM_MASTER_KEY</code> in local dev to list models from your
          self-hosted OpenRouter-compatible proxy. See <code className="text-xs">ops/litellm/README.md</code>.
        </p>
      </div>
    );
  }

  if (catalogState === "loading") {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  }

  if (catalogState === "error") {
    return (
      <p className="text-sm text-red-600">
        Gateway unreachable — {catalogError}. Council OS chat still uses grounded /api/chat when the proxy is down.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="p-3">Model ID</th>
            <th className="p-3">Provider</th>
            <th className="p-3">GSPC separated leads</th>
            <th className="p-3 text-right">Try</th>
          </tr>
        </thead>
        <tbody>
          {catalog.map((m) => {
            const separated = gspcByNorm.get(normalizeId(m.id));
            return (
              <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{m.id}</td>
                <td className="p-3 text-muted-foreground">{m.owned_by ?? "—"}</td>
                <td className="p-3 font-mono text-emerald-700">{gspcByNorm.get(normalizeId(m.id)) ?? "—"}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                    onClick={() =>
                      openLobby({
                        pane: "models",
                        prompt: `What is published about ${m.id} on the GSPC board?`,
                        ctx: m.id,
                      })
                    }
                  >
                    Try
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground">
        Live from LiteLLM <code>GET /v1/models</code>. GSPC overlay from <code>GET /api/gspc</code> when IDs match board leaders.
      </p>
    </div>
  );
}
