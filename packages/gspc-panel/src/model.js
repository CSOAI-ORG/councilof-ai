// SPDX-License-Identifier: Apache-2.0
/**
 * Subject -> panel model. The model is the one thing every transport and renderer shares: the
 * direct reads below, the AG-UI stream (agui.js) and the A2UI description (a2ui.js) all produce or
 * consume it, and enforceDoctrine() runs on every one of them before anything is drawn.
 *
 * WHAT THE MODEL MAY SAY. Only fields of the payloads it read. A field that is not in the payload
 * is null and renders as "not published", never as a zero. A figure exists only under MEASURED or
 * TIE. A TIE stays a TIE. No verdict, no ranking.
 */
import {
  ATTRIBUTION_TEXT,
  DOCTRINE,
  FIGURE_STATES,
  ORIGIN,
  PANEL_MODEL_SCHEMA,
  STATES,
} from "./constants.js";
import { boardAxisForCard, classifySubject, normaliseModelId } from "./subject.js";
// The same module the MCP tools server_evidence and verify_capsule run (and /verify-server runs in the
// browser): it reads the static, signed capsule tree, so the check happens HERE, not on our server.
// Why not POST /mcp/free from the browser: that door validates Origin (MCP DNS-rebinding protection)
// and answers a cross-origin preflight 403, so a host console cannot call it from a page.
import { serverEvidence, verifyCapsule } from "../../../functions/_lib/measurementCapsule.ts";

const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const arr = (v) => (Array.isArray(v) ? v : []);
const rec = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

function base(subject, origin) {
  return {
    schema: PANEL_MODEL_SCHEMA,
    subject: { input: subject.input, kind: subject.kind },
    state: "UNCHECKABLE",
    state_note: null,
    last_measured: null,
    next_recheck: null,
    next_recheck_note: null,
    declared_vs_observed: { summary: null, rows: [] },
    figures: [],
    signature: { state: "NOT_CHECKED", where: null, detail: null, key: null },
    corrections: [],
    corrections_note: null,
    citation: null,
    verify_url: `${origin}/gspc-verify`,
    sources: [],
    attribution: { text: ATTRIBUTION_TEXT, url: `${origin}/panel/` },
    doctrine: DOCTRINE,
  };
}

/** The last word on what may be drawn. Runs on every model, whatever produced it. */
export function enforceDoctrine(m) {
  const out = { ...m, attribution: { text: ATTRIBUTION_TEXT, url: str(m?.attribution?.url) ?? `${ORIGIN}/panel/` } };
  if (!STATES.includes(out.state)) {
    out.state_note = `Unknown state ${JSON.stringify(out.state)} shown as UNCHECKABLE.`;
    out.state = "UNCHECKABLE";
  }
  if (!FIGURE_STATES.includes(out.state)) {
    out.figures = [];
    const dvo = rec(out.declared_vs_observed);
    out.declared_vs_observed = { summary: str(dvo.summary) && !/\d/.test(dvo.summary) ? dvo.summary : null, rows: [] };
  }
  out.figures = arr(out.figures).filter((f) => f && str(f.label) && f.value !== null && f.value !== undefined && f.value !== "");
  if (!str(out.verify_url) || !/^https:\/\//.test(out.verify_url)) out.verify_url = `${ORIGIN}/gspc-verify`;
  out.doctrine = DOCTRINE;
  return out;
}

function correctionsMentioning(ledger, needles) {
  const want = needles.filter((n) => typeof n === "string" && n.length >= 6);
  const hits = [];
  for (const c of arr(rec(ledger).corrections)) {
    const text = JSON.stringify(c);
    if (want.some((n) => text.includes(n)))
      hits.push({ id: str(c.id), date: str(c.date), summary: (str(c.what_was_wrong) ?? str(c.summary) ?? "").slice(0, 240), url: `${ORIGIN}/api/corrections#${str(c.id) ?? ""}` });
  }
  return hits.slice(0, 5);
}

async function withCorrections(m, sources, needles) {
  try {
    const ledger = await sources.corrections();
    m.corrections = [...m.corrections, ...correctionsMentioning(ledger, needles)];
    m.sources.push(`${sources.origin}/api/corrections`);
    m.corrections_note = m.corrections.length ? null : "No correction names this subject.";
  } catch {
    m.corrections_note = "The corrections ledger could not be read on this load.";
  }
}

// ------------------------------------------------------------------ server / agent card
async function serverModel(subject, sources) {
  const m = base(subject, sources.origin);
  m.verify_url = `${sources.origin}/verify-server?url=${encodeURIComponent(subject.input)}`;
  let sc;
  try {
    sc = sources.serverEvidence ? await sources.serverEvidence(subject.input) : await serverEvidence(sources.origin, subject.input);
  } catch (e) {
    m.state_note = `The capsule index could not be read: ${e.message}`;
    return m;
  }
  m.sources.push(`${sources.origin}/measurement-capsules/latest.json (server_evidence, run in this browser)`);
  if (str(sc.shard_url)) m.sources.push(sc.shard_url);
  const caps = arr(sc.capsules);
  if (sc.state === "MEASURED" && caps.length) {
    m.state = "MEASURED";
    const times = caps.map((c) => str(c.observed_at)).filter(Boolean).sort();
    m.last_measured = times[times.length - 1] ?? null;
    const rows = caps.map((c) => ({
      dimension: str(rec(c.claim).dimension) ?? str(c.adapter) ?? "capsule",
      declared: str(rec(c.claim).statement) ?? "not in the payload",
      observed: str(c.measurement_state) ?? "not in the payload",
    }));
    const tally = {};
    for (const r of rows) tally[r.observed] = (tally[r.observed] ?? 0) + 1;
    m.declared_vs_observed = {
      summary: `${rows.length} published ${rows.length === 1 ? "capsule" : "capsules"}: ${Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(" · ")}. INCONSISTENT means two public statements disagree, not which one is true.`,
      rows,
    };
    m.figures = [{ label: "Published capsules", value: caps.length }];
    for (const c of caps)
      if (c.correction_pointer) m.corrections.push({ id: str(c.capsule_id)?.slice(0, 16) ?? null, date: str(c.observed_at), summary: `Correction pointer on this capsule: ${JSON.stringify(c.correction_pointer).slice(0, 200)}`, url: null });
    // Signature, in this browser: the capsule's id recomputed from its exact text, its Merkle inclusion
    // in the batch, and the batch root's index signature under the pinned board key (verify_capsule's rule).
    try {
      const v = sources.verifyCapsule ? await sources.verifyCapsule(caps[0].capsule_json) : await verifyCapsule(sources.origin, caps[0].capsule_json);
      const sig = rec(v.index_signature);
      const ok = v.state === "INCLUDED" && sig.state === "VERIFIES";
      m.signature = {
        state: ok ? "VALID" : v.state === "UNCHECKABLE" || v.state === "UNREACHABLE" || v.state === "NOT_PUBLISHED" ? "UNCHECKABLE" : "INVALID",
        where: "in this browser (capsule id, Merkle inclusion, index signature)",
        detail: `capsule id ${str(rec(v.capsule_id).state) ?? "not stated"} · ${str(v.state) ?? "no state"} in batch · index signature ${str(sig.state) ?? "not stated"}${ok ? "" : str(v.reason) ? ` — ${v.reason}` : ""}`,
        key: str(sig.did),
      };
    } catch (e) {
      m.signature = { state: "UNCHECKABLE", where: "in this browser", detail: e.message, key: null };
    }
    m.citation = `Council of AI, GSPC server evidence for ${subject.input}. ${caps.length} capsule(s), index root ${str(sc.index_root) ?? "not stated"}, as of ${str(sc.as_of) ?? "not stated"}. ${str(sc.shard_url) ?? ""} · Evidence by GSPC · Council of AI.`;
  } else if (sc.state === "NOT_MEASURED") {
    m.state = "UNMEASURED";
    m.state_note = "No published capsule is keyed to this endpoint. Unmeasured is not a finding about the endpoint: nothing here says it is clean or unclean.";
    m.signature = { state: "NOTHING_TO_VERIFY", where: null, detail: "No capsule, so no signature.", key: null };
    m.citation = `Council of AI, GSPC server evidence for ${subject.input}: UNMEASURED as of ${str(sc.as_of) ?? "this read"}. Evidence by GSPC · Council of AI.`;
  } else {
    m.state = "UNCHECKABLE";
    m.state_note = `server_evidence answered ${str(sc.state) ?? "no state"}${str(sc.reason) ? `: ${sc.reason}` : ""}.`;
  }
  m.next_recheck_note = "No re-check date is published for this endpoint.";
  let host = subject.input;
  try {
    host = new URL(subject.input).host;
  } catch {}
  await withCorrections(m, sources, [subject.input, host === "councilof.ai" ? "" : host]);
  return m;
}

// ------------------------------------------------------------------ signed card
async function cardModel(subject, sources, verifyCard) {
  const m = base(subject, sources.origin);
  m.verify_url = `${sources.origin}/gspc-verify?card=${encodeURIComponent(`${sources.origin}/signed/cards/${subject.input}.json`)}`;
  let card;
  try {
    card = await sources.card(subject.input);
    m.sources.push(`${sources.origin}/signed/cards/${subject.input}.json`);
  } catch (e) {
    m.state = "UNCHECKABLE";
    m.state_note = `The signed card body could not be read: ${e.message}. It may belong to another corpus.`;
    return m;
  }
  const v = await verifyCard(card).catch((e) => ({ state: "UNCHECKABLE", reason: e.message }));
  m.signature = {
    state: v.state,
    where: "in this browser (verify-card.mjs, pinned key)",
    detail: v.state === "VALID" ? "sha256(canonical body) equals the id and the Ed25519 signature verifies under the pinned key." : str(v.reason),
    key: str(v.keyId),
  };
  const body = rec(card.body);
  m.declared_vs_observed = {
    summary: v.state === "VALID" ? "The card's declared id and key match what this browser recomputed." : "The card's declared id or key did not check out in this browser.",
    rows: [
      { dimension: "id", declared: str(card.id) ?? "not in the card", observed: v.state === "VALID" ? "recomputed, equal" : str(v.reason) ?? v.state },
      { dimension: "key", declared: str(card.did) ?? str(card.pubkey) ?? "not in the card", observed: str(v.keyId) ?? v.state },
    ],
  };
  if (v.state !== "VALID") {
    m.state = "UNCHECKABLE";
    m.state_note = "No figure is shown from a card that does not verify.";
    return m;
  }
  const axis = boardAxisForCard(body.axis);
  let sep = null;
  try {
    const board = await sources.gspc();
    m.sources.push(`${sources.origin}/api/gspc`);
    const row = arr(board.axes).find((a) => a?.axis === axis);
    sep = str(row?.separation);
  } catch {}
  m.state = sep === "TIE" ? "TIE" : "MEASURED";
  m.state_note =
    sep === "TIE"
      ? `Measured. On the board axis "${axis}" the model comparison is a TIE: no model separated from the fleet.`
      : sep === "UNTESTED"
        ? `Measured. The board's separation test on "${axis}" is UNTESTED, which is not a tie.`
        : null;
  m.last_measured = str(body.created);
  m.next_recheck_note = "A signed card is not re-run. A new run is a new card.";
  m.figures = [
    { label: "Model", value: str(body.model) },
    { label: "Axis (as signed)", value: str(body.axis) },
    { label: "Accuracy (as signed)", value: typeof body.accuracy === "number" ? body.accuracy : null },
    { label: "n", value: typeof body.n === "number" ? body.n : "not in the card" },
  ];
  m.citation = `Council of AI, signed measurement card ${subject.input} (${str(body.model) ?? "model not stated"}, ${str(body.axis) ?? "axis not stated"}, created ${str(body.created) ?? "not stated"}), Ed25519 ${str(v.keyId) ?? ""}. ${sources.origin}/signed/cards/${subject.input}.json · Evidence by GSPC · Council of AI.`;
  await withCorrections(m, sources, [subject.input]);
  return m;
}

// ------------------------------------------------------------------ model id
async function modelModel(subject, sources) {
  const m = base(subject, sources.origin);
  m.verify_url = `${sources.origin}/models-measured`;
  let list;
  try {
    list = await sources.modelsMeasured();
    m.sources.push(`${sources.origin}/interop/models-measured.json`);
  } catch (e) {
    m.state_note = `The measured-models list could not be read: ${e.message}`;
    return m;
  }
  const want = normaliseModelId(subject.input);
  const row = arr(list.models).find((x) => x?.id === want || arr(x?.recorded_as).includes(subject.input));
  m.signature = { state: "UNSIGNED_INDEX", where: null, detail: "The measured-models list is derived from signed cards but is not itself signed. Verify one of the model's card ids to check a signature in this browser.", key: null };
  if (!row) {
    m.state = "UNMEASURED";
    m.state_note = "No quotable signed card names this model. Unmeasured is not a finding about the model.";
    m.citation = `Council of AI, GSPC: ${subject.input} is UNMEASURED in ${sources.origin}/interop/models-measured.json. Evidence by GSPC · Council of AI.`;
  } else {
    m.state = "MEASURED";
    if (row.kind !== "third_party")
      m.state_note = "Own model (a prompt overlay on a stock base model). Excluded from every public comparison on the board.";
    m.figures = [
      { label: "Signed cards counted", value: typeof row.cards === "number" ? row.cards : null },
      { label: "Axes with a card", value: typeof row.axes === "number" ? row.axes : null },
    ];
    m.declared_vs_observed = { summary: `Recorded as: ${arr(row.recorded_as).join(", ") || "not stated"}.`, rows: [] };
    m.citation = `Council of AI, GSPC measured-models list, entry ${row.id} (${row.cards} signed cards). ${sources.origin}/interop/models-measured.json · Evidence by GSPC · Council of AI.`;
  }
  m.next_recheck_note = "Model runs are not on a published schedule.";
  await withCorrections(m, sources, [want]);
  return m;
}

// ------------------------------------------------------------------ claim registry
async function claimModel(subject, sources) {
  const m = base(subject, sources.origin);
  m.verify_url = `${sources.origin}/claim-maintenance`;
  let reg, state;
  try {
    [reg, state] = await Promise.all([sources.claimsRegister(), sources.state()]);
    m.sources.push(`${sources.origin}/api/claims/register`, `${sources.origin}/api/state`);
  } catch (e) {
    m.state_note = `The claim register could not be read: ${e.message}`;
    return m;
  }
  const entry = arr(reg.registries).find((r) => r?.registry_id === subject.input);
  if (!entry) {
    m.state = "UNMEASURED";
    m.state_note = "No live registry carries this id.";
    return m;
  }
  const cm = rec(rec(state.ledgers).claim_maintenance);
  const checks = arr(cm.checks).filter((c) => c?.registry_id === subject.input);
  const done = checks.filter((c) => !["NOT_YET_DUE", "DUE_NOT_RUN", "FETCH_FAILED"].includes(c.outcome));
  const due = checks.filter((c) => c.outcome === "NOT_YET_DUE" || c.outcome === "DUE_NOT_RUN").map((c) => c.due).sort();
  m.state = done.length ? "MEASURED" : checks.some((c) => c.outcome === "FETCH_FAILED") ? "UNCHECKABLE" : "UNMEASURED";
  m.state_note = "A registry records public claims and re-reads them. No state here is a verdict on any claim or any party.";
  m.last_measured = done.length ? str(cm.run_at) : null;
  m.next_recheck = due[0] ?? null;
  m.next_recheck_note = due[0] ? null : "No future check is scheduled in the ledger.";
  m.declared_vs_observed = {
    summary: "Each scheduled read, with what the claim-maintenance loop observed.",
    rows: checks.map((c) => ({ dimension: str(c.check) ?? "check", declared: `due ${str(c.due) ?? "not stated"}`, observed: str(c.outcome) ?? "not in the payload" })),
  };
  m.figures = [
    { label: "Subjects", value: typeof entry.subjects === "number" ? entry.subjects : null },
    { label: "Claims", value: typeof entry.claims === "number" ? entry.claims : null },
  ];
  m.signature = {
    state: entry.signed && entry.sidecar_pin_verified ? "VALID" : entry.signed ? "UNCHECKABLE" : "UNSIGNED",
    where: "councilof.ai register (sidecar pin)",
    detail: entry.signed ? `Signed by sidecar ${str(entry.signature_sidecar_url) ?? ""}; the register reports the sidecar pin ${entry.sidecar_pin_verified ? "verified" : "not verified"}.` : "The registry is not signed.",
    key: "did:web:csoai.org#board-attestation-1",
  };
  if (str(cm.failures_feed)) m.corrections_note = cm.failures_feed;
  m.citation = `Council of AI, claim-maintenance registry ${subject.input}. ${str(entry.url) ?? ""} · Evidence by GSPC · Council of AI.`;
  await withCorrections(m, sources, [subject.input]);
  return m;
}

/** Build the panel model for one subject from the live APIs. */
export async function buildModel(rawSubject, { sources, verifyCard }) {
  const subject = classifySubject(rawSubject);
  let m;
  if (subject.kind === "mcp_server" || subject.kind === "agent_card") m = await serverModel(subject, sources);
  else if (subject.kind === "card") m = await cardModel(subject, sources, verifyCard);
  else if (subject.kind === "model") m = await modelModel(subject, sources);
  else if (subject.kind === "claim") m = await claimModel(subject, sources);
  else {
    m = base(subject, sources.origin);
    m.state_note = subject.kind === "none" ? "No subject was given." : "The subject is not a URL, a card id, a claim id or a model id.";
  }
  return enforceDoctrine(m);
}
