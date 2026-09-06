/**
 * x402Wallet.ts — the "Pay" button plumbing for the x402 402 challenge.
 *
 * Turns the OS ToolRunner's "paste x_payment" into a one-click signature:
 *   EIP-6963 provider discovery → eth_signTypedData_v4 over the x402 EIP-3009
 *   TransferWithAuthorization terms from the 402 challenge → PAYMENT-SIGNATURE header.
 *
 * The server already accepts the header (functions/api/_x402.ts). This module only
 * makes the client-side signature; it never stores keys and never types a secret.
 *
 * Pure encoding helpers are exported and unit-tested (no wallet required).
 */

export interface EIP6963ProviderDetail {
  info?: { rdns?: string; uuid?: string; name?: string };
  providers?: unknown[];
}

export interface X402Challenge {
  chainId?: number;
  /** CAIP-2 network from the 402, e.g. "eip155:8453". Preferred over chainId. */
  network?: string;
  /** The TOKEN contract from accepts[0].asset. This is the EIP-712 verifyingContract. */
  asset?: string;
  /** The payee from accepts[0].payTo. This is the `to` in the message, NOT the domain. */
  payTo: string;
  amount: string; // atomic USDC
  resource: string;
  nonce?: string | null;
  expires?: number | null; // unix seconds
  /** accepts[0].extra — the token's own EIP-712 domain name and version. */
  extra?: { name?: string; version?: string } | null;
}

/** "eip155:8453" -> 8453. Throws rather than guessing a chain to sign on. */
export function chainIdFromNetwork(network: string): number {
  const m = /^eip155:(\d+)$/.exec(network.trim());
  if (!m) throw new Error(`x402Wallet: unsupported network "${network}"`);
  return Number(m[1]);
}

export interface PaymentSignature {
  header: string; // PAYMENT-SIGNATURE value: base64url(r || s || v)
  address: string; // signer
}

// EIP-6963: discover the injected provider (MetaMask, WalletConnect-injected, etc.)
export function discoverEIP6963(timeoutMs = 4000): Promise<EIP6963ProviderDetail | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (d: EIP6963ProviderDetail | null) => {
      if (!done) {
        done = true;
        if (typeof window !== "undefined") window.removeEventListener("eip6963:announceProvider", onAnnounce);
        clearTimeout(timer);
        resolve(d);
      }
    };
    const onAnnounce = (ev: Event) => {
      const detail = (ev as CustomEvent<{ detail?: EIP6963ProviderDetail }>).detail;
      if (detail?.detail?.info?.rdns || detail?.detail?.providers?.length) {
        finish(detail.detail ?? null);
      }
    };
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("eip6963:requestProvider"));
        window.addEventListener("eip6963:announceProvider", onAnnounce);
      }
    } catch {
      finish(null);
    }
    const timer = setTimeout(() => finish(null), timeoutMs);
  });
}

// Build the EIP-3009 TransferWithAuthorization typed-data terms from the challenge.
/**
 * The EIP-712 payload for EIP-3009 TransferWithAuthorization.
 *
 * THE DOMAIN IS THE TOKEN'S, NOT OURS. Measured against the live 402 from
 * GET /api/free-door on 2026-09-06:
 *
 *   accepts[0].asset = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913   (USDC, Base)
 *   accepts[0].payTo = 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31   (the payee)
 *   accepts[0].extra = { name: "USD Coin", version: "2", decimals: 6 }
 *
 * This function used to hardcode `name: "x402", version: "1"` and set
 * `verifyingContract: challenge.payTo`. All three were wrong: the domain
 * separator is the token contract's, so a signature built that way is not a
 * valid EIP-3009 authorization for USDC and the facilitator cannot verify it.
 * It fails AFTER the buyer approves in their wallet, and the rejection looks
 * like the buyer's fault.
 *
 * When the 402 does not carry what the domain needs, this THROWS. Falling back
 * to a default produces a signature that looks fine and is worthless.
 */
export function buildTypedData(challenge: X402Challenge, signer: string) {
  const chainId =
    challenge.chainId ?? (challenge.network ? chainIdFromNetwork(challenge.network) : undefined);
  if (chainId === undefined) {
    throw new Error("x402Wallet: the 402 named no chain — refusing to guess one to sign on");
  }
  const verifyingContract = challenge.asset;
  if (!verifyingContract) {
    throw new Error(
      "x402Wallet: the 402 named no asset — the EIP-712 domain is the TOKEN's, and payTo is not it",
    );
  }
  const name = challenge.extra?.name;
  const version = challenge.extra?.version;
  if (!name || !version) {
    throw new Error(
      "x402Wallet: accepts[0].extra must carry the token's EIP-712 name and version",
    );
  }
  const nonce = challenge.nonce ?? crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const validAfter = now;
  const validBefore = challenge.expires ?? now + 3600;
  const domain = { name, version, chainId, verifyingContract };
  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  } as const;
  const message = {
    from: signer,
    to: challenge.payTo,
    value: challenge.amount,
    validAfter,
    validBefore,
    nonce,
  };
  return { domain, types, message, primaryType: "TransferWithAuthorization" as const };
}

// base64url(r(32) || s(32) || v(1)) — the wire format for the PAYMENT-SIGNATURE header.
export function encodePaymentSignature(r: Uint8Array, s: Uint8Array, v: number): string {
  const out = new Uint8Array(65);
  out.set(r, 0);
  out.set(s, 32);
  out[64] = v;
  let bin = "";
  for (const b of out) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Sign the challenge with a discovered provider (typed-data v4, EIP-1193 request).
export async function signX402Challenge(
  provider: { request: (args: { method: string; params: unknown[] }) => Promise<unknown> },
  challenge: X402Challenge,
): Promise<PaymentSignature> {
  // eth_accounts returns [] until the user has connected, so asking for it first
  // turned "you have not connected yet" into "no account selected" — a dead end
  // with no way forward. eth_requestAccounts prompts, which is the actual next step.
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
    params: [],
  })) as string[];
  const signer = accounts[0];
  if (!signer) throw new Error("x402Wallet: the wallet returned no account");

  // Check the chain BEFORE signing. A signature over the wrong chainId is
  // rejected by the facilitator after the buyer has already approved it.
  const wanted =
    challenge.chainId ?? (challenge.network ? chainIdFromNetwork(challenge.network) : undefined);
  const onChainHex = (await provider.request({ method: "eth_chainId", params: [] })) as string;
  const onChain = Number.parseInt(String(onChainHex), 16);
  if (wanted !== undefined && Number.isFinite(onChain) && onChain !== wanted) {
    throw new Error(
      `x402Wallet: wallet is on chain ${onChain}, the 402 requires ${wanted}. Switch network and try again.`,
    );
  }

  const typedData = buildTypedData(challenge, signer);
  const sig = (await provider.request({
    method: "eth_signTypedData_v4",
    params: [signer, JSON.stringify(typedData)],
  })) as string;
  const bytes = hexToBytes(sig.replace(/^0x/, ""));
  const r = bytes.slice(0, 32);
  const s = bytes.slice(32, 64);
  const v = bytes[64];
  return { header: encodePaymentSignature(r, s, v), address: signer };
}

export function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
