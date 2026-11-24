/**
 * llms-txt-distribution.mjs — the distribution section of llms.txt and llms-full.txt.
 *
 * scripts/llms-txt.mjs places what distributionSection() returns at {{DISTRIBUTION_SECTION}} in
 * both templates. It lives in its own module so the rule for when a figure may be printed can be
 * tested without running the producer, which derives a whole board when it runs.
 *
 * WHY CSOAI'S OWN FIGURES HEAD THE SECTION (18 Nov 2026). CSOAI Ltd and MEOK AI Labs publish from
 * one account, and the census labels every package with its entity. This section used to head with
 * the artifact's `totals`: 3,852,241 downloads since first release, which is every row of the
 * account (MEOK AI Labs 2,746,597 + CSOAI 890,521 + joint + unattributed). The census producer's
 * rule (scripts/distribution-measure.py, by_entity.rule) says the CSOAI and MEOK AI Labs figures
 * "are two figures and are never added", and the home page (client/src/components/home/
 * HomeDistribution.tsx) heads with CSOAI's own figures and gives MEOK AI Labs its own line. Answer
 * engines read these files first, so they say the same thing: CSOAI's figures head the section,
 * MEOK AI Labs' figures sit on their own labelled line, joint and unattributed packages are in
 * neither, and the account total is named as neither entity's figure and is not printed.
 *
 * WHEN A FIGURE MAY BE PRINTED. The home page's rule (distributionRead there) without the clock.
 * The census must carry its schema and a usable max_age_hours, and both `totals` windows must be
 * readable and dated like the census. An entity is printed only when BOTH of its by_entity windows
 * are readable and dated like the census. Readable means state READ, PARTIAL or STALE, a
 * non-negative safe-integer value, and covered <= attempted. The home page also marks a census out
 * of date against the clock; these files print the artifact's as_of and stale_after instead,
 * because a generated file judged against the clock would turn `--check` red on wall-clock time
 * alone. A figure that fails is not printed, nothing is substituted for it, and the section says so.
 */
import { readFileSync } from "node:fs";

const SCHEMA = "csoai.distribution/0.1";
/**
 * The Hugging Face datasets our own services read (24 Nov 2026). Our Pages functions and jobs read
 * them, so their download counts include our reads; /api/momentum keeps them apart (hf_self_read) and
 * its rule says the two are never added. In the census of 23 Nov 2026 they were 298,200 of CSOAI's
 * 551,286 downloads in 30-day windows. The ids are client/src/data/hf-self-read-ids.json, which the
 * home page reads too and its test holds equal to SELF_READ_DATASETS in functions/api/_momentum.ts.
 */
const SELF_READ = new Set(JSON.parse(readFileSync(new URL("../client/src/data/hf-self-read-ids.json", import.meta.url), "utf8")));
// The home page's ceiling on the census's own max_age_hours (HomeDistribution.tsx MAX_AGE_HOURS).
const MAX_AGE_HOURS = 48;
const fmtN = (n) => Number(n).toLocaleString("en-US");

/** A count row as the home page reads it, or null when it is not readable. */
function count(row) {
  if (!row || typeof row !== "object") return null;
  if (row.state !== "READ" && row.state !== "PARTIAL" && row.state !== "STALE") return null;
  if (typeof row.value !== "number" || !Number.isSafeInteger(row.value) || row.value < 0) return null;
  if (!Number.isSafeInteger(row.covered) || !Number.isSafeInteger(row.attempted)) return null;
  if (row.covered < 0 || row.covered > row.attempted) return null;
  if (typeof row.as_of !== "string" || !Number.isFinite(Date.parse(row.as_of))) return null;
  return row;
}

/** One entity's two windows from by_entity, or null unless both are readable and dated like the census. */
function entityWindows(d, name, asOf) {
  const lifetime = count(d.by_entity?.downloads_all_time?.[name]);
  const recent = count(d.by_entity?.downloads_30d?.[name]);
  return lifetime && recent && lifetime.as_of === asOf && recent.as_of === asOf ? { lifetime, recent } : null;
}

const isCount = (v) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

/** scripts/distribution-measure.py by_entity() over a subset of one entity's rows: the same state rule. */
function rollUp(rows, field, asOf) {
  const counted = rows.filter((p) => isCount(p[field]));
  if (!counted.length) return null;
  return {
    state: counted.length === rows.length ? "READ" : "PARTIAL",
    value: counted.reduce((sum, p) => sum + p[field], 0),
    covered: counted.length,
    attempted: rows.length,
    as_of: asOf,
  };
}

/**
 * CSOAI's rows split into the datasets our own services read and the rest, as the home page and
 * /api/footprint split them. Both parts must add back up to by_entity's CSOAI pair in value, covered
 * and attempted, in both windows, or this returns null and no CSOAI figure is printed.
 */
function withoutSelfReads(d, csoai, asOf) {
  const rows = (Array.isArray(d.packages) ? d.packages : []).filter((p) => p && p.entity === "csoai");
  const isSelf = (p) => p.registry === "huggingface" && typeof p.name === "string" && SELF_READ.has(p.name);
  const own = rows.filter(isSelf);
  const rest = rows.filter((p) => !isSelf(p));
  const split = (field, whole) => {
    const others = rollUp(rest, field, asOf);
    const selfRead = own.length ? rollUp(own, field, asOf) : null;
    if (!others || (own.length > 0 && !selfRead)) return null;
    const s = selfRead ?? { value: 0, covered: 0, attempted: 0 };
    const adds = others.value + s.value === whole.value && others.covered + s.covered === whole.covered && others.attempted + s.attempted === whole.attempted;
    return adds ? { others, selfRead } : null;
  };
  const lifetime = split("downloads_all_time", csoai.lifetime);
  const recent = split("downloads_30d", csoai.recent);
  if (!lifetime || !recent) return null;
  return {
    csoai: { lifetime: lifetime.others, recent: recent.others },
    selfRead: lifetime.selfRead && recent.selfRead ? { lifetime: lifetime.selfRead, recent: recent.selfRead } : null,
    datasets: own.length,
  };
}

/**
 * The census as the home page reads it, without the clock: { asOf, csoai, selfRead, selfReadDatasets,
 * meok } where csoai is CSOAI's pair without the datasets our own services read, selfRead those
 * datasets' pair (null if the census has none) and meok may be null; or { reason } when no figure may
 * be printed from it.
 */
export function distributionRead(d) {
  if (d?.schema !== SCHEMA) return { reason: `its schema is not ${SCHEMA}` };
  const lifetime = count(d.totals?.downloads_all_time);
  const recent = count(d.totals?.downloads_30d);
  if (!lifetime || !recent || lifetime.as_of !== recent.as_of || d.as_of !== lifetime.as_of) {
    return { reason: "its two windows are not both readable and dated like the census" };
  }
  const age = d.max_age_hours;
  if (typeof age !== "number" || !Number.isFinite(age) || age <= 0 || age > MAX_AGE_HOURS) {
    return { reason: `it declares no max_age_hours above 0 and at most ${MAX_AGE_HOURS}` };
  }
  const csoai = entityWindows(d, "csoai", d.as_of);
  if (!csoai) {
    return { reason: "by_entity carries no CSOAI pair that is readable in both windows and dated like the census" };
  }
  const parts = withoutSelfReads(d, csoai, d.as_of);
  if (!parts) {
    return { reason: "the census's CSOAI package rows do not add back up to by_entity's CSOAI pair, so the datasets our own services read cannot be taken out" };
  }
  return { asOf: d.as_of, csoai: parts.csoai, selfRead: parts.selfRead, selfReadDatasets: parts.datasets, meok: entityWindows(d, "meok", d.as_of) };
}

// "state READ, 212 of 212 counters answered", and a PARTIAL row says it is a lower bound.
const stated = (row) =>
  `state ${row.state}, ${fmtN(row.covered)} of ${fmtN(row.attempted)} counters answered` +
  (row.state === "PARTIAL" ? ", so it is a LOWER BOUND over those, never a total over all of them" : "");

// Every figure carries the artifact's own state, coverage and as_of.
//
// WHY EVERY LINE NAMES covered/attempted. A distribution figure was once published here that was a
// partial read presented as the whole estate: a total with no denominator beside it, and nothing in
// the bytes said which counters had answered. The artifact records that (state READ | PARTIAL |
// UNCHECKABLE | UNMEASURED, with covered and attempted on the row), so the only job here is to
// refuse to print the value without them. A counter that returned nothing is named on its own line
// and its value stays null — never 0, never quietly folded into a figure.
export function distributionSection(d) {
  const pkgs = Array.isArray(d?.packages) ? d.packages : [];
  if (!pkgs.length) throw new Error("distribution-latest.json carries no packages[] — absent is not zero");
  const by = {};
  for (const r of pkgs) by[r.registry] = (by[r.registry] || 0) + 1;
  const perReg = Object.keys(by).sort().map((k) => `${k} ${fmtN(by[k])}`).join(" · ");
  const windowOf = (key) => (typeof d.totals?.[key]?.window === "string" ? ` Window: ${d.totals[key].window}.` : "");
  const read = distributionRead(d);
  const figures = read.reason
    ? `- No download figure is printed from this census: ${read.reason}. Nothing is substituted for it; read the artifact live.`
    : [
        `- CSOAI packages${read.selfRead ? `, without the ${read.selfReadDatasets} datasets our own services read` : ""}, since first release (cumulative): ${fmtN(read.csoai.lifetime.value)} gross downloads — ${stated(read.csoai.lifetime)}.${windowOf("downloads_all_time")} as_of ${read.asOf}.`,
        `- CSOAI packages${read.selfRead ? `, without the ${read.selfReadDatasets} datasets our own services read` : ""}, in the last 30 days: ${fmtN(read.csoai.recent.value)} gross downloads — ${stated(read.csoai.recent)}.${windowOf("downloads_30d")} as_of ${read.asOf}.`,
        ...(read.selfRead
          ? [`- The ${read.selfReadDatasets} Hugging Face datasets our own services read are counted on their own and never added to CSOAI's figures, because our reads are inside their counts (/api/momentum keeps them apart too): ${fmtN(read.selfRead.lifetime.value)} gross downloads since first release — ${stated(read.selfRead.lifetime)}; ${fmtN(read.selfRead.recent.value)} in the last 30 days — ${stated(read.selfRead.recent)}. as_of ${read.asOf}.`]
          : []),
        read.meok
          ? `- MEOK AI Labs, a separate entity publishing from the same account, is counted on its own and never added to CSOAI's figures: ${fmtN(read.meok.lifetime.value)} gross downloads since first release — ${stated(read.meok.lifetime)}; ${fmtN(read.meok.recent.value)} in the last 30 days — ${stated(read.meok.recent)}. as_of ${read.asOf}.`
          : "- MEOK AI Labs' figures are not printed: by_entity carries no MEOK AI Labs pair that is readable in both windows and dated like the census. Nothing is substituted for them.",
      ].join("\n");
  const silent = pkgs.filter((r) => r.downloads_30d === null || r.downloads_all_time === null);
  const silentLines = silent.length
    ? silent.map((r) => `- Counter that did not answer, named rather than absorbed: ${r.registry} \`${r.name}\`${typeof r.entity === "string" ? ` (labelled ${r.entity})` : ""} — ${r.reason ?? "no reason recorded"}. Its value is null, never 0.`).join("\n")
    : "- Every counter answered on this run; nothing is a lower bound for want of a reply.";
  // The home page calls the census out of date after its freshness window. This file states the
  // artifact's own stale_after instead of consulting a clock, so a reader can make the same call.
  const staleLine = typeof d.stale_after === "string" && Number.isFinite(Date.parse(d.stale_after))
    ? `\nThe census declares itself out of date after ${d.stale_after} (stale_after); past that time, read it live before quoting any figure.`
    : "";
  const cc = d.registries?.pypi?.cross_check;
  const ccLine = cc && cc.pepy_over_pypistats_median
    ? `- Two third-party counters over the same PyPI packages DISAGREE: on ${cc.samples_compared} sampled packages ${cc.source_url.split("/")[2]} read about ${cc.pepy_over_pypistats_median}x lower than the source published above. That divergence is recorded, not resolved by picking one, and the LARGER of the two is what is published — which is exactly why it is labelled gross. Quote this ratio beside the number.`
    : "";
  // No heading here: llms.txt and llms-full.txt number their sections differently, so each
  // template supplies the heading and this returns the body both of them share.
  return `Derived at generation from https://councilof.ai/interop/distribution-latest.json (same bytes on
disk at public/interop/distribution-latest.json, schema ${d.schema}, artifact as_of ${d.as_of}).
Re-read it live; do not quote these figures without the state and coverage beside them.${staleLine}

CSOAI Ltd and MEOK AI Labs are separate entities publishing from one account, and the census labels
every package with its entity. They are two figures and are never added: quote each under its own label.
CSOAI's figures leave out the Hugging Face datasets our own services read, which are summed apart; both
come from the artifact's package rows and add back up to its \`by_entity\` CSOAI pair. MEOK AI Labs'
figures are its \`by_entity\` values.

${figures}
- Packages labelled joint or unattributed are in neither figure. The artifact's \`totals\` counts every
  row of the account, joint and unattributed included, so it is neither entity's figure and is not
  printed here.
- Packages in the census, across three registries: ${fmtN(pkgs.length)} (${perReg}), each row labelled with
  its entity. Three registries are three populations: the download counts of different registries
  are reported per registry on the artifact, and the figures above are the artifact's own
  package rows and \`by_entity\` values, not an arithmetic of this line.
- The 30-day and cumulative figures are different WINDOWS over the same packages. They are never
  added to each other, and neither is a count of people: mirrors, CI and crawlers are inside both.
${silentLines}${ccLine ? "\n" + ccLine : ""}
- A download is distribution. It is not adoption, not a user, not a customer, and not a measurement.
  Reach says how far the board travels; authority stays GET /api/gspc, the signed cards and free verify.
`;
}
