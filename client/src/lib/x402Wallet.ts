/**
 * x402Wallet — turn a 402 challenge into a signed X-PAYMENT header, in the browser.
 *
 * WHAT THIS REPLACES. The OS tool runner asks the operator to "Paste the wallet-signed
 * x402 payload" into a textarea. That asks a human to be a wallet: build EIP-712 typed
 * data by hand, sign it somewhere else, base64 it, paste it. Nobody does that, so the
 * metered doors were unreachable in practice even though the rail settles.
 *
 * THE CONTRACT, read from our own server rather than assumed:
 *
 *   functions/api/_x402.ts:306   reads `x-payment` (or `payment-signature`)
 *   functions/api/_x402.ts:314   base64-decodes it unless it already starts with "{"
 *   _x402_negotiate.ts:19        "The EIP-3009 authorization is signed under the TOKEN's
 *                                 EIP-712 domain over (from, to, value, validAfter,
 *                                 validBefore, nonce) — the x402 envelope around it is
 *                                 transport, not signed material."
 *   toDialectPayload()           passes `payload.payload` through UNTOUCHED and restates
 *                                 only the envelope, so the inner object is what must be
 *                                 right here.
 *
 * WHY THE ENVELOPE IS SAFE TO GET WRONG AND THE INNER OBJECT IS NOT: the server rewrites
 * x402Version/network to suit the facilitator, and cannot invalidate the signature by
 * doing so. `payTo` is inside the signed tuple. So this module's one hard job is the
 * authorization and its signature.
 *
 * WHAT IT NEVER DOES: it never holds a key, never sends a transaction, and never decides
 * an amount. The amount, asset, recipient and deadline all come from the server's 402
 * challenge. A zero-amount door still requires a real signature — that is the point of
 * /api/free-door as a rehearsal: it exercises the whole path without moving money.
 */

/** EIP-6963 provider announcement. */
export interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}
export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}
export interface DiscoveredWallet {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

/** One `accepts[]` entry from a 402 challenge. */
export interface X402Accept {
  scheme: string;
  network: string;
  amount?: string;
  maxAmountRequired?: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  extra?: { name?: string; version?: string; decimals?: number; symbol?: string };
}
export interface X402Challenge {
  x402Version?: number;
  accepts?: X402Accept[];
  resource?: { url?: string; description?: string };
}

/**
 * EIP-6963 discovery. Wallets answer an event, so this resolves after a short window
 * rather than immediately. Returns [] when nothing answers — which is a real state
 * (no wallet installed), not an error to throw.
 */
export function discoverWallets(windowMs = 300): Promise<DiscoveredWallet[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  return new Promise((resolve) => {
    const found = new Map<string, DiscoveredWallet>();
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent).detail as DiscoveredWallet | undefined;
      if (detail?.info?.uuid && detail.provider) found.set(detail.info.uuid, detail);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
      resolve([...found.values()]);
    }, windowMs);
  });
}

/** "eip155:8453" | "base" | "8453" -> 8453. Throws on anything it cannot read. */
export function chainIdFromNetwork(network: string): number {
  const n = (network || "").trim().toLowerCase();
  const caip = /^eip155:(\d+)$/.exec(n);
  if (caip) return Number(caip[1]);
  if (/^\d+$/.test(n)) return Number(n);
  if (n === "base") return 8453;
  if (n === "base-sepolia") return 84532;
  throw new Error(`unrecognised x402 network "${network}" — refusing to guess a chain id`);
}

/** A fresh 32-byte nonce. Replay protection lives in this value, so it must be random. */
export function randomNonce(): string {
  const bytes = new Uint8Array(32);
  (globalThis.crypto ?? ({} as Crypto)).getRandomValues?.(bytes);
  return `0x${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Build the exact EIP-712 payload for EIP-3009 TransferWithAuthorization.
 * Every field except `from` and the nonce comes from the server's challenge.
 */
export function buildTypedData(
  accept: X402Accept,
  from: string,
  now = Math.floor(Date.now() / 1000),
  nonce = randomNonce(),
) {
  const value = accept.amount ?? accept.maxAmountRequired;
  if (value === undefined || value === null) {
    throw new Error("402 accept entry carries no amount — refusing to sign an open-ended authorization");
  }
  const chainId = chainIdFromNetwork(accept.network);
  const validBefore = now + (accept.maxTimeoutSeconds ?? 300);
  const authorization = {
    from,
    to: accept.payTo,
    value: String(value),
    validAfter: "0",
    validBefore: String(validBefore),
    nonce,
  };
  return {
    typedData: {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      },
      primaryType: "TransferWithAuthorization" as const,
      domain: {
        name: accept.extra?.name ?? "USD Coin",
        version: accept.extra?.version ?? "2",
        chainId,
        verifyingContract: accept.asset,
      },
      message: authorization,
    },
    authorization,
    chainId,
  };
}

/** The X-PAYMENT header value: base64 of the v2 envelope. */
export function encodePaymentHeader(
  accept: X402Accept,
  authorization: Record<string, string>,
  signature: string,
): string {
  const envelope = {
    x402Version: 2,
    scheme: accept.scheme || "exact",
    network: accept.network,
    payload: { signature, authorization },
  };
  const json = JSON.stringify(envelope);
  if (typeof btoa === "function") return btoa(json);
  return Buffer.from(json, "utf8").toString("base64");
}

/** Pick the entry we can actually pay. Today that is the exact scheme on an eip155 chain. */
export function chooseAccept(challenge: X402Challenge): X402Accept {
  const list = challenge.accepts ?? [];
  if (!list.length) throw new Error("402 challenge carried no accepts[] — nothing to pay");
  const exact = list.find((a) => (a.scheme || "").toLowerCase() === "exact");
  if (!exact) {
    throw new Error(
      `no "exact" scheme in accepts[] (saw: ${list.map((a) => a.scheme).join(", ")}) — this wallet only signs EIP-3009 exact`,
    );
  }
  return exact;
}

export interface PayResult {
  status: number;
  body: unknown;
  paymentResponse: string | null;
  payer: string;
  header: string;
}

/**
 * Fetch a metered resource, and if it answers 402, sign the challenge and retry once.
 *
 * Returns the SECOND response. A second 402 is returned as-is rather than retried again:
 * looping on a rejected payment is how a client burns a buyer's signatures.
 */
export async function payAndFetch(
  url: string,
  wallet: DiscoveredWallet,
  init: RequestInit = {},
): Promise<PayResult> {
  const first = await fetch(url, init);
  if (first.status !== 402) {
    return {
      status: first.status,
      body: await first.json().catch(() => null),
      paymentResponse: first.headers.get("x-payment-response"),
      payer: "",
      header: "",
    };
  }

  const challenge = (await first.json()) as X402Challenge;
  const accept = chooseAccept(challenge);

  const accounts = (await wallet.provider.request({ method: "eth_requestAccounts" })) as string[];
  const from = accounts?.[0];
  if (!from) throw new Error("wallet returned no account");

  const { typedData, authorization, chainId } = buildTypedData(accept, from);

  // Sign on the wrong chain and the signature is valid but useless: the token contract's
  // domain separator includes chainId, so the facilitator rejects it after the buyer has
  // already approved. Check first and say which chain is needed.
  const current = (await wallet.provider.request({ method: "eth_chainId" })) as string;
  if (current && parseInt(current, 16) !== chainId) {
    throw new Error(
      `wallet is on chain ${parseInt(current, 16)} but this door settles on ${chainId} — switch network before paying`,
    );
  }

  const signature = (await wallet.provider.request({
    method: "eth_signTypedData_v4",
    params: [from, JSON.stringify(typedData)],
  })) as string;

  const header = encodePaymentHeader(accept, authorization, signature);
  const headers = new Headers(init.headers);
  headers.set("X-PAYMENT", header);
  const second = await fetch(url, { ...init, headers });

  return {
    status: second.status,
    body: await second.json().catch(() => null),
    paymentResponse: second.headers.get("x-payment-response"),
    payer: from,
    header,
  };
}
