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
  payTo: string;
  amount: string; // atomic USDC
  resource: string;
  nonce?: string | null;
  expires?: number | null; // unix seconds
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
export function buildTypedData(challenge: X402Challenge, signer: string) {
  const chainId = challenge.chainId ?? 8453; // Base default; the 402 owns the real one
  const nonce = challenge.nonce ?? crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const validAfter = now;
  const validBefore = challenge.expires ?? now + 3600;
  const domain = { name: "x402", version: "1", chainId, verifyingContract: challenge.payTo };
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
  const accounts = (await provider.request({ method: "eth_accounts", params: [] })) as string[];
  const signer = accounts[0];
  if (!signer) throw new Error("x402Wallet: no account selected");
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
