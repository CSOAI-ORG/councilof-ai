/**
 * Browser-side x402 v2 exact/EVM signing.
 *
 * The wallet signs the EIP-3009 authorization. The caller then retries the
 * original MCP tool with the encoded PaymentPayload as `x_payment`, preserving
 * the tool's original arguments and request method. Private keys never leave
 * the wallet.
 */

export interface EIP1193Provider {
  request: (args: { method: string; params: unknown[] }) => Promise<unknown>;
}

export interface EIP6963ProviderDetail {
  info: { rdns: string; uuid: string; name: string; icon?: string };
  provider: EIP1193Provider;
}

export type X402Accepted = {
  scheme?: string;
  network?: string;
  asset?: string;
  payTo?: string | null;
  amount?: string;
  maxAmountRequired?: string;
  maxTimeoutSeconds?: number;
  extra?: {
    name?: string;
    version?: string;
    decimals?: number;
    symbol?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type X402Resource = {
  url: string;
  [key: string]: unknown;
};

export interface X402Challenge {
  x402Version?: number;
  /** The selected v2 PaymentRequirements object, retained field-for-field. */
  accepted?: X402Accepted;
  /** The v2 resource object, retained rather than rebuilt from its URL. */
  resourceInfo?: X402Resource;
  extensions?: Record<string, unknown>;
  chainId?: number;
  network?: string;
  asset?: string;
  payTo: string;
  amount: string;
  resource: string;
  nonce?: string | null;
  expires?: number | null;
  extra?: X402Accepted["extra"] | null;
  maxTimeoutSeconds?: number | null;
}

export type X402Authorization = {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
};

export type X402PaymentPayload = {
  x402Version: 2;
  /** Compatibility fields consumed by our v2-to-v1 facilitator adapter. */
  scheme: "exact";
  network: string;
  resource: X402Resource;
  accepted: X402Accepted;
  payload: {
    signature: string;
    authorization: X402Authorization;
  };
  extensions?: Record<string, unknown>;
};

export interface PaymentSignature {
  /** Standard-base64 JSON PaymentPayload, accepted by functions/api/_x402.ts. */
  header: string;
  address: string;
  payload: X402PaymentPayload;
}

/** "eip155:8453" -> 8453. Throws rather than guessing a chain. */
export function chainIdFromNetwork(network: string): number {
  const match = /^eip155:(\d+)$/.exec(network.trim());
  if (!match) throw new Error(`x402Wallet: unsupported network "${network}"`);
  return Number(match[1]);
}

/**
 * EIP-6963 discovery. The listener must exist before requestProvider is
 * dispatched because a provider may announce synchronously in that dispatch.
 */
export function discoverEIP6963(
  timeoutMs = 4000,
): Promise<EIP6963ProviderDetail | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (detail: EIP6963ProviderDetail | null) => {
      if (done) return;
      done = true;
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      if (timer !== undefined) clearTimeout(timer);
      resolve(detail);
    };
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (detail?.provider && typeof detail.provider.request === "function")
        finish(detail);
    };

    try {
      window.addEventListener("eip6963:announceProvider", onAnnounce);
      timer = setTimeout(() => finish(null), timeoutMs);
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    } catch {
      finish(null);
    }
  });
}

function randomBytes32(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function acceptedTerms(challenge: X402Challenge): {
  accepted: X402Accepted;
  network: string;
  asset: string;
  payTo: string;
  amount: string;
  extra: NonNullable<X402Accepted["extra"]>;
} {
  if (
    challenge.x402Version !== 2 ||
    !challenge.accepted ||
    !challenge.resourceInfo
  ) {
    throw new Error(
      "x402Wallet: a complete x402 v2 accepted/resource challenge is required",
    );
  }
  const accepted = challenge.accepted;
  if (accepted.scheme !== "exact") {
    throw new Error(
      `x402Wallet: unsupported payment scheme "${String(accepted.scheme)}"`,
    );
  }
  const network = accepted.network;
  const asset = accepted.asset;
  const payTo = accepted.payTo;
  const amount = accepted.amount;
  const extra = accepted.extra;
  if (!network || !asset || !payTo || !amount) {
    throw new Error(
      "x402Wallet: accepted must name network, asset, payTo and amount",
    );
  }
  if (!extra?.name || !extra.version) {
    throw new Error(
      "x402Wallet: accepted.extra must carry the token's EIP-712 name and version",
    );
  }
  return { accepted, network, asset, payTo, amount, extra };
}

/** Build the EIP-3009 TransferWithAuthorization typed data from accepted. */
export function buildTypedData(challenge: X402Challenge, signer: string) {
  const terms = acceptedTerms(challenge);
  const chainId = challenge.chainId ?? chainIdFromNetwork(terms.network);
  const nonce = challenge.nonce ?? randomBytes32();
  if (!/^0x[0-9a-fA-F]{64}$/.test(nonce)) {
    throw new Error("x402Wallet: EIP-3009 nonce must be a 32-byte hex value");
  }

  const now = Math.floor(Date.now() / 1000);
  const timeout =
    terms.accepted.maxTimeoutSeconds ?? challenge.maxTimeoutSeconds ?? 300;
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new Error("x402Wallet: maxTimeoutSeconds must be a positive number");
  }
  const timeoutEnd = now + Math.floor(timeout);
  const validBefore = challenge.expires != null
    ? Math.min(challenge.expires, timeoutEnd)
    : timeoutEnd;
  if (validBefore <= now)
    throw new Error("x402Wallet: the payment challenge has expired");

  const domain = {
    name: terms.extra.name,
    version: terms.extra.version,
    chainId,
    verifyingContract: terms.asset,
  };
  const types = {
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
  } as const;
  const message: X402Authorization = {
    from: signer,
    to: terms.payTo,
    value: terms.amount,
    validAfter: String(now),
    validBefore: String(validBefore),
    nonce,
  };
  return {
    domain,
    types,
    message,
    primaryType: "TransferWithAuthorization" as const,
  };
}

/** Standard-base64 encode the full JSON PaymentPayload expected by x402 v2. */
export function encodePaymentPayload(payload: X402PaymentPayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Render the exact atomic amount without floating-point rounding. */
export function formatPaymentAmount(challenge: X402Challenge): string {
  const atomic = challenge.accepted?.amount ?? challenge.amount;
  const decimals = challenge.accepted?.extra?.decimals;
  const symbol = challenge.accepted?.extra?.symbol;
  if (
    !/^\d+$/.test(atomic) ||
    !Number.isInteger(decimals) ||
    decimals! < 0 ||
    decimals! > 30
  ) {
    return `${atomic} atomic units${symbol ? ` ${symbol}` : ""}`;
  }
  const padded = atomic.padStart(decimals! + 1, "0");
  const split = padded.length - decimals!;
  const fraction = decimals ? padded.slice(split).replace(/0+$/, "") : "";
  const display = fraction
    ? `${padded.slice(0, split)}.${fraction}`
    : padded.slice(0, split);
  return `${display}${symbol ? ` ${symbol}` : ""} (${atomic} atomic units)`;
}

/** Sign one v2 exact/EVM challenge with an EIP-1193 provider. */
export async function signX402Challenge(
  provider: EIP1193Provider,
  challenge: X402Challenge,
): Promise<PaymentSignature> {
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
    params: [],
  })) as string[];
  const signer = accounts[0];
  if (!signer) throw new Error("x402Wallet: the wallet returned no account");

  const terms = acceptedTerms(challenge);
  const wanted = challenge.chainId ?? chainIdFromNetwork(terms.network);
  const chainHex = (await provider.request({
    method: "eth_chainId",
    params: [],
  })) as string;
  const actual = Number.parseInt(String(chainHex), 16);
  if (!/^0x[0-9a-fA-F]+$/.test(String(chainHex)) || !Number.isInteger(actual)) {
    throw new Error("x402Wallet: wallet returned a malformed chain id");
  }
  if (actual !== wanted) {
    throw new Error(
      `x402Wallet: wallet is on chain ${actual}, the 402 requires ${wanted}. Switch network and try again.`,
    );
  }

  const typedData = buildTypedData(challenge, signer);
  const signature = (await provider.request({
    method: "eth_signTypedData_v4",
    params: [signer, JSON.stringify(typedData)],
  })) as string;
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) {
    throw new Error(
      "x402Wallet: wallet returned a malformed 65-byte signature",
    );
  }

  const payload: X402PaymentPayload = {
    x402Version: 2,
    scheme: "exact",
    network: terms.network,
    resource: challenge.resourceInfo,
    accepted: terms.accepted,
    payload: { signature, authorization: typedData.message },
    ...(challenge.extensions !== undefined
      ? { extensions: challenge.extensions }
      : {}),
  };
  return { header: encodePaymentPayload(payload), address: signer, payload };
}

export function hexToBytes(hex: string): Uint8Array {
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) throw new Error("invalid hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
