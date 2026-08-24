/**
 * Local hash-chained training-outcome records.
 *
 * DESIGN until an edge Ed25519 key signs the payload (same posture as
 * /api/regulation: no key → no signature field). A SHA-256 chain is still
 * a stranger-checkable integrity trail for the demo; it is not a Council
 * attestation. Never call this a certificate.
 */

import { TRAINING_GRAMMAR, type TrainingLane, type TrainingWorld } from "@/data/liveTraining";

export const OUTCOME_KIND = "csoai.training-outcome/0.1";
const STORE_KEY = "csoai.training-outcomes";

export type TrainingOutcome = {
  kind: typeof OUTCOME_KIND;
  grammar: typeof TRAINING_GRAMMAR.product;
  id: string;
  issuedAt: string;
  lane: TrainingLane;
  world: TrainingWorld;
  industry: string;
  changeCardId: string;
  frozenRef: string;
  beats: { beatId: string; choiceId: string; correct: boolean }[];
  correctCount: number;
  total: number;
  prevHead: string | null;
  contentHash: string;
  signature: { status: "UNSIGNED"; note: string };
};

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  if (globalThis.crypto?.subtle) {
    return hex(await crypto.subtle.digest("SHA-256", data));
  }
  // Node test fallback without subtle (should not hit on Node 20+).
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(text).digest("hex");
}

function canonical(o: unknown): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return `[${o.map(canonical).join(",")}]`;
  const r = o as Record<string, unknown>;
  return `{${Object.keys(r).sort().map((k) => `${JSON.stringify(k)}:${canonical(r[k])}`).join(",")}}`;
}

export async function hashOutcomeBody(o: Omit<TrainingOutcome, "contentHash" | "signature">): Promise<string> {
  return sha256Hex(canonical(o));
}

export function loadOutcomes(): TrainingOutcome[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrainingOutcome[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOutcomes(rows: TrainingOutcome[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(rows));
}

export async function mintOutcome(input: {
  lane: TrainingLane;
  world: TrainingWorld;
  industry: string;
  changeCardId: string;
  frozenRef: string;
  beats: { beatId: string; choiceId: string; correct: boolean }[];
}): Promise<TrainingOutcome> {
  const prev = loadOutcomes();
  const prevHead = prev[0]?.contentHash ?? null;
  const draft: Omit<TrainingOutcome, "contentHash" | "signature"> = {
    kind: OUTCOME_KIND,
    grammar: TRAINING_GRAMMAR.product,
    id: `tor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    issuedAt: new Date().toISOString(),
    lane: input.lane,
    world: input.world,
    industry: input.industry,
    changeCardId: input.changeCardId,
    frozenRef: input.frozenRef,
    beats: input.beats,
    correctCount: input.beats.filter((b) => b.correct).length,
    total: input.beats.length,
    prevHead,
  };
  const contentHash = await hashOutcomeBody(draft);
  const row: TrainingOutcome = {
    ...draft,
    contentHash,
    signature: {
      status: "UNSIGNED",
      note: "Hash-chained on this device. Ed25519 attestation is DESIGN until the board-attestation key signs training-outcome cards. Not a certificate. Not a compliance determination.",
    },
  };
  saveOutcomes([row, ...prev].slice(0, 20));
  return row;
}

export async function verifyOutcome(row: TrainingOutcome): Promise<{ ok: boolean; reason: string }> {
  const { contentHash, signature, ...body } = row;
  const expect = await hashOutcomeBody(body);
  if (expect !== contentHash) return { ok: false, reason: "contentHash does not match the canonical body" };
  if (signature.status !== "UNSIGNED") return { ok: false, reason: "unexpected signature status" };
  return { ok: true, reason: "Hash matches. No Council Ed25519 signature is present — this is an integrity trail, not an attestation." };
}
