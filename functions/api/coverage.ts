/**
 * GET /api/coverage — one machine-readable lifecycle view over the estate.
 *
 * This endpoint does not create evidence and never promotes INDEXED to
 * MEASURED. It reads the existing public truth surfaces at request time and
 * applies the same pure transformation as the Council OS coverage table.
 * Missing sources remain null cells with their owning field attached.
 */
import {
  buildCoverageLedger,
  type CoverageLedgerInput,
} from "../../client/src/lib/coverageLedger";

const SOURCES: Record<keyof CoverageLedgerInput, string> = {
  gspc: "/api/gspc",
  stablecoins: "/interop/stablecoin-universe-2026-09/readiness.json",
  xrpl: "/api/xrpl",
  swift: "/api/swift",
  banks: "/api/bank-complete",
  x402: "/api/x402",
  revenue: "/api/revenue",
};

type SourceRead = {
  path: string;
  http: number | null;
  parsed: boolean;
  error: string | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

async function readSource(origin: string, path: string): Promise<{ body: unknown; read: SourceRead }> {
  try {
    const response = await fetch(new URL(path, origin).toString(), {
      headers: { accept: "application/json" },
    });
    const text = await response.text();
    if (!response.ok) {
      return {
        body: null,
        read: { path, http: response.status, parsed: false, error: `HTTP ${response.status}` },
      };
    }
    if (!text.trim() || text.trimStart().startsWith("<")) {
      return {
        body: null,
        read: { path, http: response.status, parsed: false, error: "response was not JSON" },
      };
    }
    try {
      return {
        body: JSON.parse(text),
        read: { path, http: response.status, parsed: true, error: null },
      };
    } catch {
      return {
        body: null,
        read: { path, http: response.status, parsed: false, error: "invalid JSON" },
      };
    }
  } catch (error) {
    return {
      body: null,
      read: {
        path,
        http: null,
        parsed: false,
        error: error instanceof Error ? error.name : "fetch failed",
      },
    };
  }
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const entries = await Promise.all(
    Object.entries(SOURCES).map(async ([key, path]) => {
      const result = await readSource(origin, path);
      return [key, result] as const;
    }),
  );
  const input = Object.fromEntries(
    entries.map(([key, result]) => [key, result.body]),
  ) as CoverageLedgerInput;
  const sourceReads = Object.fromEntries(
    entries.map(([key, result]) => [key, result.read]),
  );
  const complete = entries.every(([, result]) => result.read.parsed);

  return json({
    schema: "csoai.master-coverage/0.1",
    kind: "derived-reader",
    writes_board: false,
    complete,
    lifecycle: [
      "INDEXED",
      "MEASURED",
      "SIGNED",
      "ROOTED",
      "WITNESSED",
      "ANCHORED",
      "PAID",
    ],
    rows: buildCoverageLedger(input),
    sources: sourceReads,
    truth_rules: [
      "INDEXED is not MEASURED.",
      "A signed catalog commitment is not a signed subject measurement.",
      "A census target is not a customer, partner, or completed measurement.",
      "A listed x402 door is not revenue; paid counts only verified non-self non-zero settlements.",
      "A null lifecycle cell means the owning source did not publish that stage; it is never zero.",
    ],
  });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: { "access-control-allow-origin": "*" },
  });
