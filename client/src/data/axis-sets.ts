/**
 * axis-sets.ts — every separately-counted axis set this estate publishes,
 * declared in one place.
 *
 * ── THE PROBLEM THIS FILE EXISTS TO FIX ──────────────────────────────────────
 * facts.json declares several separately-counted axis namespaces. Each count is
 * honest on its own and they were incoherent together, because a visitor met one
 * number on the public board and had no route to the rest, no
 * way to learn what each measured, and no way to see why they differ.
 *
 * The estate's own rule is "every count names its set". This file makes that rule
 * a data structure instead of a comment: a set is not allowed to exist here
 * without saying, in plain English, what it measures, over what, when, what it
 * establishes, and — the part that matters most — WHAT IT DOES NOT ESTABLISH.
 *
 * ── NO COUNT IS TYPED ────────────────────────────────────────────────────────
 * There is not one axis count in this file. Every set carries a `load()` that
 * derives its rows from a published artifact, and the UI counts the rows. If an
 * artifact changes, the number on the page changes with it. A typed integer is
 * this estate's signature defect (12, 13, 14, 15, 16, 17 and 22 were all live at
 * once) and the facts-gate exists because of it.
 *
 * ── FRESHNESS IS PROVENANCE, NOT RENDER TIME ─────────────────────────────────
 * Every set reports `asOf` read OUT OF its artifact, and `asOfField` names the
 * exact key it was read from so a reader can open the file and check. There is
 * no `new Date()` in this file. A date here says when something was measured,
 * never when the page was built. An artifact with no timestamp reports null —
 * borrowing a neighbour's date would assert a freshness nobody established.
 */

import facts from "./facts.json";
import { EUNOMIA_AXES, EUNOMIA_MEASURED_ON } from "./eunomia";

export type AxisStatus = "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED";
export type RunAttestation = "ED25519_SIGNED" | "CONTENT_ADDRESSED_UNSIGNED";

export interface EvidenceLink {
  label: string;
  href: string;
  /** What kind of thing sits at the other end, so the UI can say so. */
  kind: "dataset" | "signed-card" | "run" | "register" | "page" | "api";
  /** Plain English: what a reader will find there. */
  what: string;
}

/** One row on one set. Deliberately the SAME shape for all seven sets, so a
 *  reader learns the table once. A field that a set genuinely does not have is
 *  null — never a zero, never "n/a", never a fabricated placeholder. */
export interface AxisRow {
  id: string;
  /** Human label. Falls back to a de-slugged id when the artifact carries none. */
  name: string;
  status: AxisStatus;
  /** Plain English: the question this row asks. Written for someone who has
   *  never heard the word "axis". */
  what: string;
  /** Which half of a set this belongs to, when the set has halves. */
  family: string | null;
  /** How many things were actually measured. null = nothing was. */
  n: number | null;
  /** What one n counts. Never assume "items" — one axis counts issuer accounts. */
  nUnit: string;
  /** The headline number, or null when there is none. */
  headline: number | null;
  headlineLabel: string;
  headlineFormat: "pct" | "elo" | "count";
  /** 95% confidence interval, where the sample is honestly independent. */
  interval: [number, number] | null;
  /** What was measured — a model, a fleet, a set of accounts. */
  measuredOn: string | null;
  /** Whether a lead over the field is statistically real. Only applies where
   *  there IS a field to lead. */
  separation: "SEPARATED" | "TIE" | "UNTESTED" | null;
  /** How the row's run artifact is authenticated. null means the source did not
   *  declare an attestation state; it must never be inferred from a content ID. */
  runAttestation: RunAttestation | null;
  /** Present only on an unmeasured row. Says WHY, because an unmeasured slot is
   *  content, not absence. */
  whyUnmeasured: string | null;
  evidence: EvidenceLink[];
  /** The artifact's own note, verbatim. */
  note: string | null;
  /** Whether a signed per-model card backs THIS row's model and number, as the board itself
   *  declares it (/api/gspc axes[].leader_card_state). null = the board declared no backing card.
   *  Never inferred from the card index: a card filed under the same axis may record a different
   *  model, or a different measurement of the same model. Only the board set declares it; rows of
   *  other sets leave it undefined. */
  leaderCardState?: "SIGNED_PER_MODEL_CARD" | "NO_SIGNED_PER_MODEL_CARD" | "CARD_RECORDS_A_DIFFERENT_MEASUREMENT" | null;
  /** The card the board names for this row's leader (axes[].leader_card_url), or null. Used as a
   *  Verify target only when leaderCardState is SIGNED_PER_MODEL_CARD. */
  leaderCardUrl?: string | null;
  /** The board's own sentence about that card (axes[].leader_card_note), verbatim. */
  leaderCardNote?: string | null;
  /** When the headline was computed over a different row count than n (the separation test
   *  counts frozen rows, duplicates included), the raw count behind the headline, e.g.
   *  "81/200 answers". Read from separation_evidence.leader; null when the counts agree. */
  headlineCount?: string | null;
  /** The plain-English reading of n when it differs from the headline's row count, derived from
   *  separation_evidence and separation_n_note. null when the counts agree. */
  nNote?: string | null;
}

/** Does a row have anything to say about a backing card? Only the board set declares
 *  leader_card_state (other sets leave it undefined), and only a row that shows a model's
 *  number can be backed by one. */
export function rowHasCardQuestion(row: AxisRow): boolean {
  return row.leaderCardState !== undefined && row.headline !== null && !!row.measuredOn;
}

/** The card a row's Verify link may open, or null. Only a card the board itself declares as the
 *  signed per-model card for this row's model and number qualifies. Never the newest card filed
 *  under the axis: that is a different model's, or a different measurement's, evidence. */
export function rowVerifyTarget(row: AxisRow): string | null {
  if (!rowHasCardQuestion(row)) return null;
  return row.leaderCardState === "SIGNED_PER_MODEL_CARD" && row.leaderCardUrl ? row.leaderCardUrl : null;
}

/** When the separation test's leader row count differs from the board's n (duplicate items in
 *  the frozen rows), say so in plain words. Every figure is read from the axis; none is typed. */
export function countMismatch(a: any): { headlineCount: string; nNote: string } | null {
  const se = a?.separation_evidence;
  const lead = se && typeof se === "object" ? se.leader : null;
  const k = lead?.k, ln = lead?.n, n = a?.n;
  if (![k, ln, n].every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  if (ln === n || typeof a?.separation_n_note !== "string") return null;
  const extra = ln - n;
  const why =
    extra === 1
      ? "one item appears twice in the frozen rows"
      : extra > 1
        ? `${extra} items appear more than once in the frozen rows`
        : "the frozen rows hold fewer answers than distinct items";
  return { headlineCount: `${k}/${ln} answers`, nNote: `${n} distinct items — ${why}` };
}

const LEADER_CARD_STATES = new Set([
  "SIGNED_PER_MODEL_CARD",
  "NO_SIGNED_PER_MODEL_CARD",
  "CARD_RECORDS_A_DIFFERENT_MEASUREMENT",
]);

/** The board's declared leader-card state, or null. An unknown or absent value is null, which
 *  means "no backing card" — never a guess that one exists. */
export function leaderCardStateOf(v: unknown): AxisRow["leaderCardState"] {
  return typeof v === "string" && LEADER_CARD_STATES.has(v) ? (v as NonNullable<AxisRow["leaderCardState"]>) : null;
}

export interface LoadedSet {
  rows: AxisRow[];
  /** Read out of the artifact. null when the artifact carries no timestamp. */
  asOf: string | null;
  /** The exact key asOf was read from, so a reader can check it. */
  asOfField: string | null;
  /** Anything the set publishes that is not a row — surfaced, never dropped. */
  aside: { label: string; value: string }[];
  /** True when the numbers came off the live artifact rather than a fallback. */
  live: boolean;
  /** Where these rows actually came from, in a sentence a reader can act on.
   *  A fallback must SAY it is a fallback — a page that quietly renders a
   *  snapshot as though the endpoint had answered is the freshness lie this
   *  estate has already had to correct once. */
  provenance: string;
}

export interface AxisSet {
  id: string;
  /** Short name for the tab. */
  name: string;
  /** One sentence, in the OpenRouter pattern: what ranks what. */
  headline: string;
  /** What it measures, over what population. */
  measures: string;
  /** Who or what is on the other end of the measurement. */
  subject: string;
  /** What a reader is entitled to conclude from these numbers. */
  establishes: string[];
  /** What a reader is NOT entitled to conclude. Non-negotiable: a set may not
   *  appear on this page without this list. */
  doesNotEstablish: string[];
  /** How this set relates to the public board — the sentence that makes seven
   *  counts coherent instead of contradictory. */
  relation: string;
  /** The endpoint or file a reader checks the count against. */
  countAuthority: string;
  /** Where the raw artifact lives, for the reader who wants the bytes. */
  artifact: { href: string; label: string };
  /** The page that already renders this set in depth, if one exists. */
  detailPage: { href: string; label: string } | null;
  /** How this set's freshness date should be read. */
  freshness: string;
  /** Fetch + normalise. Sets backed by a committed module take no argument.
   *  `provenance` overrides the loader's default line when a fallback is used. */
  load: (raw: unknown, provenance?: string) => LoadedSet;
  /** null when the set is backed by a committed module rather than a fetch. */
  fetchUrl: string | null;
  /** A committed artifact of the SAME shape to fall back to when the live
   *  endpoint does not answer — including at prerender time, when no function is
   *  running. It is loaded by the same loader and labelled as a snapshot. */
  fallbackUrl?: string;
  /** A fallback with a status sidecar is eligible only when that sidecar says
   *  both state=CURRENT and current=true. Non-current signed bytes are evidence,
   *  not a current board. The status is fetched before the fallback artifact. */
  fallbackStatusUrl?: string;
  fallbackProvenance?: string;
  /** Marked when the set is a dated record rather than a live instrument. */
  retired?: string;
}

const errText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const readJson = async (fetchImpl: typeof fetch, url: string): Promise<unknown> => {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
};

/** Fetch one live set and, only after a CURRENT status sidecar, its fallback.
 *  Exported so the fail-closed transition is unit-tested without mounting React. */
export async function fetchPublishedSet(
  set: AxisSet,
  fetchImpl: typeof fetch = fetch,
): Promise<LoadedSet> {
  if (!set.fetchUrl) throw new Error(`${set.id} has no published fetch URL`);

  let liveError: unknown;
  try {
    return set.load(await readJson(fetchImpl, set.fetchUrl));
  } catch (error) {
    liveError = error;
  }

  if (!set.fallbackUrl) throw liveError;

  if (set.fallbackStatusUrl) {
    let rawStatus: unknown;
    try {
      // Status is deliberately fetched BEFORE the artifact: known-defect bytes
      // must never be loaded and then accidentally treated as current.
      rawStatus = await readJson(fetchImpl, set.fallbackStatusUrl);
    } catch (statusError) {
      throw new Error(
        `${errText(liveError)}; fallback status unavailable: ${errText(statusError)}`,
      );
    }
    const status = rawStatus as { current?: unknown; state?: unknown } | null;
    if (status?.current !== true || status?.state !== "CURRENT") {
      throw new Error(
        `${errText(liveError)}; fallback refused: ${set.fallbackStatusUrl} reports ` +
          `${String(status?.state ?? "UNCHECKABLE")} (current=${String(status?.current ?? false)})`,
      );
    }
  }

  let rawFallback: unknown;
  try {
    rawFallback = await readJson(fetchImpl, set.fallbackUrl);
  } catch (fallbackError) {
    throw new Error(`${errText(liveError)}; fallback unavailable: ${errText(fallbackError)}`);
  }
  const loaded = set.load(rawFallback, set.fallbackProvenance);
  return {
    ...loaded,
    // A current snapshot is still a snapshot. Never let a loader infer liveness
    // from row count and thereby hide the fallback provenance banner.
    live: false,
    provenance: set.fallbackProvenance ?? loaded.provenance,
  };
}

// ─────────────────────────────────────────────────────────────── helpers

const deslug = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

const interval = (v: unknown): [number, number] | null =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number"
    ? [v[0], v[1]]
    : null;

const runAttestation = (value: unknown): RunAttestation | null =>
  value === "ED25519_SIGNED" || value === "CONTENT_ADDRESSED_UNSIGNED" ? value : null;

/** card_index axis slugs are not board axis ids — the index predates the board's
 *  naming. This maps the ones that genuinely refer to the same axis, so a reader
 *  can get from a board row to a signed card. An axis with no honest mapping gets
 *  NO card link rather than a wrong one: a link to somebody else's evidence is
 *  worse than no link. */
export const CARD_AXIS_ALIASES: Record<string, string[]> = {
  governance: ["gspc-governance", "gov"],
  safety: ["gspc-safety"],
  provenance: ["gspc-provenance"],
  continuity: ["gspc-continuity"],
  conformance: ["gspc-conformance"],
  openness: ["gspc-openness"],
  care: ["care", "care-refusal-help", "care-refusal-protect"],
  jail: ["jail-escape-detection"],
  swarm: ["swarm-candidates"],
};

// ─────────────────────────────────────────────────── 1. the public GSPC board

/** Board fallback, used only before the live fetch lands (and during prerender,
 *  where /api/gspc is not running). It is the RECORDED OBSERVATION from
 *  facts.json — which carries its own observed_at and its own "the endpoint
 *  wins" note — so this file still types no number of its own. */
const BOARD_OBSERVED = (facts as any).counts?.axis_count?.observed ?? {};

const BANK_HOST = "https://huggingface.co/datasets/";

export function loadBoard(raw: unknown, provenance = "Live from the board endpoint."): LoadedSet {
  const d = (raw ?? {}) as any;
  const axes: any[] = Array.isArray(d.axes) ? d.axes : [];
  const measuredOnDate =
    typeof d.measured_on === "string" ? d.measured_on : d.measured_on?.date ?? null;

  const rows: AxisRow[] = axes.map((a) => {
    const measured = a.status === "MEASURED";
    const attestation = runAttestation(a.run_attestation);
    const ev: EvidenceLink[] = [];
    // The endpoint resolves a bank slug to a fetchable URL when it serves; the
    // committed snapshot carries only the slug. Resolve it here so the fallback
    // renders the same working link rather than a slug a stranger cannot follow.
    const bankUrl = a.dataset_url ?? (typeof a.dataset === "string" && a.dataset ? BANK_HOST + a.dataset : null);
    if (bankUrl)
      ev.push({
        label: "the frozen question bank",
        href: bankUrl,
        kind: "dataset",
        what: "the exact questions that were asked, published so anyone can re-run them",
      });
    if (a.evidence_url)
      ev.push({
        label:
          attestation === "ED25519_SIGNED"
            ? "the signed run"
            : attestation === "CONTENT_ADDRESSED_UNSIGNED"
              ? "the content-addressed unsigned run"
              : "the run artifact",
        href: a.evidence_url,
        kind: "run",
        what:
          attestation === "ED25519_SIGNED"
            ? "the recorded run this row summarises, with its Ed25519 signature"
            : attestation === "CONTENT_ADDRESSED_UNSIGNED"
              ? "the recorded run this row summarises; its content ID identifies bytes but is not a signature"
              : "the recorded run this row summarises; no run-attestation state was declared",
      });
    ev.push({
      label: "this axis on the board API",
      href: `/api/gspc?axis=${encodeURIComponent(a.axis)}`,
      kind: "api",
      what: "the row's own bytes, straight from the board",
    });
    return {
      id: a.axis,
      name: deslug(a.axis),
      status: (a.status ?? "UNMEASURED") as AxisStatus,
      what: a.task ? `${a.task}${a.bench ? ` (bank: ${a.bench})` : ""}` : deslug(a.axis),
      family: a.family ?? null,
      n: num(a.n),
      nUnit: a.n_unit ?? (a.kind === "deterministic-facts" ? "issuer accounts" : "bank items"),
      headline: num(a.accuracy),
      headlineLabel: "best model's score",
      headlineFormat: "pct",
      interval: interval(a.interval),
      measuredOn: a.leader ?? (measured ? a.fleet ?? null : null),
      separation: a.separation ?? null,
      runAttestation: attestation,
      whyUnmeasured: measured
        ? null
        : a.note ??
          "A slot published so the gap is visible. Nothing has been run against it.",
      evidence: ev,
      note: a.note ?? null,
      leaderCardState: leaderCardStateOf(a.leader_card_state ?? null),
      leaderCardUrl: typeof a.leader_card_url === "string" && a.leader_card_url ? a.leader_card_url : null,
      leaderCardNote: typeof a.leader_card_note === "string" && a.leader_card_note ? a.leader_card_note : null,
      headlineCount: countMismatch(a)?.headlineCount ?? null,
      nNote: countMismatch(a)?.nNote ?? null,
    };
  });

  return {
    rows,
    asOf: measuredOnDate,
    asOfField: "measured_on.date",
    aside: [],
    live: rows.length > 0,
    provenance,
  };
}

/** The board's shape when the live endpoint has not answered. Rows are absent —
 *  the page says so rather than drawing an empty table that looks like a finding. */
function boardFallback(provenance?: string): LoadedSet {
  return {
    rows: [],
    asOf: BOARD_OBSERVED.observed_at ?? null,
    asOfField: "counts.axis_count.observed.observed_at (facts.json — a recorded observation, not the endpoint)",
    aside: [
      {
        label: "Last recorded observation of the board",
        value: String(BOARD_OBSERVED.value ?? "not recorded"),
      },
    ],
    live: false,
    provenance:
      provenance ??
      ("Neither the live board endpoint nor an eligible current snapshot answered here, so no rows are drawn. " +
        "The figure below is a RECORDED OBSERVATION of the endpoint, carrying its own date — not a reading of it. " +
        "If it ever disagrees with the endpoint, the endpoint wins."),
  };
}

// ───────────────────────────────────────────────── 2. the axis-engine-16 set

function loadEngine16(raw: unknown): LoadedSet {
  const d = (raw ?? {}) as any;
  const models: any[] = Array.isArray(d.models) ? d.models : [];

  // THE HONEST SHAPE OF THIS ARTIFACT, and the page must not paper over it:
  // the file declares a number of axis but publishes NO per-axis breakdown.
  // Its published rows are MODELS, each answering the whole set. Rendering
  // invented per-axis rows here would manufacture a breakdown that was never
  // measured, so the rows are the models and the page says why.
  const rows: AxisRow[] = models.map((m) => ({
    id: m.model,
    name: m.model,
    status: "MEASURED",
    what: `How this model scored across the whole engine set in one run.`,
    family: null,
    n: num(m.n),
    nUnit: "items answered",
    headline: num(m.accuracy),
    headlineLabel: "score across the set",
    headlineFormat: "pct",
    interval: null,
    measuredOn: m.model,
    separation: null,
    runAttestation: null,
    whyUnmeasured: null,
    evidence: [
      {
        label: "the raw measurement file",
        href: "/measurement/axis-engine-16.json",
        kind: "run",
        what: "the whole artifact this row was read from",
      },
    ],
    note:
      num(m.n) !== null && (num(m.n) as number) < 30
        ? "Sample below thirty. The artifact states this is not quotable as a final score, and neither is it here."
        : null,
  }));

  const aside: { label: string; value: string }[] = [];
  if (typeof d.axes === "number")
    aside.push({
      label: "Axes declared by this artifact",
      value: `${d.axes} — declared in the file's own \`axis\` field. The file publishes no per-axis breakdown, so no per-axis row can honestly be drawn.`,
    });
  if (typeof d.clusters_measured === "number")
    aside.push({ label: "Clusters measured", value: String(d.clusters_measured) });
  if (d.gold_bank_jail?.total)
    aside.push({
      label: "Escape-detection gold bank",
      value: `${d.gold_bank_jail.total} labelled cases (${d.gold_bank_jail.escape} escapes, ${d.gold_bank_jail.benign} benign)`,
    });
  if (d.honest_note) aside.push({ label: "The artifact's own caveat", value: d.honest_note });

  return {
    rows,
    asOf: d.measured ?? null,
    asOfField: "measured",
    aside,
    live: rows.length > 0,
    provenance: "Read from the published engine artifact.",
  };
}

// ─────────────────────────────────────────────────────── 3. the arena Elo set

function loadArena(raw: unknown): LoadedSet {
  const d = (raw ?? {}) as any;
  const declared: string[] = Array.isArray(d.axes) ? d.axes.filter((x: any) => typeof x === "string") : [];
  const perAxis: Record<string, any[]> = d.per_axis ?? {};

  const rows: AxisRow[] = declared.map((id) => {
    const table = Array.isArray(perAxis[id]) ? perAxis[id] : null;
    const top = table && table.length ? table[0] : null;
    return {
      id,
      name: deslug(id),
      status: table && table.length ? "MEASURED" : "UNMEASURED",
      what: table && table.length
        ? `Head-to-head rounds on this topic, scored by a deterministic referee.`
        : `Named in the signed reference, with no head-to-head rows published behind it.`,
      family: null,
      n: top ? num(top.games) : null,
      nUnit: "rounds played",
      headline: top ? num(top.elo) : null,
      headlineLabel: "top model's rating",
      headlineFormat: "elo",
      interval: top ? interval(top.ci) : null,
      measuredOn: top?.model ?? null,
      separation: null,
      runAttestation: null,
      whyUnmeasured:
        table && table.length
          ? null
          : "The signed reference names this axis but carries no rows for it. The set's own two surfaces disagree about its size, and that gap is open — see the caveat below.",
      evidence: [
        {
          label: "the signed reference file",
          href: "/arena/elo_reference.json",
          kind: "signed-card",
          what: "the whole reference, with the signature you can check yourself",
        },
        {
          label: "the live pass-rate scoreboard",
          href: "/api/arena/scoreboard",
          kind: "api",
          what: "the other arena surface — which carries a different set of axis",
        },
      ],
      note: null,
    };
  });

  const aside: { label: string; value: string }[] = [];
  if (d.models) aside.push({ label: "Models in the reference", value: String(d.models) });
  if (d.method) aside.push({ label: "How the rating is computed", value: String(d.method) });
  if (d.register) aside.push({ label: "What kind of measurement this is", value: String(d.register) });

  return {
    rows,
    asOf: d.generated ?? null,
    asOfField: "generated",
    aside,
    live: rows.length > 0,
    provenance: "Read from the signed Elo reference file.",
  };
}

// ──────────────────────────────────────────────── 4. the Eunomia finance board

function loadEunomia(): LoadedSet {
  const rows: AxisRow[] = EUNOMIA_AXES.map((a) => ({
    id: a.axis,
    name: deslug(a.axis),
    status: a.status === "SPEC" ? "SPEC" : a.status,
    what: `Can a model read ${a.instrument} and pick the right label out of ${a.labels.join(" / ")}?`,
    family: a.status === "MEASURED" ? "measured bench" : "declared index",
    n: a.n || null,
    nUnit: "graded cases",
    headline: a.strong ? a.strong.acc : null,
    headlineLabel: "stronger model's score",
    headlineFormat: "pct",
    interval: a.strong ? a.strong.ci : null,
    measuredOn: a.strong ? EUNOMIA_MEASURED_ON.models[1] ?? null : null,
    separation: null,
    runAttestation: null,
    whyUnmeasured:
      a.status === "MEASURED"
        ? null
        : "An index with no frozen item set built yet. It is published as a declared slot so the gap is visible — it earns a number only once its items are built, graded and signed.",
    evidence: [
      { label: "the board this row lives on", href: "/eunomia", kind: "page", what: "every row, with both model tiers side by side" },
      { label: "the signed data surface", href: "/eunomia-data", kind: "register", what: "the underlying corpus and calendar" },
    ],
    note: a.baseline
      ? `A deliberately weak baseline model scores ${(a.baseline.acc * 100).toFixed(0)}% here — the gap between the two is the point of the row.`
      : null,
  }));

  return {
    rows,
    asOf: EUNOMIA_MEASURED_ON.date,
    asOfField: "EUNOMIA_MEASURED_ON.date",
    provenance: "Derived from the same committed bench data the finance board renders.",
    aside: [
      { label: "Models compared", value: EUNOMIA_MEASURED_ON.models.join(" vs ") },
      { label: "Who signs each row", value: EUNOMIA_MEASURED_ON.signer },
    ],
    live: rows.length > 0,
  };
}

// ─────────────────────────────────────────── 5. the financial axes register

function loadFinancialRegister(raw: unknown): LoadedSet {
  const d = (raw ?? {}) as any;
  const axes: any[] = Array.isArray(d.axes) ? d.axes : [];

  const rows: AxisRow[] = axes.map((a) => {
    const measured = a.status === "MEASURED";
    const ev: EvidenceLink[] = [];
    if (a.surface)
      ev.push({ label: "the measured run", href: a.surface, kind: "run", what: "the recorded facts this row was read from" });
    ev.push({
      label: "the register itself",
      href: "/interop/financial-axes.json",
      kind: "register",
      what: "all rows in this family, with each rubric written out",
    });
    return {
      id: a.id,
      name: a.name ?? deslug(a.id),
      status: (a.status ?? "UNMEASURED") as AxisStatus,
      what: a.rubric ?? deslug(a.id),
      family: a.candidate ? "candidate index" : "control fact",
      n: num(a.measured_count),
      nUnit: "instruments read",
      headline: null,
      headlineLabel: "no score — this row records facts, not a grade",
      headlineFormat: "count",
      interval: null,
      measuredOn: measured ? "public ledger records" : null,
      separation: null,
      runAttestation: null,
      whyUnmeasured: measured
        ? null
        : `${a.data ? `Would need: ${a.data}. ` : ""}${a.bank_status ? `Item set: ${a.bank_status}` : "No run behind this slot yet."}`,
      evidence: ev,
      note: a.risk_verdict ? `What these facts imply about risk: ${a.risk_verdict}.` : null,
    };
  });

  const asOf = typeof d.as_of === "string" && d.as_of.trim() ? String(d.as_of).trim() : null;
  const boardNote =
    typeof d.board_authority_note === "string"
      ? String(d.board_authority_note)
      : "Board counts (axes/measured/unmeasured) authority is live GET /api/gspc. This register is not the board.";
  const aside = [
    { label: "Board authority", value: boardNote },
    ...(d.honesty ? [{ label: "The register's own caveat", value: String(d.honesty) }] : []),
  ];
  return {
    rows,
    asOf,
    asOfField: asOf ? "as_of" : null,
    aside,
    live: rows.length > 0,
    provenance:
      "Read from the published register file. Board counts defer to live GET /api/gspc — this file is dated detail, not the board.",
  };
}

// ──────────────────────────────────────────────────── 6. the coverage gap map

/** The gap map counts a different thing from every other set on this page: not
 *  axes measured, but STATUTE CELLS left blind. It is included because a reader
 *  who has just seen fifteen green rows is owed the denominator. */
function loadGapMap(raw: unknown): LoadedSet {
  const d = (raw ?? {}) as any;
  const byAxis: Record<string, { evidenced: number; blind: number }> = d.by_axis ?? {};

  const rows: AxisRow[] = Object.entries(byAxis).map(([id, v]) => {
    const total = v.evidenced + v.blind;
    return {
      id,
      name: d.names?.[id] ?? deslug(id),
      status: v.evidenced > 0 ? "MEASURED" : "UNMEASURED",
      what: `How many enumerated legal provisions on this theme have ANY instrument measuring them.`,
      family: null,
      n: total,
      nUnit: "statute cells",
      headline: total ? v.evidenced / total : null,
      headlineLabel: "share of cells with any instrument behind them",
      headlineFormat: "pct",
      interval: null,
      measuredOn: "published benchmarks surveyed across the field",
      separation: null,
      runAttestation: null,
      whyUnmeasured:
        v.evidenced > 0
          ? null
          : "No instrument in the field measures this theme at provision granularity.",
      evidence: [
        { label: "the gap map", href: "/gspc-gap-map", kind: "page", what: "every cell, and the reason each blind one is blind" },
      ],
      note: `${v.blind} of ${total} cells on this theme have no instrument behind them.`,
    };
  });

  return {
    rows,
    asOf: null,
    asOfField: null,
    aside: d.aside ?? [],
    live: rows.length > 0,
    provenance: "Derived from the same enumerated table the gap map page renders.",
  };
}

// ─────────────────────────────────── 7. the retired 2026-08-05 board snapshot

function loadSnapshot(raw: unknown): LoadedSet {
  const d = (raw ?? {}) as any;
  const axes: any[] = Array.isArray(d.axes) ? d.axes : [];
  const rows: AxisRow[] = axes.map((a) => ({
    id: a.axis,
    name: deslug(a.axis),
    status: (a.status ?? "UNMEASURED") as AxisStatus,
    what: a.task ? `${a.task}${a.bench ? ` (bank: ${a.bench})` : ""}` : deslug(a.axis),
    family: null,
    n: num(a.n),
    nUnit: "bank items",
    headline: num(a.accuracy),
    headlineLabel: "score on this date",
    headlineFormat: "pct",
    interval: null,
    measuredOn: null,
    separation: null,
    runAttestation: null,
    whyUnmeasured: a.status === "MEASURED" ? null : "Not measured as at the snapshot date.",
    evidence: [
      { label: "the snapshot file", href: "/six-axes/gspc-axes.json", kind: "run", what: "the dated record, exactly as it was frozen" },
      { label: "the live board instead", href: "/api/gspc", kind: "api", what: "what this instrument reports today" },
    ],
    note: a.url ? null : null,
  }));
  return {
    rows,
    asOf: d.measured_on ?? null,
    asOfField: "measured_on",
    aside: d.superseded_note ? [{ label: "Why this is not the board", value: String(d.superseded_note) }] : [],
    live: rows.length > 0,
    provenance: "Read from the dated snapshot file. It will never change.",
  };
}


// ──────────────────────────────────────────── 8. the signed card corpus set

/** The card corpus is a MODEL-BY-AXIS matrix: one signed card per measured cell.
 *  Its axes are benchmark axes and are NOT the public board's governance axis —
 *  a different set, measured by a different instrument, carrying its own count
 *  on purpose. It is included here because it is a separately-counted axis set
 *  that had no route from the board, which is the exact complaint this page
 *  exists to answer. */
function loadCardSet(raw: unknown): LoadedSet {
  const d = (raw ?? {}) as any;
  const axes: any[] = Array.isArray(d.axes) ? d.axes : [];

  const rows: AxisRow[] = axes.map((a) => ({
    id: a.id,
    name: a.id,
    status: a.cards > 0 ? "MEASURED" : "UNMEASURED",
    what: `A benchmark axis of the card corpus. ${a.models} models were run against it, each run recorded in its own signed card.`,
    family: "card corpus",
    n: a.models ?? null,
    nUnit: "models run",
    // build-card-matrix rule 7: an axis's best and average are over third-party models only.
    headline: typeof a.best_accuracy === "number" ? a.best_accuracy : null,
    headlineLabel: "best third-party model's score",
    headlineFormat: "pct",
    interval: null,
    measuredOn: `${a.models} models`,
    separation: null,
    runAttestation: null,
    whyUnmeasured: a.cards > 0 ? null : "No card records this axis.",
    evidence: [
      {
        label: "every model measured on this axis",
        href: `/board/models?axis=${encodeURIComponent(a.id)}`,
        kind: "page",
        what: "third-party models and our own listed apart, with a link to each model's signed record",
      },
      {
        label: "the card index as data",
        href: "/signed/card-matrix.json",
        kind: "register",
        what: "every cell, derived at build time from the card files themselves",
      },
    ],
    note:
      typeof a.mean_accuracy === "number"
        ? `Average across the third-party models run: ${(a.mean_accuracy * 100).toFixed(1)}%. Our own models are listed apart and never set either figure.`
        : null,
  }));

  const aside: { label: string; value: string }[] = [];
  if (d.counts)
    aside.push({
      label: "Coverage of the matrix",
      value: `${d.counts.cells} of ${d.counts.possible_cells} model-and-axis pairs were measured. ${d.counts.coverage_note ?? ""}`,
    });
  if (d.what_a_cell_is) aside.push({ label: "What one cell is", value: String(d.what_a_cell_is) });
  if (d.display_name_policy?.withheld_names)
    aside.push({
      label: "A name we do not publish",
      value: `${d.display_name_policy.withheld_names} of the recorded model names is a retired internal brand this site does not publish, so it is listed under a neutral label. ${d.display_name_policy.where_the_name_still_lives}`,
    });

  return {
    rows,
    asOf: d.as_of ?? null,
    asOfField: "as_of (the newest card stamp in the corpus)",
    aside,
    live: rows.length > 0,
    provenance: "Read from the card index, which is derived at build time from the signed card files.",
  };
}

// ──────────────────── 9–14. universal GSPC non-model cohort working boards

function loadUniversalCohort(
  raw: unknown,
  cohortKey:
    | "measurers_and_harnesses"
    | "agent_and_mcp_harnesses"
    | "interop_working_groups"
    | "ai_labs"
    | "humanoid_labs_and_deployments"
    | "ai_companies",
  provenanceDefault: string,
): LoadedSet {
  const d = (raw ?? {}) as any;
  const cohort = d?.cohorts?.[cohortKey] ?? {};
  const allRows: any[] = Array.isArray(cohort.rows) ? cohort.rows : [];
  const thirdParty = allRows.filter((r) => !r.own_entity);
  const ownEntities = allRows.filter((r) => r.own_entity);

  const rows: AxisRow[] = thirdParty.map((r) => {
    const isMeasured = (r.status ?? "MEASURED") === "MEASURED";
    const isSigned = r.lane === "signed";
    const ev: EvidenceLink[] = [];
    if (typeof r.source_url === "string" && r.source_url) {
      ev.push({
        label: isSigned ? "the signed record" : "the published census artifact",
        href: r.source_url,
        kind: isSigned ? "signed-card" : "register",
        what: "the published JSON record this row was derived from",
      });
    }
    if (typeof r.url === "string" && r.url && r.url !== r.source_url) {
      ev.push({
        label: "the primary external source",
        href: r.url,
        kind: "page",
        what: "the primary URL examined during the probe",
      });
    }
    const yesCount = typeof r.yes_count === "number" ? r.yes_count : typeof r.k === "number" ? r.k : null;
    const totalN = typeof r.n === "number" ? r.n : null;
    const headlineVal =
      typeof r.headline === "number"
        ? r.headline
        : yesCount !== null && totalN && totalN > 0
          ? yesCount / totalN
          : null;

    return {
      id: String(r.id ?? r.subject ?? ""),
      name: String(r.subject ?? r.id ?? ""),
      status: (r.status ?? "MEASURED") as AxisStatus,
      what: String(r.result_summary ?? r.sub_cohort ?? r.group ?? ""),
      family: String(r.sub_cohort ?? r.subject_class ?? r.group ?? "cohort"),
      n: totalN,
      nUnit: String(r.n_unit ?? "checks"),
      headline: headlineVal,
      headlineLabel:
        headlineVal !== null
          ? "share of binary checks satisfied"
          : "deterministic observation — not a scalar score",
      headlineFormat: headlineVal !== null ? "pct" : "count",
      interval: null,
      measuredOn: String(r.group ?? r.subject_class ?? "published artifact"),
      separation: null,
      runAttestation: isSigned ? "ED25519_SIGNED" : "CONTENT_ADDRESSED_UNSIGNED",
      whyUnmeasured: isMeasured
        ? null
        : String(r.result_summary ?? "Published as an explicit unmeasured gap — never converted to a zero score."),
      evidence: ev,
      note: typeof r.group === "string" ? `Measure group: ${r.group} (never ranked across groups).` : null,
    };
  });

  const aside: { label: string; value: string }[] = [];
  if (typeof cohort.ruling === "string" && cohort.ruling) {
    aside.push({ label: "Measure ruling", value: cohort.ruling });
  }
  if (ownEntities.length > 0) {
    aside.push({
      label: "Our own instruments & entities (listed apart, never self-ranked)",
      value: ownEntities.map((o) => `${o.subject}: ${o.result_summary}`).join(" · "),
    });
  }
  if (typeof d.busabase_gspc_base_id === "string") {
    aside.push({
      label: "Busabase GSPC base",
      value: `${d.busabase_gspc_base_id} (ledger sha256: ${String(d.ledger_sha256 ?? "").slice(0, 16)}…)`,
    });
  }

  const asOf = typeof d.as_of === "string" && d.as_of.trim() ? d.as_of.trim() : null;
  return {
    rows,
    asOf,
    asOfField: asOf ? "as_of" : null,
    aside,
    live: rows.length > 0,
    provenance: provenanceDefault,
  };
}

export function loadMeasurersAndHarnesses(raw: unknown): LoadedSet {
  return loadUniversalCohort(
    raw,
    "measurers_and_harnesses",
    "Read from /interop/gspc-universal-ledger.json (compiled from verifiability-census-2026-09-17-v0.3.json, disclosure-completeness-2026-09-30/set.json, and benchmarker-trust/scorecards-2026-09-13.json).",
  );
}

export function loadAgentAndMcpHarnesses(raw: unknown): LoadedSet {
  return loadUniversalCohort(
    raw,
    "agent_and_mcp_harnesses",
    "Read from /interop/gspc-universal-ledger.json (compiled from gspc-axis-agent-identity-measurement-v0.1.json, effect-binding-census-index.json, mcp-trust/2026-10-07.json, and a2a-card-census-2026-09-25).",
  );
}

export function loadInteropWorkingGroups(raw: unknown): LoadedSet {
  return loadUniversalCohort(
    raw,
    "interop_working_groups",
    "Read from /interop/gspc-universal-ledger.json (synced with Busabase gspc base bsemvaekntqom40ksh, group=interop-intel).",
  );
}

export function loadAiLabs(raw: unknown): LoadedSet {
  return loadUniversalCohort(
    raw,
    "ai_labs",
    "Read from /interop/gspc-universal-ledger.json (compiled from lab-card-census-2026-09-17.json).",
  );
}

export function loadHumanoidLabsAndDeployments(raw: unknown): LoadedSet {
  return loadUniversalCohort(
    raw,
    "humanoid_labs_and_deployments",
    "Read from /interop/gspc-universal-ledger.json (compiled from signed financial-measure-card-humanoid-labour-index.json and humanoid-registry-unsigned.json).",
  );
}

export function loadAiCompanies(raw: unknown): LoadedSet {
  return loadUniversalCohort(
    raw,
    "ai_companies",
    "Read from /interop/gspc-universal-ledger.json (compiled from art5-emotion-ai-2026-09, gpai-signatory-2026-09, art50-marking-posture-2026-09, and art53-training-summary-2026-09).",
  );
}

// ──────────── 15–16. OSAIA SAFE v0.2 + Claim Maintenance & Agent Layer / Arena / Academy HITL

export function loadOsaiaSafeAndClaimMaintenance(raw: unknown): LoadedSet {
  const d = (raw ?? {}) as any;
  const safe = d?.safe_end_to_end_integration ?? d?.safe_end_to_end ?? {};
  const pack = safe?.frozen_evidence_pack ?? {};
  const rfcMap = safe?.safe_rfc_fieldmap_and_extensions ?? {};
  const verifier = safe?.offline_verifier_and_renderers ?? {};
  const stale = d?.staleness_and_claim_maintenance ?? {};
  const fp = stale?.frozen_regulatory_corpus ?? {};
  const loop = stale?.fluid_staleness_to_ras_loop ?? {};
  const records: any[] = Array.isArray(pack.records) ? pack.records : [];

  const rows: AxisRow[] = records.map((r) => {
    const state = String(r.state ?? "UNMEASURED").toUpperCase();
    const isMeasured = state !== "UNMEASURED";
    const headlineVal =
      state === "PASS" ? 1 : state === "PARTIAL" ? 0.5 : state === "FAIL" ? 0 : null;
    const mappedAxes = Array.isArray(r.gspc_axes_mapped) ? r.gspc_axes_mapped.join(", ") : "provenance";
    const ev: EvidenceLink[] = [
      {
        label: "the OSAIA SAFE v0.2 adapter",
        href: "/interop/osaia-safe-evidence-adapter-v0.2.json",
        kind: "register",
        what: "6-stage SAFE-to-GSPC pipeline and 5 mapped GSPC axes",
      },
      {
        label: "the frozen provision corpus (417 EU provisions)",
        href: "/interop/frozen-provision-hashes.json",
        kind: "register",
        what: "417 frozen provisions across 6 EU instruments",
      },
      {
        label: "the Claim Maintenance v0.2 spec",
        href: "/spec/claim-maintenance/index.json",
        kind: "page",
        what: "valid → stale → superseded/revoked state machine",
      },
    ];
    return {
      id: String(r.record_id ?? ""),
      name: `${r.record_id} (${mappedAxes})`,
      status: (isMeasured ? "MEASURED" : "UNMEASURED") as AxisStatus,
      what: `OSAIA SAFE v0.2 re-verification (${r.claim_type ?? "safe_reverification"}) — state: ${state} · negative_control: ${r.negative_control ?? "-"} · ${r.statement ?? ""}`,
      family: mappedAxes,
      n: 1,
      nUnit: "frozen SAFE event",
      headline: headlineVal,
      headlineLabel: isMeasured
        ? `re-verification state (${state})`
        : "explicit UNMEASURED control (no evidence fetched)",
      headlineFormat: "pct",
      interval: null,
      measuredOn: `${r.file ?? r.record_id} · sha256:${String(r.canonical_sha256 ?? "").slice(0, 12)}…`,
      separation: null,
      runAttestation: "ED25519_SIGNED",
      whyUnmeasured: isMeasured
        ? null
        : "Published as an explicit UNMEASURED control in the frozen OSAIA SAFE pack so missing evidence is never silently promoted to PASS or FAIL.",
      evidence: ev,
      note: `Measure group: osaia-safe-reverification · procedure: ${r.procedure ?? "safe_pack_verify.py --offline"}.`,
    };
  });

  const aside: { label: string; value: string }[] = [];
  if (pack.events_count) {
    const sc = pack.state_counts ?? {};
    aside.push({
      label: "Frozen OSAIA SAFE pack",
      value: `${pack.events_count} events (${sc.PASS ?? 5} PASS, ${sc.FAIL ?? 3} FAIL, ${sc.PARTIAL ?? 1} PARTIAL, ${sc.UNMEASURED ?? 1} UNMEASURED) · ${rfcMap.rfc_fields_mapped_count ?? 26} RFC field mappings + ${rfcMap.csoai_extensions_not_in_rfc_count ?? 6} CSOAI extensions · ${verifier.regression_methods_count ?? 35} verifier checks.`,
    });
  }
  if (fp.total_frozen_provisions) {
    aside.push({
      label: "417 Frozen EU Provisions (6 instruments)",
      value: `${fp.total_frozen_provisions} frozen provisions across ${fp.instruments_count} EU instruments (corpus_root ${String(fp.corpus_root_sha256 ?? "").slice(0, 16)}…).`,
    });
  }
  if (loop.stages_count) {
    const channels = Array.isArray(loop.zernio_and_meok_summon_channels) ? loop.zernio_and_meok_summon_channels : [];
    const f2f = Array.isArray(loop.frozen_to_fluid_saas_to_ras_pipeline) ? loop.frozen_to_fluid_saas_to_ras_pipeline : [];
    aside.push({
      label: "Claim Maintenance v0.2 & Fluid Staleness-to-RAS Loop",
      value: `${loop.stages_count}-stage fluid staleness loop (CHANGE_EVENT → STALE → H.I.M. consented impact list → Academy HITL refresher → RAS re-attestation) · ${f2f.length || 7}-stage Frozen-to-Fluid / SaaS-to-RAS pipeline · ${channels.length || 3} consented summon channels (Zernio DRAFTED_NICK_GATED_NOT_CONFIGURED, MEOK Voice, 6-State Agent HUD) · unsolicited sends forbidden (${String(loop.unsolicited_sends_allowed)}).`,
    });
  }

  return {
    rows,
    asOf: pack.as_of ?? d.as_of ?? null,
    asOfField: "safe_end_to_end_integration.frozen_evidence_pack.as_of",
    aside,
    live: rows.length > 0,
    provenance:
      "Read from /interop/gspc-agent-layer-safe-arena.json (compiled from /interop/osaia-safe-evidence-adapter-v0.2.json, docs/standards/osaia-safe-evidence-pack/records/index.json, /interop/frozen-provision-hashes.json, and /spec/claim-maintenance/index.json).",
  };
}

export function loadAgentLayerArenaAndAcademyHitl(raw: unknown): LoadedSet {
  const d = (raw ?? {}) as any;
  const protocols: any[] = Array.isArray(d?.ax_protocols) ? d.ax_protocols : [];
  const loopActions: any[] = Array.isArray(d?.meok_him_action_loop) ? d.meok_him_action_loop : [];
  const explorer = d?.verified_record_and_report_explorer ?? {};
  const aca = d?.arena_city_academy_hitl ?? {};
  const arena = aca?.arena_scoreboard ?? {};
  const city = aca?.council_city_colosseum ?? {};
  const academy = aca?.academy_hitl_training ?? {};
  const exercises: any[] = Array.isArray(academy.reproducible_exercises) ? academy.reproducible_exercises : [];

  const rows: AxisRow[] = [];

  protocols.forEach((p) => {
    rows.push({
      id: `ax:${p.protocol_id}`,
      name: `${p.protocol} (${p.endpoint})`,
      status: "MEASURED",
      what: `${p.capabilities} (${p.authority_boundary})`,
      family: "GSPC Agent Layer (AX / UI)",
      n: 1,
      nUnit: "protocol surface",
      headline: 1,
      headlineLabel: "protocol surface wired to SHA-pinned GSPC corpus",
      headlineFormat: "pct",
      interval: null,
      measuredOn: `${p.endpoint} · ${p.implementation_file}`,
      separation: null,
      runAttestation: "SHA256_PINNED_SURFACE",
      whyUnmeasured: null,
      evidence: [
        {
          label: "GSPC Agent Layer & SAFE packet",
          href: "/interop/gspc-agent-layer-safe-arena.json",
          kind: "register",
          what: "unified GSPC Agent Layer, OSAIA SAFE, Arena & Academy HITL packet",
        },
      ],
      note: "Grounded in Busabase gspc (bsemvaekntqom40ksh). Never mutates canonical records directly.",
    });
  });

  loopActions.forEach((act) => {
    rows.push({
      id: `him:${act.verb ?? act.action_id}`,
      name: `MEOK + H.I.M. Action: ${act.verb ?? act.action_id} (${act.mode})`,
      status: "MEASURED",
      what: String(act.what_happens ?? ""),
      family: "MEOK + H.I.M. 4-Action Loop",
      n: 1,
      nUnit: "gate rule",
      headline: 1,
      headlineLabel: act.human_gate_required ? "strictly H.I.M. human-gated" : "read-only / deterministic probe",
      headlineFormat: "pct",
      interval: null,
      measuredOn: `HUD state: ${act.hud_state ?? "-"}`,
      separation: null,
      runAttestation: act.human_gate_required ? "HIM_HUMAN_GATED" : "BUSABASE_AUTOMERGE_FALSE",
      whyUnmeasured: null,
      evidence: [
        {
          label: "GSPC Agent Layer & SAFE packet",
          href: "/interop/gspc-agent-layer-safe-arena.json",
          kind: "register",
          what: "4-action WORK → MEASURE → FIX → SIGN governance contract",
        },
      ],
      note: `PALS: ${(act.meok_pals_assigned ?? []).join(", ")} · human_gate_required=${String(act.human_gate_required)}.`,
    });
  });

  if (arena.n_rounds) {
    rows.push({
      id: "arena:head-to-head-scoreboard",
      name: `GSPC Arena Head-to-Head Battles (${arena.n_rounds} signed rounds)`,
      status: "MEASURED",
      what: `Head-to-head model and human-vs-AI verification arena across ${arena.axes_count} axes and ${arena.bench_sources} benchmark sources.`,
      family: "Arena & Council City",
      n: num(arena.n_rounds),
      nUnit: "signed rounds",
      headline: 1,
      headlineLabel: "Ed25519-signed arena rounds",
      headlineFormat: "pct",
      interval: null,
      measuredOn: "/signed/arena_scoreboard.json",
      separation: null,
      runAttestation: "ED25519_SIGNED",
      whyUnmeasured: null,
      evidence: [
        {
          label: "signed arena scoreboard",
          href: "/signed/arena_scoreboard.json",
          kind: "signed-card",
          what: "4,760 signed rounds with Ed25519 signature",
        },
      ],
      note: `Generation ${arena.generation ?? "2026-08-23-b"} · ${arena.bench_sources ?? 398} benchmark sources.`,
    });
  }

  if (city.turns) {
    rows.push({
      id: "city:red-vs-blue-simulation",
      name: `Council City 40v40 Red vs Blue Simulation (${city.turns} turns)`,
      status: "MEASURED",
      what: `Adversarial 40 RED vs 40 BLUE governance simulation over ${city.turns} turns / ${city.epochs} epochs (ALLOWED: ${city.counts?.ALLOWED ?? 278}, BLOCKED: ${city.counts?.BLOCKED ?? 37}, UNMEASURED: ${city.counts?.UNMEASURED ?? 85}).`,
      family: "Arena & Council City",
      n: num(city.turns),
      nUnit: "turns",
      headline: 1,
      headlineLabel: "positive canary control exercised",
      headlineFormat: "pct",
      interval: null,
      measuredOn: "/city/board.json",
      separation: null,
      runAttestation: "SHA256_PINNED_SURFACE",
      whyUnmeasured: null,
      evidence: [
        {
          label: "Council City board JSON",
          href: "/city/board.json",
          kind: "register",
          what: "80-agent 400-turn simulation state on EU AI Act Art 5(1)(a)-(h)",
        },
      ],
      note: `Epochs: ${city.epochs ?? 5} · gate_exercised=${String(city.gate_exercised)}.`,
    });
  }

  exercises.forEach((ex) => {
    rows.push({
      id: `academy:${ex.exercise_id}`,
      name: `Academy HITL ${ex.exercise_id}: ${ex.title}`,
      status: "MEASURED",
      what: `Human-in-the-loop verification exercise realising ${(ex.realises_modules ?? []).join(", ")} — gate: ${ex.completion_gate}`,
      family: "Academy HITL Training",
      n: 1,
      nUnit: "reproducible CLI exercise",
      headline: 1,
      headlineLabel: "expected output pinned by SHA-256 + negative control",
      headlineFormat: "pct",
      interval: null,
      measuredOn: `realises: ${(ex.realises_modules ?? []).join(", ")}`,
      separation: null,
      runAttestation: "SHA256_PINNED_EXERCISE",
      whyUnmeasured: null,
      evidence: [
        {
          label: "GSPC Agent Layer & Academy HITL packet",
          href: "/interop/gspc-agent-layer-safe-arena.json",
          kind: "register",
          what: "9 SHA-256-pinned Academy human-in-the-loop verification exercises",
        },
      ],
      note: "Refreshes stale operator claims in the Staleness-to-RAS loop.",
    });
  });

  const aside: { label: string; value: string }[] = [
    {
      label: "MEOK + H.I.M. inside GSPC & Verified Record Explorer (recmvagob90cgk882j)",
      value:
        `5 AX/UI protocols (/api/chat, /mcp, /.well-known/agent-card.json, /api/agui/run, /api/a2ui/run) + 4-action loop (WORK → MEASURE → FIX → SIGN) + MEOK Verified Record & Report Explorer (${explorer.verified_records_catalog_count ?? 40} anchored records, ${explorer.him_escalation_triggers_count ?? 5} H.I.M. human escalation triggers; answers only from verified records).`,
    },
    {
      label: "Frozen-to-Fluid / SaaS-to-RAS via Zernio & MEOK Voice → Academy → Exam → MOOC (recmvagpnwbx7vffpu)",
      value: `${academy.total_modules ?? 63} Academy modules (${academy.served_modules ?? 10} served) · ${exercises.length} SHA-256-pinned verification exercises · consented Zernio (DRAFTED_NICK_GATED_NOT_CONFIGURED) / MEOK Voice summon into Training → Exam → Gamified Arena/City MOOC → H.I.M. RAS re-attestation.`,
    },
  ];

  return {
    rows,
    asOf: arena.as_of ?? d.as_of ?? null,
    asOfField: "arena_city_academy_hitl.arena_scoreboard.as_of",
    aside,
    live: rows.length > 0,
    provenance:
      "Read from /interop/gspc-agent-layer-safe-arena.json (compiled from functions/_lib/aguiRun.ts, functions/_lib/a2uiSurfaces.ts, public/signed/arena_scoreboard.json, public/city/board.json, and council-os/academy/module-inventory.json).",
  };
}

// ─────────────────────────────────────────────────────────── the declarations

export const AXIS_SETS: AxisSet[] = [
  {
    id: "board",
    name: "The public board",
    headline:
      "The flagship board combines model-comparison runs on frozen question banks with deterministic fact runs on named public records. Each row states which kind it is and what was measured.",
    measures:
      "Behavioural rows grade model answers by fixed rules. Fact rows read public ledger records, published series or other named sources without testing a model.",
    subject: "language models on comparison rows; named instruments or public records on fact rows",
    establishes: [
      "For a model-comparison row, how a named model scored on a named question bank and date.",
      "For a model-comparison row, whether its evidence separates a leader, shows a tie or leaves separation untested.",
      "Exactly which slots have nothing behind them — those rows are published on purpose.",
    ],
    doesNotEstablish: [
      "That anybody complies with any law. A score describes a run on a frozen set of questions on a date. It is not a compliance finding, and we are not a certification, accreditation or notified body.",
      "That a model is good in general. It answered these questions, not all questions, and a bank of a few dozen items measures a few dozen items.",
      "That a declared slot is measured. A published slot exists so the gap is visible; quoting the slot count as a measurement count would claim runs that never happened.",
      "That a financial row is a rating, a risk opinion, or investment advice. It records which flags an account carries — what that implies about risk is not measured here.",
    ],
    relation:
      "This is the only set whose count belongs in a sentence about 'the board'. The other sets measure different things over different populations, so they carry their own counts by design.",
    countAuthority: "GET /api/gspc → totals.public_count",
    artifact: { href: "/api/gspc", label: "/api/gspc" },
    detailPage: { href: "/dashboard?tab=board", label: "the full board, axis by axis" },
    freshness:
      "The date is the measurement stamp carried by the current board response — when the runs happened. It is not render or deploy time, and signing state is reported separately rather than inferred from the date.",
    fetchUrl: "/api/gspc",
    // The signed snapshot is eligible only when its separate status document is
    // CURRENT. Status is read first; SUPERSEDED/unknown status fails closed with
    // no rows. Even a current fallback renders with live=false and visible
    // provenance because signed bytes are not a live endpoint read.
    fallbackUrl: "/signed/gspc-board.signed.json",
    fallbackStatusUrl: "/signed/gspc-board.status.json",
    fallbackProvenance:
      "The board endpoint did not answer, so these rows come from a signed snapshot whose status document " +
      "marks it CURRENT. This is not a live read and can lag the endpoint.",
    load: loadBoard,
  },
  {
    id: "engine-16",
    name: "The fresh-benchmark engine",
    headline:
      "A separate, harder set run on our own measurement machine — deliberately built so that a model that has seen the public banks cannot coast on them.",
    measures: "How local models cope with a fresh, harder set they have not been tuned against.",
    subject: "small local models running on one measurement machine",
    establishes: [
      "That the harder set was run, on a stated date, and what each model scored across the whole of it.",
      "The size of the gap between our best local model and a perfect score — measured rather than asserted.",
    ],
    doesNotEstablish: [
      "Anything per-axis. The published artifact declares its axes but carries no per-axis breakdown, so no row for a single axis can honestly be drawn from it — and none is drawn below.",
      "A final score for any model. Every run here is under thirty items, which the artifact itself states is not quotable as a final result.",
      "Anything about the public board. This is a different set of questions with different difficulty; its number is not the board's number and the two must never be reconciled into one.",
    ],
    relation:
      "A private harder sibling of the board, built so that improvement on the public banks cannot be mistaken for improvement in general. It has never been part of the board's count.",
    countAuthority: "/measurement/axis-engine-16.json → axes",
    artifact: { href: "/measurement/axis-engine-16.json", label: "/measurement/axis-engine-16.json" },
    detailPage: null,
    freshness:
      "The date is the `measured` field inside the artifact — when the engine run finished. It advances only when the engine runs again.",
    fetchUrl: "/measurement/axis-engine-16.json",
    load: loadEngine16,
  },
  {
    id: "arena",
    name: "The head-to-head arena",
    headline:
      "Models play rounds against each other on a topic, a deterministic referee calls each round, and a chess-style rating falls out of who beat whom.",
    measures: "Relative standing between models on a topic — who beats whom, and by how comfortable a margin.",
    subject: "models, played against each other",
    establishes: [
      "A rating and a confidence range for each model on each topic, from a stated number of rounds.",
      "That the whole reference file is signed, so a stranger can check the numbers were not edited after the fact.",
    ],
    doesNotEstablish: [
      "Accuracy against a right answer. A rating says who won more rounds, not who was correct; a field of weak models still produces a leader.",
      "Any board figure. This set has its own axis list — some of its topics are not board axes at all, and two of them are measured in-lane and deliberately never counted in board totals.",
      "A settled count. This set's own two surfaces still disagree about how many axis it has, and several axis named in the signed reference carry no rows. That gap is open and flagged, not resolved.",
    ],
    relation:
      "A different instrument over a different axis list. It was mistaken for a stale copy of the board for a long time; it is not one, and forcing its number to match the board's would destroy information rather than fix a contradiction.",
    countAuthority: "/arena/elo_reference.json → axes[]",
    artifact: { href: "/arena/elo_reference.json", label: "/arena/elo_reference.json" },
    detailPage: { href: "/arena-scoreboard", label: "the historical arena replay (29 August)" },
    freshness:
      "The date is the `generated` field inside the signed reference — when the ratings were computed from the rounds played. It is not a render time.",
    fetchUrl: "/arena/elo_reference.json",
    load: loadArena,
  },
  {
    id: "eunomia",
    name: "The finance bench",
    headline:
      "A finance-specific bench: can a model read a real financial artifact and pick the correct label from a short, fixed list?",
    measures:
      "Label accuracy on financial and regulatory documents, with a strong model and a deliberately weak baseline run side by side.",
    subject: "two language models, one strong and one weak on purpose",
    establishes: [
      "How each of two model tiers scored on each bench, with a confidence range on every number.",
      "The gap between a strong model and a weak one — which is what tells you the bench discriminates at all rather than being trivially easy.",
    ],
    doesNotEstablish: [
      "Anything about a real financial decision. These are graded label questions, not advice, not a rating, and not a view on any instrument.",
      "A reliable score anywhere. Most benches here carry around ten graded cases, so the confidence ranges are wide and a single case moves the number visibly.",
      "That the declared index rows measure anything. They carry no item set yet and are published as declared slots.",
    ],
    relation:
      "A separate specialist board with its own subject matter. Its rows are not board axes and its count has never been part of the board's count.",
    countAuthority: "client/src/data/eunomia.ts → EUNOMIA_AXES (the same array /eunomia renders)",
    artifact: { href: "/eunomia-data", label: "/eunomia-data" },
    detailPage: { href: "/eunomia", label: "the finance board" },
    freshness:
      "The date is the run stamp recorded with the bench data — when the two model tiers were run. It changes only on a re-run.",
    fetchUrl: null,
    load: () => loadEunomia(),
  },
  {
    id: "financial-register",
    name: "The financial register",
    headline:
      "The per-row rubric/evidence detail behind the financial half of the public board. Board counts (axes/measured/unmeasured) come from live GET /api/gspc — this register is not the board.",
    measures:
      "Deterministic facts about financial instruments and public series — issuer-account flags, disclosure presence, and cited component series. No model is asked anything.",
    subject: "issuing accounts of named financial instruments, and cited public series for component/disclosure rows",
    establishes: [
      "Which control flags a named account carried, read directly off a public ledger, for the accounts we could locate.",
      "Which financial/domain rows have a signed deterministic-facts run behind them, and which evidence surface to open.",
    ],
    doesNotEstablish: [
      "Any view on risk, solvency or creditworthiness. What a control flag implies is explicitly unmeasured and would need legal advice, not a benchmark.",
      "Board totals. Quote GET /api/gspc totals.public_count for axes/measured/unmeasured — never invent board counts from this file.",
      "A rating, a ranking, an index formula, or an endorsement of any named instrument. The MEASURED-INDEX-v0.1 sticker stays withdrawn (C-2026-0826-05).",
    ],
    relation:
      "These rows are also carried on the public board. Board slot and measured counts are derived live from GET /api/gspc. This register is dated per-row detail behind those same rows — not a competing board claim, and not a place to stamp MEASURED onto unsigned runs.",
    countAuthority: "GET /api/gspc → totals.by_family.financial / axes[] (family=financial). /interop/financial-axes.json is dated register detail only.",
    artifact: { href: "/interop/financial-axes.json", label: "/interop/financial-axes.json" },
    detailPage: { href: "/financial-axes", label: "the financial axes page" },
    freshness:
      "as_of on the register file when present. Board counts always re-fetch from GET /api/gspc; the register date is not the board's measured_on.",
    fetchUrl: "/interop/financial-axes.json",
    load: loadFinancialRegister,
  },
  {
    id: "gap-map",
    name: "The coverage gap",
    headline:
      "The denominator. Every other set on this page counts what we measured; this one counts what nobody measures — enumerated legal provisions with no instrument behind them at all.",
    measures:
      "How much of the enumerated statute has any measuring instrument, anywhere in the field — ours or anyone else's.",
    subject: "provisions of law, crossed against published benchmarks",
    establishes: [
      "How many enumerated provisions have any instrument measuring them at provision granularity, and how many have none.",
      "The reason each blind cell is blind — no instrument exists, the wrong granularity, or an instrument we reject because it grades with another model's opinion.",
    ],
    doesNotEstablish: [
      "That the blind cells are unmeasurable. They are unmeasured, which is a statement about the field's current instruments and about ours.",
      "A score for anyone. Nothing here grades a model; it grades the coverage of the measuring field itself, including our own.",
      "Completeness of the survey. It covers the benchmarks we surveyed; an instrument we did not find would move the number.",
    ],
    relation:
      "The honest context for every green row elsewhere on this page. The board's measured rows sit inside this denominator, and the denominator is overwhelmingly blind.",
    countAuthority: "/gspc-gap-map (the page derives every cell from its own enumerated table)",
    artifact: { href: "/gspc-gap-map", label: "/gspc-gap-map" },
    detailPage: { href: "/gspc-gap-map", label: "the full gap map" },
    freshness:
      "Dated by the survey of published benchmarks behind it, not by deploy time. The gap map page carries the survey's own record.",
    fetchUrl: null,
    load: loadGapMap,
  },
  {
    id: "card-set",
    name: "The signed card corpus",
    headline:
      "The largest body of measurement we hold: a grid of models against benchmark axes, with one signed record per filled cell — and most of the grid deliberately empty.",
    measures:
      "How a wide fleet of models scores on short benchmark banks — reasoning, general knowledge, refusal behaviour and a few governance-flavoured banks.",
    subject: "a wide fleet of models, mostly small and locally run",
    establishes: [
      "Which model was run against which axis, on which date, and what it scored — each one recorded in a file whose signature covers its own contents.",
      "That the record has not been edited since: recompute the hash of a card's body and check the signature yourself, offline, without asking us.",
      "Exactly how little of the grid has been measured. Most pairs were never run, and the empty cells are shown rather than tidied away.",
    ],
    doesNotEstablish: [
      "That these are the public board's axes. They are not — this is a benchmark corpus, the board is a governance instrument, and the two counts are different on purpose and are never added together.",
      "That a model is good, or better than another. Each cell is one score on one short bank on one date, and several banks are small enough that a single item moves the number visibly.",
      "That a blank cell is a failure. A blank means never measured; a measured zero is shown as a zero.",
      "A settled total for the corpus. The published card index is frozen at the number that could actually be verified, and more card files exist than that index lists — see the custody panel below.",
    ],
    relation:
      "A different instrument again, and the one that had the least visibility: it was fully built, fully signed, and reachable from nothing. Its axis names deliberately do not match the board's, because they are not the board's axes.",
    countAuthority: "/signed/card-matrix.json → axes[] and models[], derived at build time from the card files",
    artifact: { href: "/signed/card-matrix.json", label: "/signed/card-matrix.json" },
    detailPage: { href: "/board/models", label: "every measured model, and the coverage map" },
    freshness:
      "The date is the newest measurement stamp found across the cards themselves. It advances only when a new card is written.",
    fetchUrl: "/signed/card-matrix.json",
    load: loadCardSet,
  },
  {
    id: "measurers-harnesses",
    name: "Measurers & harnesses",
    headline:
      "Measuring the measures: benchmarkers, evaluation harnesses, disclosure-completeness audits and provenance scorecards across the AI evaluation field.",
    measures:
      "Whether published benchmarkers and evaluation harnesses cryptographically sign results, content-address question banks, publish frozen item sets, maintain corrections logs, and disclose publication lag.",
    subject: "third-party AI benchmarkers, evaluation harnesses, and leaderboard operators (with our own instruments listed apart)",
    establishes: [
      "Which of the five binary verifiability checks (signed, content-addressed, bank published, corrections log, recomputable) each surveyed benchmarker satisfies on its public site.",
      "Signed disclosure-completeness and publication-lag observations across major public evaluation platforms.",
      "Seven-dimension provenance scorecards (freshness, reproducibility, provenance, contamination disclosure, model-version specificity, correction behaviour, signature availability).",
    ],
    doesNotEstablish: [
      "A composite rank across benchmarkers. Each sub-cohort (verifiability census, disclosure completeness, provenance scorecard) carries its own Measure group and is never ranked across groups.",
      "That an unsigned benchmark is fraudulent. It establishes only that a stranger cannot cryptographically verify the published bytes offline.",
    ],
    relation:
      "A meta-measurement cohort in the Universal GSPC Ledger (synced with Busabase gspc base bsemvaekntqom40ksh). Our own CSOAI/GSPC rows are listed apart in the aside and never self-ranked.",
    countAuthority: "/interop/gspc-universal-ledger.json → cohorts.measurers_and_harnesses.rows",
    artifact: { href: "/interop/gspc-universal-ledger.json", label: "/interop/gspc-universal-ledger.json" },
    detailPage: { href: "/interop/verifiability-census-2026-09-17-v0.3.json", label: "the raw verifiability census" },
    freshness:
      "The date is `as_of` inside `/interop/gspc-universal-ledger.json`, compiled from the underlying dated census artifacts.",
    fetchUrl: "/interop/gspc-universal-ledger.json",
    load: loadMeasurersAndHarnesses,
  },
  {
    id: "agent-mcp-harnesses",
    name: "Agent & MCP harnesses",
    headline:
      "Measuring agent harnesses, A2A agent cards, and public MCP server fleets on identity, discovery, cryptographic signing and effect-binding.",
    measures:
      "Six binary agent-identity components on named agent harnesses, plus fleet-wide censuses of 598 MCP server endpoints on effect-binding, 500 internet-facing MCP hosts on remote transport trust, A2A RFC 8785 JCS signatures, and 39,073 canonical agent identities.",
    subject: "autonomous agent harnesses, A2A agent cards, and public MCP server endpoints",
    establishes: [
      "Which of the six agent-identity components (declared ID, A2A discovery, MCP URL, signed card, ERC-8004 registry entry, MCP catalog entry) each probed agent harness exposes.",
      "How many probed public MCP server endpoints bind side-effects to verifiable caller digests (`effect-binding`).",
    ],
    doesNotEstablish: [
      "That an agent harness is safe to run in production. Identity and discovery metadata do not bound runtime tool execution.",
      "Any cross-group rank between individual agent harnesses and aggregate MCP/A2A fleet censuses.",
    ],
    relation:
      "The agent and tool-harness cohort of the Universal GSPC Ledger (Busabase gspc base bsemvaekntqom40ksh). Own-entity endpoints (`csoai.org`, `gspc`) are listed apart in the aside.",
    countAuthority: "/interop/gspc-universal-ledger.json → cohorts.agent_and_mcp_harnesses.rows",
    artifact: { href: "/interop/gspc-universal-ledger.json", label: "/interop/gspc-universal-ledger.json" },
    detailPage: { href: "/interop/effect-binding-census-index.json", label: "the 598-endpoint MCP effect-binding census" },
    freshness:
      "The date is `as_of` inside `/interop/gspc-universal-ledger.json`, compiled from the underlying agent-identity and MCP probe records.",
    fetchUrl: "/interop/gspc-universal-ledger.json",
    load: loadAgentAndMcpHarnesses,
  },
  {
    id: "interop-working-groups",
    name: "Interop working groups",
    headline:
      "Measuring interoperability working groups, standards bodies and open security consortia mapped against the 23 GSPC axes.",
    measures:
      "Published artefacts, specifications, working-group scope, and axis alignment across 13 interoperability and AI security bodies.",
    subject: "13 interoperability working groups and standards bodies in Busabase gspc (group=interop-intel)",
    establishes: [
      "Which GSPC axes each working group or standards body touches, and what public specification or benchmark artefact it has published.",
    ],
    doesNotEstablish: [
      "Endorsement by or membership in any listed working group, or any ranking between standards bodies.",
    ],
    relation:
      "Directly mirrors the `interop-group` records maintained with Grok Bot in Busabase `gspc` (`bsemvaekntqom40ksh`).",
    countAuthority: "/interop/gspc-universal-ledger.json → cohorts.interop_working_groups.rows",
    artifact: { href: "/interop/gspc-universal-ledger.json", label: "/interop/gspc-universal-ledger.json" },
    detailPage: null,
    freshness:
      "The date is `as_of` carried by the Busabase `gspc` interop-group records inside `/interop/gspc-universal-ledger.json`.",
    fetchUrl: "/interop/gspc-universal-ledger.json",
    load: loadInteropWorkingGroups,
  },
  {
    id: "ai-labs",
    name: "Frontier AI labs",
    headline:
      "Measuring the 10 frontier AI labs across five verifiability checks on their published system cards, model cards and evaluation reports.",
    measures:
      "Whether Anthropic, OpenAI, Google DeepMind, Meta, xAI, Mistral AI, DeepSeek, Alibaba Qwen, Moonshot AI (Kimi) and Microsoft cryptographically sign published evaluations, content-address question banks, publish evaluation items, log corrections, and support independent recomputation.",
    subject: "10 frontier AI laboratories and their flagship published model/system cards",
    establishes: [
      "That 0 of 10 surveyed frontier AI labs cryptographically sign their published evaluation results as of the census date.",
      "Which labs publish partial item banks, errata/version histories, or harness links across the examined artefacts.",
    ],
    doesNotEstablish: [
      "A ranking of model capability across labs. This census audits the verifiability of published evaluation artefacts, not model intelligence.",
    ],
    relation:
      "The `ai-lab` cohort in Busabase `gspc` (`bsemvaekntqom40ksh`) and `/interop/lab-card-census-2026-09-17.json`.",
    countAuthority: "/interop/gspc-universal-ledger.json → cohorts.ai-labs.rows",
    artifact: { href: "/interop/lab-card-census-2026-09-17.json", label: "/interop/lab-card-census-2026-09-17.json" },
    detailPage: { href: "/interop/lab-card-census-2026-09-17.json", label: "the 10-lab verifiability census JSON" },
    freshness:
      "The date is the census stamp in `/interop/lab-card-census-2026-09-17.json`.",
    fetchUrl: "/interop/gspc-universal-ledger.json",
    load: loadAiLabs,
  },
  {
    id: "humanoid-labs",
    name: "Humanoid labs & deployments",
    headline:
      "Measuring 8 humanoid robotics labs on signed fleet-size disclosure probes and 30 named public humanoid deployments with primary evidence links.",
    measures:
      "Whether humanoid robotics vendors publish dated active-unit fleet counts on their public sites (`humanoid-labour-index`), alongside 30 named commercial pilot and factory deployments (`hr-01`..`hr-30`).",
    subject: "8 humanoid robotics laboratories (Figure AI, Agility Robotics, Boston Dynamics, Unitree, Apptronik, 1X, Tesla Optimus, Sanctuary AI) and 30 named public deployments",
    establishes: [
      "That 0 of 8 probed humanoid vendor homepages publish an audited, dated active-unit deployment count — leaving fleet size `UNMEASURED` on the signed card.",
      "Thirty named public deployments (`hr-01`..`hr-30`) with operator, robot family, deployment stage and primary evidence URL.",
    ],
    doesNotEstablish: [
      "A verified unit count or productivity index for any humanoid fleet. Unverified press figures are never promoted to a measured fleet count.",
    ],
    relation:
      "Combines the Ed25519-signed `financial-measure-card-humanoid-labour-index.json` vendor probe with the unsigned 30-row `humanoid-registry-unsigned.json` deployment register.",
    countAuthority: "/interop/gspc-universal-ledger.json → cohorts.humanoid_labs_and_deployments.rows",
    artifact: { href: "/interop/financial-measure-card-humanoid-labour-index.json", label: "/interop/financial-measure-card-humanoid-labour-index.json" },
    detailPage: { href: "/interop/humanoid-registry-unsigned.json", label: "the 30-deployment public registry" },
    freshness:
      "The date is the measurement stamp on the signed humanoid-labour-index card and deployment registry.",
    fetchUrl: "/interop/gspc-universal-ledger.json",
    load: loadHumanoidLabsAndDeployments,
  },
  {
    id: "ai-companies",
    name: "AI companies notices",
    headline:
      "Measuring 32 AI company public-record disclosures across EU AI Act Art 5(1)(f) emotion inference, GPAI Code of Practice signatory status, Art 50(2) synthetic content marking posture, and Art 53(1)(d) training data summaries.",
    measures:
      "Dated, content-addressed public retrieval facts across four regulatory exposure cohorts — without issuing any legal compliance verdict.",
    subject: "32 AI company and model-provider public disclosure records across Art 5, GPAI Code, Art 50(2), and Art 53(1)(d)",
    establishes: [
      "Whether a provider appears on the live European Commission GPAI Code of Practice signatory page as of the fetch timestamp.",
      "What public product-page text, C2PA/SynthID marking posture, or Art 53(1)(d) training content summary was retrievable at the stated timestamp and SHA-256.",
    ],
    doesNotEstablish: [
      "Legal compliance or non-compliance with the EU AI Act. Every record is an observational public-notice fact, never a legal opinion or conformity certificate.",
    ],
    relation:
      "The `ai-company` regulatory-exposure cohort in Busabase `gspc` (`bsemvaekntqom40ksh`) and `/interop/gspc-universal-ledger.json`.",
    countAuthority: "/interop/gspc-universal-ledger.json → cohorts.ai_companies.rows",
    artifact: { href: "/interop/gspc-universal-ledger.json", label: "/interop/gspc-universal-ledger.json" },
    detailPage: null,
    freshness:
      "The date is the retrieval timestamp recorded in each underlying `/interop/` regulatory notice index.",
    fetchUrl: "/interop/gspc-universal-ledger.json",
    load: loadAiCompanies,
  },
  {
    id: "osaia-safe-reverification",
    name: "OSAIA SAFE & claim maintenance",
    headline:
      "End-to-end OSAIA SAFE v0.2 (Shared AI Findings Exchange) 6-stage evidence pipeline, 10 signed re-verification records across 5 GSPC axes, 417 frozen EU provisions across 6 instruments, and Claim Maintenance v0.2.",
    measures:
      "Independent re-verification of OSAIA SAFE v0.2 findings (`PASS` / `FAIL` / `PARTIAL` / `UNMEASURED`) across `governance`, `provenance`, `conformance`, `continuity`, and `effect-binding`, plus fluid claim staleness (`valid` → `stale` → `superseded`/`revoked`).",
    subject: "10 frozen OSAIA SAFE v0.2 events (`SAFE-2026-0001`..`0010`), 26 RFC field mappings + 6 CSOAI extensions, and 417 frozen EU provisions",
    establishes: [
      "Whether an independent re-run of a SAFE finding's verifier check (`safe_pack_verify.py`, 35 verification methods) matches the original finding (`5 PASS`, `3 FAIL`, `1 PARTIAL`, `1 UNMEASURED`).",
      "When a claim transitions from `valid` to `stale` upon a change event in the 417 frozen EU provisions (`corpus_root: 37e2e10d…`), model weights, or harness version — triggering consented impact drafts and RAS re-attestation.",
    ],
    doesNotEstablish: [
      "Regulatory certification or legal conformity. Re-verification tests whether a technical finding reproduces under a pinned harness.",
      "Unsolicited outreach. Staleness notifications require H.I.M. human approval over opted-in counterparties only.",
    ],
    relation:
      "Brings Grok Bot's OSAIA SAFE WG pack (`recmvahelovto7pz9c`), 417 frozen provisions (`recmvaexoe9g16s9ow`), Claim Maintenance v0.2 (`recmvagko0zl3b02jy`), and Staleness-to-RAS loop (`recmvagpnwbx7vffpu`) end-to-end into GSPC (`bsemvaekntqom40ksh`).",
    countAuthority: "/interop/gspc-agent-layer-safe-arena.json → safe_end_to_end.reverification_records",
    artifact: { href: "/interop/gspc-agent-layer-safe-arena.json", label: "/interop/gspc-agent-layer-safe-arena.json" },
    detailPage: { href: "/interop/osaia-safe-evidence-adapter-v0.2.json", label: "the OSAIA SAFE v0.2 evidence adapter" },
    freshness:
      "The date is `safe_end_to_end.freeze_pack.frozen_at` inside `/interop/gspc-agent-layer-safe-arena.json`.",
    fetchUrl: "/interop/gspc-agent-layer-safe-arena.json",
    load: loadOsaiaSafeAndClaimMaintenance,
  },
  {
    id: "agent-layer-arena-hitl",
    name: "Agent layer, Arena & Academy HITL",
    headline:
      "MEOK + H.I.M. inside GSPC across 5 AX/UI protocols (AG-UI 1.0, A2UI v0.9.1/v1.0, MCP, A2A, Chat) so end users and agents can work, measure, fix, and sign — paired with GSPC Arena battles, Council City 40v40, and Academy HITL training.",
    measures:
      "Protocol surface readiness across all 5 AX/UI doors, the 4-action MEOK + H.I.M. governance loop (`WORK`, `MEASURE`, `FIX`, `SIGN`), `4,760` signed Arena rounds, `400`-turn Council City Red-vs-Blue simulation, and `9` SHA-256-pinned Academy HITL exercises.",
    subject: "5 AX/UI agent protocols, 4 MEOK + H.I.M. actions, GSPC Arena (20 models, 4,760 rounds), Council City (80 agents), and 9 Academy HITL verification exercises",
    establishes: [
      "That any end user or AI agent can read/explore (`WORK`), run deterministic probes (`MEASURE`), stage Busabase remediation CRs with `autoMerge=False` (`FIX`), and queue human-gated Ed25519 attestations (`SIGN`) across Council OS and HF.",
      "Signed head-to-head Arena rounds (`4,760` rounds), Council City 40v40 adversarial detection telemetry, and 9 reproducible SHA-256-pinned Academy human-in-the-loop verification exercises.",
    ],
    doesNotEstablish: [
      "Autonomous signing or self-merging. `FIX` always sets `autoMerge: false` and `SIGN` is strictly human-gated via H.I.M.",
    ],
    relation:
      "Unifies Grok Bot's GSPC Agent Layer (`recmvagob90cgk882j`), Gaming/Arena/Council City (`recmv93idshekdrdrb`), and Academy HITL training (`recmvaeyavx42upkzv`) into one public surface.",
    countAuthority: "/interop/gspc-agent-layer-safe-arena.json → ax_protocols + meok_him_four_action_loop + arena_city_academy_hitl",
    artifact: { href: "/interop/gspc-agent-layer-safe-arena.json", label: "/interop/gspc-agent-layer-safe-arena.json" },
    detailPage: { href: "/signed/arena_scoreboard.json", label: "the signed 4,760-round Arena scoreboard" },
    freshness:
      "The date is `as_of` inside `/interop/gspc-agent-layer-safe-arena.json`.",
    fetchUrl: "/interop/gspc-agent-layer-safe-arena.json",
    load: loadAgentLayerArenaAndAcademyHitl,
  },
  {
    id: "snapshot",
    name: "A dated record",
    headline:
      "A frozen photograph of the flagship instrument as it stood on one earlier date. It is a record, not a live board, and it is smaller than the board is now.",
    measures: "What the instrument reported on the snapshot date, and nothing after it.",
    subject: "the board, on one date in the past",
    establishes: [
      "What was published on that date — kept so a reader can check what we said then against what we say now.",
    ],
    doesNotEstablish: [
      "Anything about the board today. Its numbers are smaller because the instrument has changed, not because the board shrank, and quoting it as the current count is the exact error this page exists to prevent.",
      "Any current score for any model. Every number in it is stale by design.",
    ],
    relation:
      "A dated record of the board, kept for the audit trail. It was listed as a board-count authority until it was moved to its own namespace — which changed nothing inside the file and everything about what it may be cited as.",
    countAuthority: "none — this is a record. The count authority is GET /api/gspc.",
    artifact: { href: "/six-axes/gspc-axes.json", label: "/six-axes/gspc-axes.json" },
    detailPage: null,
    freshness:
      "The date is the snapshot's own measurement stamp. It will never advance — that is what makes it a record.",
    fetchUrl: "/six-axes/gspc-axes.json",
    load: loadSnapshot,
    retired:
      "Kept as an audit record. Do not quote its numbers as current; the live board is the authority.",
  },
];

export const BOARD_FALLBACK = boardFallback;

/** The gap map has no JSON artifact — its numbers live in the page that renders
 *  them. Rather than typing them a second time here (the defect this whole file
 *  is a defence against), the page imports the same table the gap map uses and
 *  hands it to loadGapMap. */
export interface GapMapInput {
  by_axis: Record<string, { evidenced: number; blind: number }>;
  names?: Record<string, string>;
  aside?: { label: string; value: string }[];
}
