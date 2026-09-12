/**
 * rlusdReaders — LIVE client-side readers for RLUSD supply on XRPL and Ethereum.
 *
 * Doctrine: derived, never typed. A number may only reach the page from a
 * successful fetch in THIS session. Every reader returns null on failure —
 * the page then falls back to the labeled snapshot (data/rlusd-snapshot.json)
 * or declares UNCHECKABLE. No reader ever invents a value.
 *
 * Measurement, not certification. These are re-checkable on-chain reads,
 * not a rating of any issuer.
 *
 * Verified live 2026-09-12:
 *   XRPL  gateway_balances obligations["524C555344…"] — xrplcluster.com and
 *         s1.ripple.com:51234 answered; s2 (Clio) is kept as last resort.
 *   ETH   eth_call 0x18160ddd (totalSupply, 18 decimals) on
 *         0x8292bb45bf1ee4d140127049757c2e0ff06317ed — ethereum.publicnode.com
 *         and eth.drpc.org answered; llamarpc / cloudflare-eth kept as tail
 *         fallbacks (both were unreachable from the verifying network).
 */

export const RLUSD_XRPL_ISSUER = "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De";
export const RLUSD_XRPL_CURRENCY_HEX = "524C555344000000000000000000000000000000";
export const RLUSD_ETH_CONTRACT = "0x8292bb45bf1ee4d140127049757c2e0ff06317ed";
export const RLUSD_ETH_DECIMALS = 18;

export const XRPL_ENDPOINTS = [
  "https://xrplcluster.com",
  "https://s1.ripple.com:51234",
  "https://s2.ripple.com:51234",
] as const;

export const ETH_ENDPOINTS = [
  "https://ethereum.publicnode.com",
  "https://eth.drpc.org",
  "https://eth.llamarpc.com",
  "https://cloudflare-eth.com",
] as const;

export interface ChainReading {
  chain: "xrpl" | "ethereum";
  /** Decimal string in RLUSD units (human, not raw). Exact — never float-rounded by us. */
  supply: string;
  endpoint: string;
  /** "ledger" for XRPL, "block" for Ethereum. */
  refKind: "ledger" | "block";
  /** null = the ref read failed; render no ref rather than a fake one. */
  refValue: number | null;
}

type FetchLike = typeof fetch;

const JSON_HEADERS = { "content-type": "application/json" };

interface GatewayBalancesResult {
  result?: {
    ledger_index?: number;
    obligations?: Record<string, string>;
  };
}

/** Read RLUSD obligations on XRPL. Tries each endpoint in order; null if none answer. */
export async function readXrplRlusdSupply(
  fetchFn: FetchLike = fetch,
  endpoints: readonly string[] = XRPL_ENDPOINTS,
): Promise<ChainReading | null> {
  const body = JSON.stringify({
    method: "gateway_balances",
    params: [{ account: RLUSD_XRPL_ISSUER, ledger_index: "validated" }],
  });
  for (const endpoint of endpoints) {
    try {
      const res = await fetchFn(endpoint, { method: "POST", headers: JSON_HEADERS, body });
      if (!res.ok) continue;
      const json = (await res.json()) as GatewayBalancesResult;
      const obligations = json?.result?.obligations;
      const supply = obligations?.[RLUSD_XRPL_CURRENCY_HEX];
      const ledger = json?.result?.ledger_index;
      // A 200 with no obligations for this currency is not a zero — it is no answer.
      if (typeof supply !== "string" || supply === "" || typeof ledger !== "number") continue;
      if (!/^\d+(\.\d+)?$/.test(supply)) continue;
      return { chain: "xrpl", supply, endpoint, refKind: "ledger", refValue: ledger };
    } catch {
      continue;
    }
  }
  return null;
}

interface EthRpcResult {
  result?: string;
  error?: { code?: number; message?: string };
}

/** Format a raw integer (as bigint) with `decimals` decimal places. No floats. */
export function formatRawWithDecimals(raw: bigint, decimals: number): string {
  const s = raw.toString().padStart(decimals + 1, "0");
  const intPart = s.slice(0, s.length - decimals);
  const fracPart = s.slice(s.length - decimals).replace(/0+$/, "");
  return fracPart === "" ? intPart : `${intPart}.${fracPart}`;
}

async function ethRpc(fetchFn: FetchLike, endpoint: string, method: string, params: unknown[]): Promise<string | null> {
  const res = await fetchFn(endpoint, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as EthRpcResult;
  if (json.error || typeof json.result !== "string") return null;
  return json.result;
}

/** Read RLUSD totalSupply() on Ethereum. Tries each endpoint in order; null if none answer. */
export async function readEthRlusdSupply(
  fetchFn: FetchLike = fetch,
  endpoints: readonly string[] = ETH_ENDPOINTS,
): Promise<ChainReading | null> {
  for (const endpoint of endpoints) {
    try {
      const hex = await ethRpc(fetchFn, endpoint, "eth_call", [
        { to: RLUSD_ETH_CONTRACT, data: "0x18160ddd" },
        "latest",
      ]);
      if (hex === null || !/^0x[0-9a-fA-F]+$/.test(hex)) continue;
      const raw = BigInt(hex);
      const blockHex = await ethRpc(fetchFn, endpoint, "eth_blockNumber", []);
      // Block ref is nice-to-have context; the supply read itself is the measurement.
      const refValue = blockHex !== null && /^0x[0-9a-fA-F]+$/.test(blockHex) ? Number(BigInt(blockHex)) : null;
      return {
        chain: "ethereum",
        supply: formatRawWithDecimals(raw, RLUSD_ETH_DECIMALS),
        endpoint,
        refKind: "block",
        refValue,
      };
    } catch {
      continue;
    }
  }
  return null;
}
