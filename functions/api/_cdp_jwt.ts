// functions/api/_cdp_jwt.ts — mints the short-lived JWT that Coinbase CDP requires on every
// facilitator call. This exists because the estate's x402 rail cannot settle on Base MAINNET
// without it, and that fact was discovered by probing, not by reading a roadmap:
//
//   POST https://x402.org/facilitator/verify           → 400 missing_parameters  (no auth at all)
//   GET  https://x402.org/facilitator/supported        → eip155:84532 ONLY       (Base SEPOLIA)
//   POST https://api.cdp.coinbase.com/platform/v2/x402/verify → 401 Unauthorized (auth required)
//
// So: the free public facilitator is testnet-only and can never move real USDC, and the one
// facilitator that serves Base mainnet (eip155:8453 — the network our payTo is on) rejects both
// anonymous calls AND a static bearer token. Per CDP's v2 auth contract, a Bearer token here is a
// PER-REQUEST signed JWT, valid 2 minutes, whose `uri` claim binds the exact method+host+path
// being called. A single long-lived `X402_FACILITATOR_TOKEN` therefore cannot authenticate to CDP
// — which is why setting only `X402_FACILITATOR_URL` would NOT have turned the rail live. It
// would have produced `facilitator /verify HTTP 401` on every paid request.
//
// SECURITY POSTURE: the CDP secret signs assertions of our own identity to CDP. It cannot move
// funds by itself and it never leaves the Worker. The EIP-3009 authorization the payer signs
// names `payTo` explicitly, so a facilitator — CDP included — can submit the transfer but cannot
// redirect it. No key material is in this repo; both values are Cloudflare Pages secrets.
//
// FAIL-CLOSED: with no CDP credentials configured, every function here returns null and the rail
// behaves exactly as before (challenge-only). Nothing about this module can start charging.

/** CDP credentials, as Cloudflare passes them. Absent → this module is inert. */
export type CdpEnv = {
  /** Secret API Key ID (a UUID), from CDP portal → API keys. */
  CDP_API_KEY_ID?: string;
  /** Base64 Ed25519 secret (64 bytes: 32-byte seed ‖ 32-byte public key). */
  CDP_API_KEY_SECRET?: string;
};

/** base64url without padding — JWT segment encoding (RFC 7515 §2). */
function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function b64decode(s: string): Uint8Array {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(norm);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Web Crypto imports raw Ed25519 material for PUBLIC keys only; a private key must arrive as
 * PKCS#8. CDP hands out the raw 32-byte seed (inside a 64-byte seed‖public blob), so we wrap it
 * in the fixed PKCS#8 prefix for id-Ed25519 (RFC 8410 §7): SEQUENCE, version 0, AlgorithmIdentifier
 * 1.3.101.112, then the seed as an OCTET STRING inside an OCTET STRING.
 */
const PKCS8_ED25519_PREFIX = new Uint8Array([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

function pkcs8FromSeed(seed: Uint8Array): Uint8Array {
  if (seed.length !== 32) throw new Error(`Ed25519 seed must be 32 bytes, got ${seed.length}`);
  const out = new Uint8Array(PKCS8_ED25519_PREFIX.length + 32);
  out.set(PKCS8_ED25519_PREFIX, 0);
  out.set(seed, PKCS8_ED25519_PREFIX.length);
  return out;
}

/**
 * Decode a CDP Ed25519 secret. CDP encodes 64 bytes (seed ‖ public); some exports carry only the
 * 32-byte seed. Both are accepted; anything else is a configuration error worth failing loudly on,
 * because a silently-wrong key would surface much later as an opaque 401 mid-settlement.
 */
export function seedFromCdpSecret(secret: string): Uint8Array {
  const raw = b64decode(secret.trim());
  if (raw.length === 64) return raw.slice(0, 32);
  if (raw.length === 32) return raw;
  throw new Error(`CDP_API_KEY_SECRET decoded to ${raw.length} bytes; expected 32 or 64`);
}

/** Cloudflare exposes Ed25519 under the standard name; older runtimes used NODE-ED25519. */
async function importEd25519(seed: Uint8Array): Promise<CryptoKey> {
  const pkcs8 = pkcs8FromSeed(seed);
  for (const algo of ["Ed25519", "NODE-ED25519"]) {
    try {
      return await crypto.subtle.importKey("pkcs8", pkcs8, { name: algo } as EcKeyImportParams, false, [
        "sign",
      ]);
    } catch {
      /* try the next spelling */
    }
  }
  throw new Error("runtime does not support Ed25519 signing");
}

export type MintArgs = {
  keyId: string;
  keySecret: string;
  /** HTTP method of the call being authenticated, e.g. "POST". */
  method: string;
  /** Host only, no scheme, e.g. "api.cdp.coinbase.com". */
  host: string;
  /** Path with leading slash, e.g. "/platform/v2/x402/verify". */
  path: string;
  /** Injectable for deterministic tests; defaults to now. */
  nowSeconds?: number;
  /** Injectable for deterministic tests; defaults to 16 random bytes, hex. */
  nonce?: string;
};

/**
 * mintCdpJwt — one CDP bearer for ONE request. The `uri` claim binds method+host+path, so a token
 * minted for /verify is not valid for /settle; callers must mint per endpoint. Lifetime is 120s,
 * matching CDP's documented default, so a leaked token is near-worthless.
 */
export async function mintCdpJwt(args: MintArgs): Promise<string> {
  const now = args.nowSeconds ?? Math.floor(Date.now() / 1000);
  const nonce =
    args.nonce ??
    Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const header = { alg: "EdDSA", typ: "JWT", kid: args.keyId, nonce };
  const claims = {
    sub: args.keyId,
    iss: "cdp",
    aud: ["cdp_service"],
    nbf: now,
    exp: now + 120,
    uri: `${args.method.toUpperCase()} ${args.host}${args.path}`,
  };

  const signingInput = `${b64url(utf8(JSON.stringify(header)))}.${b64url(utf8(JSON.stringify(claims)))}`;
  const key = await importEd25519(seedFromCdpSecret(args.keySecret));
  const sig = new Uint8Array(await crypto.subtle.sign("Ed25519", key, utf8(signingInput)));
  return `${signingInput}.${b64url(sig)}`;
}

/** CDP is the only facilitator that needs this dance; recognise it by host, not by guesswork. */
export function isCdpFacilitator(facilitatorUrl: string): boolean {
  try {
    return new URL(facilitatorUrl).hostname.endsWith("cdp.coinbase.com");
  } catch {
    return false;
  }
}

/**
 * maybeMintCdpJwt — returns a bearer for this exact call, or null when the facilitator isn't CDP
 * or the credentials aren't provisioned. Never throws into the payment path: a credential problem
 * degrades to "no auth header", which the facilitator answers with a 401 that the caller already
 * reports honestly as a settle failure. Fail-closed beats a 500.
 */
export async function maybeMintCdpJwt(
  env: CdpEnv,
  facilitator: string,
  method: string,
  path: string,
): Promise<string | null> {
  if (!isCdpFacilitator(facilitator)) return null;
  const keyId = (env.CDP_API_KEY_ID || "").trim();
  const keySecret = (env.CDP_API_KEY_SECRET || "").trim();
  if (!keyId || !keySecret) return null;
  try {
    const host = new URL(facilitator).hostname;
    return await mintCdpJwt({ keyId, keySecret, method, host, path });
  } catch {
    return null;
  }
}
