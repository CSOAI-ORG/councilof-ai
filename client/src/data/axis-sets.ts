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
  /** Present only on an unmeasured row. Says WHY, because an unmeasured slot is
   *  content, not absence. */
  whyUnmeasured: string | null;
  evidence: EvidenceLink[];
  /** The artifact's own note, verbatim. */
  note: string | null;
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
  fallbackProvenance?: string;
  /** Marked when the set is a dated record rather than a live instrument. */
  retired?: string;
}

// ─────────────────────────────────────────────────────────────── helpers

const deslug = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

const interval = (v: unknown): [number, number] | null =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number"
    ? [v[0], v[1]]
    : null;

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

function loadBoard(raw: unknown, provenance = "Live from the board endpoint."): LoadedSet {
  const d = (raw ?? {}) as any;
  const axes: any[] = Array.isArray(d.axes) ? d.axes : [];
  const measuredOnDate =
    typeof d.measured_on === "string" ? d.measured_on : d.measured_on?.date ?? null;

  const rows: AxisRow[] = axes.map((a) => {
    const measured = a.status === "MEASURED";
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
        label: "the signed run",
        href: a.evidence_url,
        kind: "run",
        what: "the recorded run this row summarises",
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
      whyUnmeasured: measured
        ? null
        : a.note ??
          "A slot published so the gap is visible. Nothing has been run against it.",
      evidence: ev,
      note: a.note ?? null,
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
function boardFallback(): LoadedSet {
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
      "Neither the live board endpoint nor its signed snapshot answered here, so no rows are drawn. " +
      "The figure below is a RECORDED OBSERVATION of the endpoint, carrying its own date — not a reading of it. " +
      "If it ever disagrees with the endpoint, the endpoint wins.",
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
      whyUnmeasured: measured
        ? null
        : `${a.data ? `Would need: ${a.data}. ` : ""}${a.bank_status ? `Item set: ${a.bank_status}` : "No run behind this slot yet."}`,
      evidence: ev,
      note: a.risk_verdict ? `What these facts imply about risk: ${a.risk_verdict}.` : null,
    };
  });

  return {
    rows,
    asOf: null,
    asOfField: null,
    aside: d.honesty ? [{ label: "The register's own caveat", value: String(d.honesty) }] : [],
    live: rows.length > 0,
    provenance: "Read from the published register file.",
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
    headline: typeof a.best_accuracy === "number" ? a.best_accuracy : null,
    headlineLabel: "best model's score",
    headlineFormat: "pct",
    interval: null,
    measuredOn: `${a.models} models`,
    separation: null,
    whyUnmeasured: a.cards > 0 ? null : "No card records this axis.",
    evidence: [
      {
        label: "every model measured on this axis, ranked",
        href: `/board/models?axis=${encodeURIComponent(a.id)}`,
        kind: "page",
        what: "the ranking, with a link to each model's signed record",
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
        ? `Average across the models run: ${(a.mean_accuracy * 100).toFixed(1)}%.`
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

// ─────────────────────────────────────────────────────────── the declarations

export const AXIS_SETS: AxisSet[] = [
  {
    id: "board",
    name: "The public board",
    headline:
      "The flagship instrument. A fleet of language models answers a frozen set of questions, and every answer is graded by a fixed rule rather than by another model's opinion.",
    measures:
      "Whether a model gets governance, safety, provenance and continuity questions right — plus a financial half that reads facts off public ledger records rather than asking a model anything.",
    subject: "language models, and (for the financial half) named financial instruments",
    establishes: [
      "How a named model scored, on a named question bank, on a named date.",
      "Whether the best model's lead over the rest of the field is statistically real, or is close enough that the ordering could flip on a re-run.",
      "Exactly which slots have nothing behind them — those rows are published on purpose.",
    ],
    doesNotEstablish: [
      "That anybody complies with any law. A score describes a run on a frozen set of questions on a date. It is not a compliance finding, and we are not a certification, accreditation or notified body.",
      "That a model is good in general. It answered these questions, not all questions, and a bank of a few dozen items measures a few dozen items.",
      "That a declared slot is measured. A published slot exists so the gap is visible; quoting the slot count as a measurement count would claim runs that never happened.",
      "That a financial row is a rating, a risk opinion, or investment advice. It records which flags an account carries — what that implies about risk is not measured here.",
    ],
    relation:
      "This is the set every other count on this page should be compared against, and the only one whose number belongs in a sentence about 'the board'. The other six measure different things over different populations, so they carry their own numbers by design, not by drift.",
    countAuthority: "GET /api/gspc → totals.public_count",
    artifact: { href: "/api/gspc", label: "/api/gspc" },
    detailPage: { href: "/gspc-scoreboard", label: "the full board, axis by axis" },
    freshness:
      "The date is the measurement stamp carried inside the signed board payload — when the runs happened. It is not the time this page was rendered or deployed, so it moves only when new runs are measured and signed.",
    fetchUrl: "/api/gspc",
    // The committed signed snapshot of the same payload. Used when the endpoint
    // does not answer — including during prerender, when no function is running —
    // so a crawler and a reader with a cold cache still get the real rows, and
    // are told plainly that they are reading a snapshot.
    fallbackUrl: "/signed/gspc-board.signed.json",
    fallbackProvenance:
      "The board endpoint did not answer, so these rows come from the SIGNED SNAPSHOT of the same payload — " +
      "the artifact the endpoint's numbers are derived from. It is real and it is signed; it is simply not a " +
      "live read, and it can lag the endpoint.",
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
    detailPage: { href: "/arena-scoreboard", label: "the arena leaderboard" },
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
      "The per-row detail behind the financial half of the public board: what each row would check, and which single row has anything behind it so far.",
    measures:
      "Deterministic facts about financial instruments — which flags an issuing account carries on a public ledger. No model is asked anything.",
    subject: "issuing accounts of named financial instruments",
    establishes: [
      "Which control flags a named account carried, read directly off a public ledger, for the accounts we could locate.",
      "Exactly what each unmeasured row would need before it could carry a number — the data source is named for every one of them.",
    ],
    doesNotEstablish: [
      "Any view on risk, solvency or creditworthiness. What a control flag implies is explicitly unmeasured and would need legal advice, not a benchmark.",
      "Coverage of the instruments the register names. Only the accounts we could locate publicly were read; the rest were never attested, and that is a gap in scope, not a stale number.",
      "A rating, a ranking, or an endorsement of any named instrument.",
    ],
    relation:
      "These rows are also carried on the public board, where they count toward its slot count and NOT toward its measured count. This register is the detail behind those same rows, so its number is a breakdown of the board's, not a competing claim.",
    countAuthority: "/interop/financial-axes.json → axes[]",
    artifact: { href: "/interop/financial-axes.json", label: "/interop/financial-axes.json" },
    detailPage: { href: "/financial-axes", label: "the financial axes page" },
    freshness:
      "This artifact carries no timestamp of any kind, so no date is shown for it. Borrowing a neighbouring file's date would assert a freshness nobody established — unknown is left unknown.",
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
