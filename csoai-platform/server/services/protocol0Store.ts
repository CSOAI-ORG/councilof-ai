/**
 * Protocol 0 persistent state store.
 *
 * Uses a local JSON file for durable, zero-config persistence in development
 * and small deployments. In production this should be replaced by a database
 * backend (the schema already lives in server/db/schema.ts).
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const STORE_DIR = path.resolve(process.cwd(), "server", "data");
const STORE_FILE = path.join(STORE_DIR, "protocol0-state.json");

export interface P0Identity {
  sigil: string;
  did: string;
  shortForm: string;
  publicKey: string; // base64url raw 32-byte Ed25519 public key
  alias?: string;
  createdAt: string;
}

export interface P0Message {
  id: string;
  envelope: {
    version: string;
    messageId: string;
    sender: string;
    recipient: string;
    timestamp: string;
    type: string;
    payload: Record<string, any>;
  };
  signature: string;
  accepted: boolean;
  signatureValid: boolean;
  storedAt: string;
}

export interface P0Vote {
  voteId: string;
  proposalId: string;
  sessionId?: number;
  vote: string;
  voter: string;
  signature: string;
  signatureValid: boolean;
  timestamp: string;
}

export interface P0Attestation {
  attestationId: string;
  attester: string;
  subject: string;
  claim: string;
  evidence?: Record<string, any>;
  timestamp: string;
}

export interface P0Payment {
  paymentId: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  protocol: string;
  amount: string;
  currency: string;
  payer: string;
  payee: string;
  purpose: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  settledAt?: string;
}

export interface P0SessionState {
  sessionId: string;
  proposalId: string;
  title?: string;
  status: "voting" | "consensus_reached" | "escalated" | "closed";
  votes: P0Vote[];
  tally: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface P0Snapshot {
  version: string;
  exportedAt: string;
  identities: P0Identity[];
  messages: P0Message[];
  votes: P0Vote[];
  sessions: P0SessionState[];
  attestations: P0Attestation[];
  payments: P0Payment[];
}

const defaultState: P0Snapshot = {
  version: "0.1.0",
  exportedAt: new Date().toISOString(),
  identities: [],
  messages: [],
  votes: [],
  sessions: [],
  attestations: [],
  payments: [],
};

async function ensureStoreDir() {
  if (!existsSync(STORE_DIR)) {
    await mkdir(STORE_DIR, { recursive: true });
  }
}

export async function loadState(): Promise<P0Snapshot> {
  await ensureStoreDir();
  try {
    const raw = await readFile(STORE_FILE, "utf-8");
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

export async function saveState(state: P0Snapshot): Promise<void> {
  await ensureStoreDir();
  await writeFile(STORE_FILE, JSON.stringify(state, null, 2));
}

export async function withState<T>(fn: (state: P0Snapshot) => { state: P0Snapshot; result: T }): Promise<T> {
  const state = await loadState();
  const { state: nextState, result } = fn(state);
  nextState.exportedAt = new Date().toISOString();
  await saveState(nextState);
  return result;
}

export async function getIdentityBySigil(sigil: string): Promise<P0Identity | undefined> {
  const state = await loadState();
  return state.identities.find((i) => i.sigil === sigil || i.did === sigil);
}

export async function getIdentityByPublicKey(publicKey: string): Promise<P0Identity | undefined> {
  const state = await loadState();
  return state.identities.find((i) => i.publicKey === publicKey);
}

export async function registerIdentity(identity: P0Identity): Promise<P0Identity> {
  return withState<{ identity: P0Identity; existed: boolean }>((state) => {
    const existingIndex = state.identities.findIndex(
      (i) => i.sigil === identity.sigil || i.publicKey === identity.publicKey,
    );
    if (existingIndex >= 0) {
      return { state, result: { identity: state.identities[existingIndex], existed: true } };
    }
    state.identities.push(identity);
    return { state, result: { identity, existed: false } };
  }).then((r) => r.identity);
}

export async function logMessage(message: P0Message): Promise<P0Message> {
  return withState<P0Message>((state) => {
    state.messages.push(message);
    // Keep last 10,000 messages to avoid unbounded growth.
    if (state.messages.length > 10_000) {
      state.messages = state.messages.slice(-10_000);
    }
    return { state, result: message };
  });
}

export async function getMessages(): Promise<P0Message[]> {
  const state = await loadState();
  return state.messages;
}

export async function getOrCreateSession(proposalId: string, title?: string): Promise<P0SessionState> {
  return withState<P0SessionState>((state) => {
    let session = state.sessions.find((s) => s.proposalId === proposalId);
    if (!session) {
      session = {
        sessionId: `sess-${Date.now()}`,
        proposalId,
        title,
        status: "voting",
        votes: [],
        tally: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.sessions.push(session);
    }
    return { state, result: session };
  });
}

export async function addVoteToSession(
  proposalId: string,
  vote: P0Vote,
): Promise<P0SessionState> {
  return withState<P0SessionState>((state) => {
    let session = state.sessions.find((s) => s.proposalId === proposalId);
    if (!session) {
      session = {
        sessionId: `sess-${Date.now()}`,
        proposalId,
        status: "voting",
        votes: [],
        tally: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.sessions.push(session);
    }
    session.votes.push(vote);
    session.tally[vote.vote] = (session.tally[vote.vote] || 0) + 1;
    session.updatedAt = new Date().toISOString();

    // Simple consensus: any vote type reaches 3 votes wins.
    const threshold = 3;
    const winner = Object.entries(session.tally).find(([, count]) => count >= threshold);
    if (winner) {
      session.status = winner[0] === "escalate" ? "escalated" : "consensus_reached";
    }
    return { state, result: session };
  });
}

export async function recordAttestation(attestation: P0Attestation): Promise<P0Attestation> {
  return withState<P0Attestation>((state) => {
    state.attestations.push(attestation);
    return { state, result: attestation };
  });
}

export async function recordPayment(payment: P0Payment): Promise<P0Payment> {
  return withState<P0Payment>((state) => {
    state.payments.push(payment);
    return { state, result: payment };
  });
}

export async function updatePayment(paymentId: string, patch: Partial<P0Payment>): Promise<P0Payment | null> {
  return withState<P0Payment | null>((state) => {
    const idx = state.payments.findIndex((p) => p.paymentId === paymentId);
    if (idx < 0) return { state, result: null };
    state.payments[idx] = { ...state.payments[idx], ...patch };
    return { state, result: state.payments[idx] };
  });
}

export async function getPayment(paymentId: string): Promise<P0Payment | undefined> {
  const state = await loadState();
  return state.payments.find((p) => p.paymentId === paymentId);
}

export async function getSessions(): Promise<P0SessionState[]> {
  const state = await loadState();
  return state.sessions;
}

export async function exportSnapshot(): Promise<P0Snapshot> {
  const state = await loadState();
  return { ...state, exportedAt: new Date().toISOString() };
}

export async function importSnapshot(snapshot: P0Snapshot): Promise<void> {
  await saveState({
    ...defaultState,
    ...snapshot,
    version: snapshot.version || defaultState.version,
    exportedAt: new Date().toISOString(),
  });
}
