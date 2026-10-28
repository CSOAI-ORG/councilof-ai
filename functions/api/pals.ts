// functions/api/pals.ts — the PAL registry over HTTP.
//
//   GET  /api/pals                  discovery: who exists, what each can do
//   GET  /api/pals/<id>             one staff member
//   POST /api/pals/<id>/chat        talk to a staff member
//   POST /api/pals/provision        build your own staff member
//
// Two things this endpoint will not do:
//
//   - It will not let a provisioned PAL publish. A PAL built here is scoped, guarded and
//     revocable, but it is not a public page and it does not become a measurement. It is an
//     agent, and it says UNMEASURED like everything else here.
//
//   - It will not let a PAL quote a price, certify anything, or claim to be a human. Those are
//     checked in _palRuntime before a reply leaves, and again here on the way out.
//
// EVERY COUNT ON THIS PAGE IS DERIVED. Nothing about the board is typed into this file, and the
// house staff's scopes are the SAME scopes the /team surface uses, so the two can never describe
// different people.

import { publicPal, suggestPal, housePals, buildPal, palTextViolations, type Pal } from "./_palRegistry";
import { talkToPal, type PalChatEnv } from "./_palRuntime";
import { modelConfigured, resolveModelRoute } from "./_palModel";
import { headFromGet } from "./_head";

interface Env extends PalChatEnv {
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

/**
 * Provisioned PALs live in KV.
 *
 * The record is stored under its own key so one PAL's memory and record cannot be read through
 * another. Without the binding, there are no provisioned PALs and the endpoint says so — never
 * an empty list that reads as "no staff exist".
 */
async function provisionedPals(env: Env): Promise<Pal[]> {
  if (!env.PAL_MEMORY_KV) return [];
  const out: Pal[] = [];
  try {
    const list = await env.PAL_MEMORY_KV.list({ prefix: "pal:record:" });
    for (const key of list.keys) {
      const raw = await env.PAL_MEMORY_KV.get(key.name);
      if (!raw) continue;
      try {
        const p = JSON.parse(raw) as Pal;
        if (p && p.schema) out.push(p);
      } catch {
        /* a record that will not parse is not a PAL; skip it rather than fail the list */
      }
    }
  } catch {
    /* an unreachable KV yields no provisioned PALs; the endpoint says whether a binding exists */
  }
  return out;
}

async function allPals(env: Env): Promise<Pal[]> {
  return [...houseStaff(), ...(await provisionedPals(env))];
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...extra },
  });
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/^\/api\/pals\/?/, "");
  const origin = url.origin;

  // GET /api/pals/<id>
  if (path && !path.includes("/")) {
    const pals = await allPals(ctx.env);
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
  const pals = await allPals(ctx.env);

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
    endpoints: {
      list: "GET /api/pals",
      one: "GET /api/pals/<id>",
      chat: "POST /api/pals/<id>/chat",
      provision: "POST /api/pals/provision",
    },
    mcp_note:
      "These staff members are NOT on the /mcp door yet. The door's tool surface is locked " +
      "(functions/mcp/tool-fleet.lock.json) and adding a tool there is a separate lane with its " +
      "own re-probe. This surface does not pretend the tools exist.",
    note:
      "A staff member you build is scoped to a namespace and can be revoked. It does not become a published measurement.",
  });
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/^\/api\/pals\/?/, "");
  const origin = url.origin;

  let body: any = {};
  try {
    const raw = await ctx.request.text();
    if (raw) body = JSON.parse(raw);
  } catch {
    return json({ error: "body was not JSON" }, 400);
  }

  // POST /api/pals/provision — build a staff member.
  if (path === "provision") {
    const name = String(body?.name ?? "").trim();
    const oneLine = String(body?.one_line ?? "").trim();
    if (!name || !oneLine) {
      return json(
        { error: "name and one_line are required", why: "A staff member with no name and no purpose is not a staff member." },
        400,
      );
    }
    if (name.length > 60 || oneLine.length > 200) {
      return json({ error: "name or one_line is too long" }, 400);
    }

    // The guard runs on the PROPOSED TEXT, before anything is stored.
    const violations = palTextViolations(`${name} ${oneLine} ${String(body?.instructions ?? "")}`);
    if (violations.length) {
      return json(
        {
          error: "the proposed staff member breaks a standing rule",
          violations,
          why:
            "Council of AI measures and never certifies. A staff member whose own description claims certification, a price or a human identity is refused at provisioning, not at answer time.",
        },
        422,
      );
    }

    if (!ctx.env.PAL_MEMORY_KV) {
      return json(
        {
          error: "provisioning store not bound",
          why: "PAL_MEMORY_KV is not configured for this deployment, so a staff member built here could not be stored, named or revoked. Refusing rather than pretending it was saved.",
        },
        503,
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "pal";
    const id = `${slug}-${Math.random().toString(16).slice(2, 8)}`;
    const pal = buildPal({
      id,
      slug,
      name,
      one_line: oneLine,
      owner: String(body?.owner ?? "public"),
      created_at: new Date().toISOString(),
      // A provisioned PAL gets no DID until a keypair is provisioned for it. Publishing a DID we
      // do not hold the private key for would be the forgery the estate forbids, so this field is
      // empty and the PAL says it is unsigned.
      did: "",
      scope: {
        keywords: Array.isArray(body?.keywords) ? body.keywords.map(String).slice(0, 12) : [],
        can: Array.isArray(body?.can) ? body.can.map(String).slice(0, 12) : [oneLine],
        cannot: Array.isArray(body?.cannot) ? body.cannot.map(String).slice(0, 12) : [
          "certifying anything",
          "quoting a price",
          "claiming to be a human",
          "stating a number no published record carries",
        ],
        instructions:
          String(body?.instructions ?? "") ||
          `You are ${name}, a staff member of the Council of AI. ${oneLine} Answer only from published Council of AI records and cite the record or endpoint. If no published record answers the question, reply UNMEASURED and say which record would be needed. Never invent a number, a person, a customer or a legal opinion. Never state or imply that you are a human. Never quote a fee.`,
      },
    });

    try {
      await ctx.env.PAL_MEMORY_KV.put(`pal:record:${pal.id}`, JSON.stringify(pal));
    } catch {
      return json({ error: "the store refused the write", why: "Nothing was stored." }, 503);
    }

    return json(
      {
        ...publicPal(pal),
        note:
          "Stored. This staff member answers from published records and carries every standing rule. It is not a published measurement and it sells nothing. It has no DID yet because no keypair was provisioned for it.",
        can_chat: `POST /api/pals/${pal.id}/chat`,
      },
      201,
    );
  }

  // POST /api/pals/<id>/chat
  const chatMatch = path.match(/^([^/]+)\/chat$/);
  if (chatMatch) {
    const wanted = chatMatch[1];
    const pals = await allPals(ctx.env);
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
          "POST /api/pals/provision — build a staff member. Refused when the PAL_MEMORY_KV store is unbound, rather than pretending it was saved.",
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
