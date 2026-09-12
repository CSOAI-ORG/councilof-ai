export type StablecoinPromotionQueue = {
  schema: "csoai.stablecoin-promotion-queue/0.1";
  kind: "executable-evidence-backlog";
  writes_board: false;
  population: number;
  counts: {
    indexed: number;
    primary_source_registered: number;
    deep_probed: number;
    measured: number;
    signed: number;
    rooted: number;
    witnessed: number;
    anchored: number;
    asset_specific_x402_settled: number;
  };
  next_action_counts: Record<string, number>;
  rows: Array<{
    rank: number;
    id: string;
    symbol: string;
    name: string;
    next_action: string;
  }>;
};

export function isStablecoinPromotionQueue(value: unknown): value is StablecoinPromotionQueue {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<StablecoinPromotionQueue>;
  return data.schema === "csoai.stablecoin-promotion-queue/0.1" &&
    data.kind === "executable-evidence-backlog" &&
    data.writes_board === false &&
    typeof data.population === "number" &&
    data.counts?.indexed === data.population &&
    Array.isArray(data.rows) &&
    data.rows.length === data.population &&
    data.rows.every((row, index) => row.rank === index + 1 && Boolean(row.id) && Boolean(row.next_action));
}

export async function loadStablecoinPromotionQueue(signal?: AbortSignal): Promise<StablecoinPromotionQueue> {
  const response = await fetch("/interop/stablecoin-universe-2026-09/promotion-queue.json", {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`promotion queue unavailable (${response.status})`);
  const value: unknown = await response.json();
  if (!isStablecoinPromotionQueue(value)) throw new Error("promotion queue contract invalid");
  return value;
}
