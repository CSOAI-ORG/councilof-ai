#!/usr/bin/env node
// build-model-lifecycle.mjs: upstream availability of a model family, joined to the measurement
// this estate holds for it.
//
// WHY THIS EXISTS (4 Nov 2026). The estate publishes measurements of models by identifier.
// `MiniMaxAI/MiniMax-M2.7` appears in public/interop/models-measured.json with 5 signed cards on
// 5 axes — a real, quotable measurement. What it did NOT say is that the vendor lists that family
// under "Retired Models" on its own model list (read 2026-11-03), and that the two families still
// open to pay-as-you-go callers stop on 2026-11-18. A reader holding that measurement had no way
// to learn it, because availability was published on the vendor's site and measurement was
// published here, and the two were never joined.
//
// So this joins them, and only them:
//   A. The vendor's own dated statement — public/interop/model-lifecycle-upstream.json. Committed
//      bytes, read on a date, with the source URLs and the source's own last-modified stamp.
//   B. This estate's own signed measurement — public/interop/models-measured.json, produced by
//      scripts/build-models-measured.mjs from the signed card index and the signed mill cards.
//      Nothing here is typed: the card and axis counts are read from that file.
//
// WHAT THIS IS NOT. Not a measurement of upstream. Every upstream_status is the VENDOR's statement
// about its own surface, recorded as a reported record on a date — the same standing the
// enforcement corpus gives a regulator action (REPORTED, not MEASURED). Not a ranking, an
// endorsement, a certification, or a judgement of any model. Not a freshness claim: as_of is the
// date the vendor's pages were read and it never moves on its own.
//
// THE ZERO IS MEASURED. "no signed measurement" is an observed absence in this estate's corpus as
// at the corpus's own as_of. It is not an unmeasured cell defaulted to zero, and it is not a claim
// that the model cannot be measured — only that this estate holds no signed card for it yet.
//
// A FAMILY THAT HAS NOT BEEN RELEASED carries no number at all. MiniMax-M4 has no identifier, no
// release date and no entry in the vendor's model list or release notes; it is listed here as
// NOT_RELEASED so a reader can see it was considered, and it carries no measurement.
//
//   node scripts/build-model-lifecycle.mjs          write public/interop/model-lifecycle.json + the edge snapshot
//   node scripts/build-model-lifecycle.mjs --check  exit 1 if either committed file is stale
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UPSTREAM = join(ROOT, "public", "interop", "model-lifecycle-upstream.json");
const MEASURED = join(ROOT, "public", "interop", "models-measured.json");
const LATEST = join(ROOT, "public", "data", "v1", "latest.json");
const OUT = join(ROOT, "public", "interop", "model-lifecycle.json");
const SNAPSHOT = join(ROOT, "functions", "api", "_model-lifecycle-snapshot.ts");

/**
 * Does `id` name this family, on a token boundary?
 *
 * The boundary matters: "MiniMax-M2" must NOT match "MiniMaxAI/MiniMax-M2.7", or the retired
 * M2 family would inherit M2.7's five cards and the ledger would report a measurement that was
 * never made. A family token matches only when the character before it is not a word character
 * or dot, and the character after it is neither a digit nor a dot.
 */
function namesFamily(id, token) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^0-9A-Za-z.])${esc}([^0-9.]|$)`, "i").test(id);
}

function derive() {
  if (!existsSync(UPSTREAM)) {
    throw new Error(
      `build-model-lifecycle: ${UPSTREAM} is missing. The upstream read is a committed source; nothing is fetched.`,
    );
  }
  if (!existsSync(MEASURED)) {
    throw new Error(
      `build-model-lifecycle: ${MEASURED} is missing. Run node scripts/build-models-measured.mjs first — ` +
        `this file never types a card count, it reads it.`,
    );
  }

  const upstream = JSON.parse(readFileSync(UPSTREAM, "utf8"));
  const measured = JSON.parse(readFileSync(MEASURED, "utf8"));
  const latest = existsSync(LATEST) ? JSON.parse(readFileSync(LATEST, "utf8")) : null;
  const models = Array.isArray(measured.models) ? measured.models : [];

  const rows = upstream.families.map((f) => {
    const hits = models.filter((m) => namesFamily(String(m.id ?? ""), f.model));
    const estate =
      hits.length > 0
        ? {
            state: "MEASURED",
            rule: "a signed, quotable card for this family exists in this estate's signed card corpus",
            models: hits.map((m) => ({
              id: m.id,
              cards: m.cards ?? 0,
              axes: m.axes ?? 0,
              admission_receipt: m.admission_receipt === true,
              recorded_as: m.recorded_as ?? [],
            })),
            cards: hits.reduce((n, m) => n + (m.cards ?? 0), 0),
            axes: hits.reduce((n, m) => n + (m.axes ?? 0), 0),
          }
        : {
            state: "UNMEASURED",
            rule:
              "no signed, quotable card for this family in this estate's card corpus as at the corpus's own as_of — " +
              "an observed absence, not a zero and not a claim that the model cannot be measured",
            models: [],
            cards: 0,
            axes: 0,
          };

    return {
      model: f.model,
      kind: f.kind,
      released: f.released,
      release_date_precision: f.release_date_precision,
      upstream_status: f.upstream_status,
      upstream_source: f.source,
      release_source: f.release_source,
      ...(f.payg_access_ends ? { payg_access_ends: f.payg_access_ends } : {}),
      ...(f.note ? { note: f.note } : {}),
      estate,
    };
  });

  const measuredRows = rows.filter((r) => r.estate.state === "MEASURED");
  const retiredMeasured = measuredRows.filter((r) => r.upstream_status === "RETIRED");
  const availableMeasured = measuredRows.filter((r) => r.upstream_status === "AVAILABLE");
  const availableRows = rows.filter((r) => r.upstream_status === "AVAILABLE");
  const notReleased = rows.filter((r) => r.upstream_status === "NOT_RELEASED");

  const inputs = {
    upstream_sha256: createHash("sha256").update(readFileSync(UPSTREAM)).digest("hex"),
    models_measured_sha256: createHash("sha256").update(readFileSync(MEASURED)).digest("hex"),
    models_measured_inputs_sha256: measured.inputs_sha256 ?? null,
    // The measured corpus carries no as_of of its own — each signed card carries its own
    // measurement date. The data-v1 pointer names the snapshot version the corpus was cut from,
    // and that version carries the corpus's own as_of. If the pointer is absent, the date is
    // null and the note says so: a null here is an absent date, never a stale one.
    estate_measurement_as_of: latest?.as_of ?? null,
    estate_measurement_version: latest?.version ?? null,
    estate_measurement_as_of_note: latest?.as_of
      ? null
      : "the measurement corpus carries no as_of of its own and no data-v1 pointer was found; every signed card carries its own measurement date",
  };

  return {
    schema: "csoai.model-lifecycle/0.1",
    record_type: "reported-vendor-statement-with-our-measurement",
    title: "Upstream availability of the model families this estate measures",
    as_of: upstream.as_of,
    freshness: {
      upstream_read_on: upstream.as_of,
      sources_last_modified_at_source: upstream.sources?.map?.((s) => ({
        id: s.id,
        url: s.url,
        last_modified_at_source: s.last_modified_at_source ?? null,
      })) ?? [],
      estate_measurement_as_of: latest?.as_of ?? null,
      estate_measurement_version: latest?.version ?? null,
      rule:
        "as_of is the date the vendor's pages were read, carried by the corpus; it is never the time this request was served",
    },
    what: upstream.what,
    not_this: upstream.not_this,
    vendor: upstream.vendor,
    sources: upstream.sources,
    status_vocabulary: upstream.status_vocabulary,
    retirement_notice: upstream.retirement_notice ?? null,
    upstream_caveats: upstream.other_families_on_the_vendor_surface ?? null,
    estate_measurement: {
      source: "public/interop/models-measured.json",
      derived_by: "scripts/build-models-measured.mjs (signed card index + signed mill cards)",
      rule:
        "a family is MEASURED when this estate's signed card corpus carries a signed, quotable card naming it; " +
        "card and axis counts are read from that file and are never typed here",
      inputs,
    },
    coverage: {
      families_listed: rows.length,
      families_with_signed_measurement: measuredRows.length,
      measured_and_retired_upstream: retiredMeasured.length,
      measured_and_available_upstream: availableMeasured.length,
      available_families_without_measurement: availableRows.filter(
        (r) => r.estate.state !== "MEASURED",
      ).length,
      families_not_released: notReleased.length,
      zero_is_measured:
        "every count here is derived from the two committed corpora at their own as_of. A zero is an observed absence in those bytes, not an unmeasured cell defaulted to zero.",
    },
    rows,
    not_claimed: [
      "No model is ranked, scored, graded, certified or approved here. This is availability context joined to measurement.",
      "A family with no signed card is UNMEASURED. It is not a zero, not a failure and not a comparison.",
      "A family the vendor has not released carries no number at all, only NOT_RELEASED.",
      "Availability is the vendor's statement about its own API surface on the date read. It says nothing about how any model behaves.",
    ],
    verify_free: true,
    certification: false,
  };
}

function snapshotText(doc) {
  return (
    "// Generated by scripts/build-model-lifecycle.mjs — do not edit by hand.\n" +
    "// Zero-drift: matches public/interop/model-lifecycle.json at generation time.\n\n" +
    `export const MODEL_LIFECYCLE_SNAPSHOT = ${JSON.stringify(doc, null, 2)};\n`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const doc = derive();
  const text = JSON.stringify(doc, null, 1) + "\n";
  const snap = snapshotText(doc);
  if (process.argv.includes("--check")) {
    const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    const curSnap = existsSync(SNAPSHOT) ? readFileSync(SNAPSHOT, "utf8") : "";
    if (cur !== text || curSnap !== snap) {
      console.error(
        "build-model-lifecycle: the committed ledger or the edge snapshot is stale; run node scripts/build-model-lifecycle.mjs",
      );
      process.exit(1);
    }
    console.log("build-model-lifecycle: up to date");
  } else {
    writeFileSync(OUT, text);
    writeFileSync(SNAPSHOT, snap);
    const c = doc.coverage;
    console.log(
      `build-model-lifecycle: ${c.families_listed} families, ${c.families_with_signed_measurement} with a signed measurement, ` +
        `${c.measured_and_retired_upstream} of those retired upstream`,
    );
  }
}
