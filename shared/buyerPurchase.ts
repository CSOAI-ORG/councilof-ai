/** Pure request commitment shared by the existing browser and Pages payment path. */
export const BUYER_NONCE_PREFIX = "0x43534f31";
export const BUYER_BODY_MAX_BYTES = 20 * 1024 * 1024;
export type PurchaseIdentity = Readonly<{ url: string; resource: string; method: string; body_sha256: string }>;
const digestPattern = /^[a-f0-9]{64}$/;
export const validGeneration = (value: unknown): value is string => typeof value === "string" && digestPattern.test(value);
export async function purchaseSha256(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
}
export async function buyerOwnerHash(subject: string, generation: string): Promise<string> {
  if (!subject || !validGeneration(generation)) throw new Error("qualified account generation required");
  return purchaseSha256(new TextEncoder().encode(JSON.stringify(["csoai.purchase-owner/1",subject,generation])));
}
export function purchaseSeed(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,"0")).join("");
}
export function checkedPurchaseUrl(value: string, origin: string): string {
  const u = new URL(value,origin);
  if (u.origin !== origin || u.username || u.password || u.hash || !u.pathname.startsWith("/api/"))
    throw new Error("same-origin API resource required");
  return u.href;
}
export async function buyerNonce(owner: string, identity: PurchaseIdentity, seed: string): Promise<string> {
  if (!validGeneration(owner) || !validGeneration(seed) || !digestPattern.test(identity.body_sha256) ||
      !/^[A-Z]+$/.test(identity.method)) throw new Error("invalid purchase commitment input");
  const hash = await purchaseSha256(new TextEncoder().encode(JSON.stringify([
    "csoai.request-bound-purchase/1",owner,identity.url,identity.resource,identity.method,identity.body_sha256,seed,
  ])));
  return BUYER_NONCE_PREFIX + hash.slice(0,56);
}
export const isBuyerNonce = (nonce: unknown): boolean =>
  typeof nonce === "string" && nonce.toLowerCase().startsWith(BUYER_NONCE_PREFIX);
export type PurchasePreparation = Readonly<{ schema:"csoai.purchase-preparation/1"; nonce:string; seed:string; owner_hash:string; request:PurchaseIdentity }>;
