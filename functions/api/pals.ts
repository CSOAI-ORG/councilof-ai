// functions/api/pals.ts — the PAL registry over HTTP.
//
//   GET  /api/pals                  discovery: who exists, what each can do
//   GET  /api/pals/<id>             one staff member
//   POST /api/pals/<id>/chat        talk to a staff member
//   POST /api/pals/provision        save a private canonical desk configuration
//
// Two things this endpoint will not do:
//
//   - Private configurations are not public staff, memory, or executable agents.
//     Owner-scoped access is checked against a signed current account lifecycle.
//
//   - It will not let a PAL quote a price, certify anything, or claim to be a human. Those are
//     checked in _palRuntime before a reply leaves, and again here on the way out.
//
// EVERY COUNT ON THIS PAGE IS DERIVED. Nothing about the board is typed into this file, and the
// house staff's scopes are the SAME scopes the /team surface uses, so the two can never describe
// different people.

import { publicPal, housePals, type Pal } from "./_palRegistry";
import { privateDesk, privateProfile, requestedPrivateDesk } from "./_palOwnerProfile";
import type { AuthEnv } from "./_authCrypto";
import { talkToPal, type PalChatEnv } from "./_palRuntime";
import { modelConfigured, resolveModelRoute } from "./_palModel";
import { headFromGet } from "./_head";

interface Env extends PalChatEnv, AuthEnv {
  /** KV namespace for PAL memory. Optional: without it, PALs have no memory and say so. */
  PAL_MEMORY_KV?: KVNamespace;
}

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

/**
 * The house staff's DIDs — of which there are NONE, yet.
 *
 * WHY EMPTY, AND WHY THAT IS THE HONEST STATE.
 *
 * A did:key is a multibase-encoded ed25519 PUBLIC KEY. Publishing one says: "the holder of the
 * matching private key signs these answers". A string that merely looks like a did:key says
 * nothing, and publishing it would be publishing an identity with no key behind it — the forgery
 * this estate forbids, and a violation of its own rule that an empty cell is an answer and a
 * filled one must be true.
 *
 * The house staff have no keypair provisioned yet. So they carry no DID, and the published
 * record says `signed: false`. The record will carry a DID the moment a real keypair is
 * provisioned for a staff member; until then the answer to "can these answers be attributed to a
 * key?" is no, and the surface says no.
 *
 * (The MEOK HIM on the M2 machine already does this properly: nine PALs, each with a real
 * keypair, the public keys committed and the private keys kept out of git. That is the shape to
 * copy when the Council provisions its own.)
 */
const HOUSE_DIDS: Record<string, string> = {};

const CREATED_AT = "2026-10-26T00:00:00.000Z";

/** The house staff, built from the one registry module. */
function houseStaff(): Pal[] {
  return housePals((slug) => HOUSE_DIDS[slug] ?? "", CREATED_AT);
}

/** Public discovery is exclusively the six canonical Council desks. Legacy
 * caller-supplied records are not trusted, migrated, listed or exposed. */
function allPals(): Pal[] {
  return houseStaff();
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS, ...extra },
  });
}

/**
 * THE PUBLISHED ENDPOINT MAP — and the doors behind it, which did not exist.
 *
 * This file dispatched on the sub-path (`/^\/api\/pals\/?/` stripped off, then "provision",
 * "<id>/chat", "<id>"), and the dispatch was correct. But a Cloudflare Pages Function is reached
 * by its own FILE: `functions/api/pals.ts` answers `/api/pals` and nothing else. So the registry
 * published a map naming three doors — `/api/pals/<id>`, `/api/pals/<id>/chat` and
 * `/api/pals/provision` — and every one of them answered 404, from the platform, before this
 * dispatch could run.
 *
 * That is the worst kind of defect for a measurement body: a reader who follows the map the
 * registry publishes gets a 404 for a capability the registry insists exists. The staff list
 * worked, which made the broken desks look talkable.
 *
 * The doors are the thin route files under `functions/api/pals/`. The logic stays here; only the
 * routing was missing. `_published-endpoint-routes.test.ts` fails if this map ever names a path
 * with no route file behind it.
 */
export const PAL_ENDPOINTS = {
  list: "GET /api/pals",
  one: "GET /api/pals/<id>",
  chat: "POST /api/pals/<id>/chat",
  provision: "POST /api/pals/provision",
} as const;

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/^\/api\/pals\/?/, "");
  const origin = url.origin;

  // GET /api/pals/<id>
  if (path && !path.includes("/")) {
    const desk = privateDesk(path);
    if (desk) {
      const r = await privateProfile(ctx.env,ctx.request,desk,"read");
      return json(r.body,r.status);
    }
    const pals = allPals();
    const pal = pals.find((p) => p.id === path || p.slug === path);
    if (!pal) {
      return json(
        {
          error: "no such staff member",
          asked: path,
          known: pals.map((p) => p.slug),
          note: "A staff member that is not published cannot answer. This is an empty cell, not an error.",
        },
        404,
      );
    }
    return json({
      ...publicPal(pal),
      model_configured: modelConfigured(ctx.env),
      model_active: resolveModelRoute(ctx.env)?.public_model ?? null,
    });
  }
  // GET /api/pals — discovery.
  const pals = allPals();

  return json({
    schema: "csoai.pal-registry/0.1",
    title: "Council of AI staff — AI agents you can talk to",
    doctrine: {
      one_line:
        "These are AI agents, not people. They answer from published Council of AI records and say UNMEASURED when no record answers.",
      facts_come_from: "GET /api/gspc and the signed card corpus — never from a language model.",
      verification: "Free, forever, at /gspc-verify. A PAL's own answers carry no grade and sell no rank.",
      never: ["certification", "a price", "a human identity", "a number no published record carries"],
    },
    model_configured: modelConfigured(ctx.env),
    model_active: resolveModelRoute(ctx.env)?.public_model ?? null,
    provisioned_store_bound: Boolean(ctx.env.PAL_MEMORY_KV),
    private_profile_contract: "Signed current account; canonical desk configuration only. Not private chat or execution.",
    count: pals.length,
    staff: pals.map((p) => ({
      ...publicPal(p),
      // The can/cannot list is the public contract of what this staff member is for.
      can: p.scope.can,
      cannot: p.scope.cannot,
    })),
    signing:
      "A staff member with a DID can have its answers attributed to a key and revoked by " +
      "rotating that key. One without a DID has no keypair provisioned, so its answers cannot " +
      "be attributed to a key — and this surface says so rather than publishing a DID-shaped " +
      "string that no key can sign with.",
    endpoints: PAL_ENDPOINTS,
    mcp_note:
      "These staff members are NOT on the /mcp door yet. The door's tool surface is locked " +
      "(functions/mcp/tool-fleet.lock.json) and adding a tool there is a separate lane with its " +
      "own re-probe. This surface does not pretend the tools exist.",
    note:
      "Public discovery contains house desks only. Private desk configurations are owner-scoped; no persistent conversation or execution authority is implied.",
  });
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/^\/api\/pals\/?/, "");
  const origin = url.origin;

  let body: any = {};
  try {
    const limit = 24000;
    const declared = ctx.request.headers.get("content-length");
    if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))) {
      return json({error:"invalid content-length"},400);
    }
    if (declared !== null && Number(declared)>limit) return json({error:"body too large"},413);
    const reader = ctx.request.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder("utf-8",{fatal:true});
      let raw = "", size = 0;
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > limit) { await reader.cancel().catch(()=>{}); return json({error:"body too large"},413); }
          raw += decoder.decode(chunk.value,{stream:true});
        }
        raw += decoder.decode();
      } finally { reader.releaseLock(); }
      if (raw) body = JSON.parse(raw);
    }
  } catch {
    return json({ error: "body was not JSON" }, 400);
  }

  // Only a canonical desk selection is accepted. No caller-supplied owner,
  // arbitrary instructions, or public creation of a staff identity.
  if (path === "provision") {
    const desk = requestedPrivateDesk(body);
    if (!desk) return json({error:"Supply only a canonical desk identifier; custom staff provisioning is not enabled"},400);
    const r = await privateProfile(ctx.env,ctx.request,desk,"create");
    return json(r.body,r.status);
  }

  // POST /api/pals/<id>/chat
  const chatMatch = path.match(/^([^/]+)\/chat$/);
  if (chatMatch) {
    const wanted = chatMatch[1];
    if (privateDesk(wanted)) return json({error:"Private desk chat is not enabled; use the public desk for non-confidential questions"},409);
    const pals = allPals();
    const pal = pals.find((p) => p.id === wanted || p.slug === wanted);
    if (!pal) {
      return json(
        {
          error: "no such staff member",
          asked: wanted,
          known: pals.map((p) => p.slug),
          note: "A staff member that does not exist cannot answer. This is an empty cell, not an error.",
        },
        404,
      );
    }

    const question = String(body?.message ?? body?.question ?? "").trim();
    if (!question) {
      return json({ error: "message is required" }, 400);
    }
    if (question.length > 4000) {
      return json({ error: "message too long" }, 400);
    }

    const history = Array.isArray(body?.history)
      ? body.history
          .slice(-6)
          .filter((h: any) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
          .map((h: any) => ({ role: h.role as "user" | "assistant", content: String(h.content).slice(0, 2000) }))
      : [];

    const result = await talkToPal(ctx.env, { pal, question, all: pals, origin, history });

    return json({
      ...result,
      // The disclosure travels with the reply, not only with the first contact, because a reply
      // is copied and forwarded and the copy must still say what it is.
      disclosure: pal.disclosure,
      // Suggestion is a suggestion.
      suggested_pal: result.suggested_pal,
    });
  }

  // POST /api/pals with no sub-path is a DESCRIPTOR, not a 404 and not a write. The same
  // pattern as GET /api/chat: a reader holding the base path learns what the surface serves
  // instead of being told it does not exist. A sub-path that is not one of the two is still a
  // 404 — a descriptor must not swallow a typo.
  if (path === "") {
    return json({
      post: "/api/pals",
      note: "A descriptor, not a write.",
      paths: {
        provision:
          "POST /api/pals/provision — signed current account and canonical desk selection only. Creates a private configuration, not a private conversation or appointment.",
        chat: "POST /api/pals/<id>/chat — ask one staff member a question.",
      },
      reply_states: ["grounded", "model", "ungrounded", "refused"],
      doctrine:
        "Facts come from published records, never from the model. The model is consulted for conversation, and every reply says which of the four it was.",
    });
  }

  return json({ error: "unknown path", known: ["POST /api/pals/provision", "POST /api/pals/<id>/chat"] }, 404);
};

/** HEAD answers what GET answers, with no body (functions/api/_head.ts). */
export const onRequestHead = headFromGet(onRequestGet);
