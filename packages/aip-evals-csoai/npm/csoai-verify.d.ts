// SPDX-License-Identifier: Apache-2.0
export type VerifyState = "VALID" | "INVALID" | "UNVERIFIABLE_KEY";
export interface VerifyResult { verified: boolean; state: VerifyState; debug: string }
export interface SignedRun {
  payload: { artifact?: { sha256?: string } } & Record<string, unknown>;
  signature: { did?: string; sig_ed25519?: string; payload_sha256?: string };
}
export function verifyCard(input: { signed: SignedRun | string; recordText: string; keys: Record<string, string> }): VerifyResult;
export function keysFromDid(did: unknown): Record<string, string>;
export function canon(v: unknown): string;
export function sha256(msg: Uint8Array): Uint8Array;
export function sha512(msg: Uint8Array): Uint8Array;
export function ed25519Verify(pub: Uint8Array, msg: Uint8Array, sig: Uint8Array): boolean;
