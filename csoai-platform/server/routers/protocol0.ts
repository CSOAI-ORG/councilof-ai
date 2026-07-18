/**
 * Protocol 0 Router — MEOK agent-native infrastructure endpoints.
 *
 * Hardened implementation:
 *  - Layer 0 Identity: Ed25519 Sigil registry with persistent public metadata.
 *  - Layer 1 Discovery: A2A Agent Card.
 *  - Layer 2 Communication: signed envelope validation + immutable message log.
 *  - Layer 3 Trust: reputation + persisted attestations.
 *  - Layer 4 Transaction: Stripe x402-style payment intents.
 *  - Layer 5 Governance: signed votes with live session tally.
 *  - System: snapshot/restore of Protocol 0 state.
 */

import { z } from "zod";
import crypto from "crypto";
import Stripe from "stripe";
import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../db/trpc";
import {
  registerIdentity,
  getIdentityBySigil,
  getIdentityByPublicKey,
  logMessage,
  getMessages,
  getOrCreateSession,
  addVoteToSession,
  recordAttestation,
  recordPayment,
  updatePayment,
  getPayment,
  getSessions,
  exportSnapshot,
  importSnapshot,
  type P0Vote,
  type P0Identity,
} from "../services/protocol0Store";

const SOV_TOWN_URL = process.env.SOV_TOWN_URL || "http://127.0.0.1:3940";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.acacia" as any })
  : null;

// ============================================================================
// CRYPTO HELPERS
// ============================================================================

function rawPublicKeyToSpki(raw: Buffer) {
  const algoOid = Buffer.from([0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70]);
  const bitString = Buffer.concat([Buffer.from([0x03, 0x21, 0x00]), raw]);
  return Buffer.concat([Buffer.from([0x30, 0x2a]), algoOid, bitString]);
}

function didFromPublicKey(publicKeyBase64: string) {
  const raw = Buffer.from(publicKeyBase64, "base64url");
  const hash = crypto.createHash("sha3-256").update(raw).digest();
  const id = hash.slice(0, 20).toString("base64url").replace(/=/g, "");
  return `did:sigil:${id}`;
}

function shortForm(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

async function verifyEd25519(
  message: string,
  signatureBase64url: string,
  publicKeyBase64url: string,
): Promise<boolean> {
  try {
    const pub = Buffer.from(publicKeyBase64url, "base64url");
    if (pub.length !== 32) return false;
    const keyObj = crypto.createPublicKey({
      key: rawPublicKeyToSpki(pub),
      format: "der",
      type: "spki",
    });
    const sig = Buffer.from(signatureBase64url, "base64url");
    return crypto.verify(null, Buffer.from(message), keyObj, sig);
  } catch {
    return false;
  }
}

// ============================================================================
// LAYER 0 — IDENTITY
// ============================================================================

const identityRouter = router({
  createSigil: publicProcedure
    .input(z.object({ alias: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      const pubDer = crypto.createPublicKey(publicKey).export({ type: "spki", format: "der" });
      const rawPub = pubDer.slice(-32);
      const publicKeyBase64 = rawPub.toString("base64url");
      const sigil = didFromPublicKey(publicKeyBase64);

      const identity: P0Identity = {
        sigil,
        did: sigil,
        shortForm: shortForm(sigil.replace("did:sigil:", "")),
        publicKey: publicKeyBase64,
        alias: input.alias,
        createdAt: new Date().toISOString(),
      };
      await registerIdentity(identity);

      return {
        sigil,
        did: sigil,
        shortForm: identity.shortForm,
        publicKey: publicKeyBase64,
        privateKey: Buffer.from(privateKey).toString("base64url"),
        algorithm: "Ed25519",
        warning:
          "The privateKey is returned once for testing only. Store it securely and never transmit it again.",
      };
    }),

  resolveDid: publicProcedure
    .input(z.object({ did: z.string().startsWith("did:sigil:") }))
    .query(async ({ input }) => {
      const id = input.did.replace("did:sigil:", "");
      const identity = await getIdentityBySigil(input.did);
      const publicKeyMultibase = identity?.publicKey ? `z${identity.publicKey}` : `z${id}`;
      return {
        "@context": ["https://www.w3.org/ns/did/v1"],
        id: input.did,
        verificationMethod: [
          {
            id: `${input.did}#key-1`,
            type: "Ed25519VerificationKey2020",
            controller: input.did,
            publicKeyMultibase,
          },
        ],
        authentication: [`${input.did}#key-1`],
        assertionMethod: [`${input.did}#key-1`],
        service: [
          {
            id: `${input.did}#messaging`,
            type: "AgentMessagingEndpoint",
            serviceEndpoint: `${SOV_TOWN_URL}/api/messages/${id}`,
          },
        ],
        capability: [
          {
            id: `${input.did}#cap-1`,
            type: "Protocol0Messaging",
            version: "0.1.0",
          },
        ],
      };
    }),

  verifySignature: publicProcedure
    .input(
      z.object({
        message: z.string(),
        signature: z.string(),
        publicKey: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const valid = await verifyEd25519(input.message, input.signature, input.publicKey);
      return { valid };
    }),

  signMessage: protectedProcedure
    .input(z.object({ message: z.string(), privateKeyPem: z.string() }))
    .mutation(({ input }) => {
      try {
        const key = crypto.createPrivateKey(input.privateKeyPem);
        const signature = crypto.sign(null, Buffer.from(input.message), key);
        return { signature: signature.toString("base64url") };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: message };
      }
    }),

  listIdentities: publicProcedure.query(async () => {
    const { identities } = await exportSnapshot();
    return identities.map(({ privateKey: _, ...rest }) => rest);
  }),
});

// ============================================================================
// LAYER 1 — DISCOVERY
// ============================================================================

const discoveryRouter = router({
  agentCard: publicProcedure.query(() => ({
    name: "CSOAI Protocol 0 Gateway",
    description: "Layer 0 trust infrastructure for the agentic economy.",
    url: "https://csoai.org",
    version: "0.1.0",
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    protocol: "A2A",
    skills: [
      {
        id: "csoai-governance",
        name: "BFT Governance Vote",
        description: "Submit a cryptographically signed vote to the 33-Agent Council.",
        tags: ["governance", "voting", "compliance"],
        examples: ["Vote APPROVE on policy proposal #123"],
      },
      {
        id: "csoai-compliance",
        name: "Compliance Check",
        description: "Run a compliance scan against EU AI Act, NIST AI RMF, ISO 42001, and more.",
        tags: ["compliance", "audit"],
        examples: ["Check system X against EU AI Act Article 50"],
      },
      {
        id: "csoai-pheromone",
        name: "Signal Broadcast",
        description: "Emit a pheromone signal to the agent town mesh.",
        tags: ["messaging", "discovery"],
        examples: ["Emit HELP signal with strength 0.8"],
      },
    ],
  })),
});

// ============================================================================
// LAYER 2 — COMMUNICATION
// ============================================================================

const envelopeSchema = z.object({
  version: z.string().default("0.1.0"),
  messageId: z.string(),
  sender: z.string().startsWith("did:sigil:"),
  recipient: z.string().startsWith("did:sigil:"),
  timestamp: z.string().datetime(),
  type: z.enum([
    "HELLO",
    "REQUEST",
    "RESPONSE",
    "PROPOSAL",
    "VOTE",
    "COMMIT",
    "REJECT",
    "STREAM_OPEN",
    "STREAM_CHUNK",
    "STREAM_CLOSE",
    "HEARTBEAT",
    "ATTESTATION",
    "PAYMENT",
    "DELEGATE",
    "REVOKE",
    "ERROR",
  ]),
  payload: z.record(z.any()),
});

const communicationRouter = router({
  sendEnvelope: publicProcedure
    .input(z.object({ envelope: envelopeSchema, signature: z.string() }))
    .mutation(async ({ input }) => {
      const identity = await getIdentityBySigil(input.envelope.sender);
      let signatureValid = false;
      if (identity) {
        const canonical = JSON.stringify(input.envelope);
        signatureValid = await verifyEd25519(canonical, input.signature, identity.publicKey);
      }

      const message = await logMessage({
        id: input.envelope.messageId,
        envelope: input.envelope,
        signature: input.signature,
        accepted: true,
        signatureValid,
        storedAt: new Date().toISOString(),
      });

      // Route VOTE envelopes into governance.
      if (signatureValid && input.envelope.type === "VOTE" && input.envelope.payload?.proposalId) {
        const vote: P0Vote = {
          voteId: `vote-${Date.now()}`,
          proposalId: input.envelope.payload.proposalId,
          vote: input.envelope.payload.vote,
          voter: input.envelope.sender,
          signature: input.signature,
          signatureValid: true,
          timestamp: new Date().toISOString(),
        };
        await addVoteToSession(input.envelope.payload.proposalId, vote);
      }

      return {
        accepted: true,
        signatureValid,
        messageId: message.id,
        routing: {
          sender: input.envelope.sender,
          recipient: input.envelope.recipient,
          type: input.envelope.type,
        },
        timestamp: message.storedAt,
      };
    }),

  messageTypes: publicProcedure.query(() => ({
    types: envelopeSchema.shape.type.options,
  })),

  listMessages: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const messages = await getMessages();
      return messages.slice(-input.limit);
    }),
});

// ============================================================================
// LAYER 3 — TRUST
// ============================================================================

const trustRouter = router({
  getReputation: publicProcedure
    .input(z.object({ sigil: z.string().startsWith("did:sigil:") }))
    .query(async ({ input }) => {
      const state = await exportSnapshot();
      const attestations = state.attestations.filter(
        (a) => a.subject === input.sigil || a.attester === input.sigil,
      ).length;
      const messages = state.messages.filter(
        (m) => m.envelope.sender === input.sigil && m.signatureValid,
      ).length;
      const score = Math.min(0.99, 0.5 + attestations * 0.02 + messages * 0.005);
      return {
        sigil: input.sigil,
        score,
        level: score > 0.8 ? "TRUSTED" : score > 0.5 ? "OBSERVED" : "UNTRUSTED",
        attestationCount: attestations,
        validMessages: messages,
      };
    }),

  attest: protectedProcedure
    .input(
      z.object({
        subject: z.string().startsWith("did:sigil:"),
        claim: z.string(),
        evidence: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const attestation = await recordAttestation({
        attestationId: `att-${Date.now()}`,
        attester: ctx.user ? `user:${ctx.user.id}` : "anonymous",
        subject: input.subject,
        claim: input.claim,
        evidence: input.evidence,
        timestamp: new Date().toISOString(),
      });
      return attestation;
    }),

  listAttestations: publicProcedure
    .input(z.object({ subject: z.string().startsWith("did:sigil:").optional() }))
    .query(async ({ input }) => {
      const state = await exportSnapshot();
      if (input.subject) {
        return state.attestations.filter((a) => a.subject === input.subject);
      }
      return state.attestations.slice(-100);
    }),
});

// ============================================================================
// LAYER 4 — TRANSACTION
// ============================================================================

function amountToCents(amount: string, currency: string): number {
  const value = parseFloat(amount);
  if (Number.isNaN(value) || value <= 0) return 0;
  // Stripe uses smallest currency unit; for USD/GBP/EUR that is cents.
  return Math.round(value * 100);
}

const transactionRouter = router({
  createPayment: protectedProcedure
    .input(
      z.object({
        payer: z.string().startsWith("did:sigil:"),
        payee: z.string().startsWith("did:sigil:"),
        amount: z.string(),
        currency: z.string().default("USD"),
        purpose: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const paymentId = `pmt-${Date.now()}`;
      let stripePaymentIntentId: string | undefined;
      let status: P0Payment["status"] = "pending";

      if (stripe) {
        try {
          const intent = await stripe.paymentIntents.create({
            amount: amountToCents(input.amount, input.currency),
            currency: input.currency.toLowerCase(),
            metadata: {
              paymentId,
              payer: input.payer,
              payee: input.payee,
              purpose: input.purpose,
            },
          });
          stripePaymentIntentId = intent.id;
          status = intent.status === "succeeded" ? "succeeded" : "pending";
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return {
            paymentId,
            status: "failed" as const,
            error: message,
            amount: input.amount,
            currency: input.currency,
            payer: input.payer,
            payee: input.payee,
            purpose: input.purpose,
            createdAt: new Date().toISOString(),
          };
        }
      }

      const payment = await recordPayment({
        paymentId,
        status,
        protocol: "x402",
        amount: input.amount,
        currency: input.currency,
        payer: input.payer,
        payee: input.payee,
        purpose: input.purpose,
        stripePaymentIntentId,
        createdAt: new Date().toISOString(),
      });

      return payment;
    }),

  verifyPayment: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      const payment = await getPayment(input.paymentId);
      if (!payment) return { found: false as const };

      if (stripe && payment.stripePaymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
        const status: P0Payment["status"] =
          intent.status === "succeeded"
            ? "succeeded"
            : intent.status === "canceled"
              ? "canceled"
              : "pending";
        await updatePayment(input.paymentId, {
          status,
          settledAt: status === "succeeded" ? new Date().toISOString() : undefined,
        });
        return { found: true as const, status, intentStatus: intent.status };
      }

      return { found: true as const, status: payment.status };
    }),
});

// ============================================================================
// LAYER 5 — GOVERNANCE
// ============================================================================

const governanceRouter = router({
  submitVote: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        vote: z.enum(["approve", "reject", "escalate", "abstain"]),
        signature: z.string(),
        sigil: z.string().startsWith("did:sigil:"),
      }),
    )
    .mutation(async ({ input }) => {
      const identity = await getIdentityBySigil(input.sigil);
      let signatureValid = false;
      if (identity) {
        const canonical = `${input.proposalId}:${input.vote}:${input.sigil}`;
        signatureValid = await verifyEd25519(canonical, input.signature, identity.publicKey);
      }

      const vote: P0Vote = {
        voteId: `vote-${Date.now()}`,
        proposalId: input.proposalId,
        vote: input.vote,
        voter: input.sigil,
        signature: input.signature,
        signatureValid,
        timestamp: new Date().toISOString(),
      };

      const session = await addVoteToSession(input.proposalId, vote);

      return {
        accepted: true,
        signatureValid,
        voteId: vote.voteId,
        proposalId: input.proposalId,
        vote: input.vote,
        voter: input.sigil,
        sessionId: session.sessionId,
        status: session.status,
        tally: session.tally,
        timestamp: vote.timestamp,
      };
    }),

  getState: publicProcedure
    .input(z.object({ scope: z.enum(["town", "civilization", "network"]).default("town") }))
    .query(async ({ input }) => {
      const sessions = await getSessions();
      return {
        scope: input.scope,
        activeSessions: sessions.filter((s) => s.status === "voting").length,
        consensusReached: sessions.filter((s) => s.status === "consensus_reached").length,
        escalated: sessions.filter((s) => s.status === "escalated").length,
        totalVotes: sessions.reduce((acc, s) => acc + s.votes.length, 0),
        sessions: sessions.slice(-20),
      };
    }),

  getSession: publicProcedure
    .input(z.object({ proposalId: z.string() }))
    .query(async ({ input }) => {
      const session = await getOrCreateSession(input.proposalId);
      return session;
    }),
});

// ============================================================================
// SYSTEM — Snapshot / restore
// ============================================================================

const systemRouterP0 = router({
  snapshot: adminProcedure.query(async () => {
    const state = await exportSnapshot();
    return {
      ...state,
      exportedAt: new Date().toISOString(),
      stats: {
        identities: state.identities.length,
        messages: state.messages.length,
        sessions: state.sessions.length,
        votes: state.votes.length,
        attestations: state.attestations.length,
        payments: state.payments.length,
      },
    };
  }),

  restore: adminProcedure
    .input(z.object({ snapshot: z.record(z.any()) }))
    .mutation(async ({ input }) => {
      await importSnapshot(input.snapshot as any);
      return { restored: true, restoredAt: new Date().toISOString() };
    }),
});

// ============================================================================
// COMBINED ROUTER
// ============================================================================
export const protocol0Router = router({
  identity: identityRouter,
  discovery: discoveryRouter,
  communication: communicationRouter,
  trust: trustRouter,
  transaction: transactionRouter,
  governance: governanceRouter,
  system: systemRouterP0,
});
