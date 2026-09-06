/**
 * /api/bank-complete — evidence-derived reader for the bank × chain × stablecoin census.
 * Data is embedded at build time (zero-drift with public/interop/bank-registry.json).
 */
import { BANK_REGISTRY_SNAPSHOT as d } from "./_bank-registry-snapshot";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

type Bank = { bank?: string; records?: number; statuses?: string[] };

/**
 * Recount the census rather than read its header, and split it by the ladder.
 *
 * total_banks and total_records were read straight off the snapshot header. A header
 * nobody recounts is the trust the header_agrees blocks elsewhere exist to withdraw.
 *
 * The larger gap was that `total_records: 4000` was published FLAT. Measured 2026-09-06:
 * 21 of the 26 banks carry status UNCHECKABLE and 5 carry DISCOVERED — none is STAGED or
 * MEASURED — and 3,150 of those 4,000 records (78.8%) are attributed to banks the estate
 * itself says it could not check. A reader met 4000 with no way to learn that. The ladder
 * DISCOVERED -> STAGED -> MEASURED is now countable, in banks AND in records, so movement
 * up it is visible instead of hidden inside one total.
 */
export function deriveBankCounts(banks: Bank[]) {
  const bankCount: Record<string, number> = {};
  const recordCount: Record<string, number> = {};
  let records = 0;
  for (const b of banks) {
    const n = typeof b.records === "number" ? b.records : 0;
    records += n;
    const sts = Array.isArray(b.statuses) && b.statuses.length ? b.statuses : ["UNSTATED"];
    for (const s of sts) {
      const k = String(s).toUpperCase();
      bankCount[k] = (bankCount[k] ?? 0) + 1;
      recordCount[k] = (recordCount[k] ?? 0) + n;
    }
  }
  const uncheckable = recordCount.UNCHECKABLE ?? 0;
  return {
    producer: "functions/api/bank-complete.ts → deriveBankCounts(banks[])",
    total_banks: banks.length,
    total_records: records,
    banks_by_status: bankCount,
    records_by_status: recordCount,
    records_behind_uncheckable: uncheckable,
    records_behind_uncheckable_pct: records ? Math.round((uncheckable / records) * 1000) / 10 : 0,
    banks_staged_or_measured: (bankCount.STAGED ?? 0) + (bankCount.MEASURED ?? 0),
  };
}

export const onRequestGet: PagesFunction = async () => {
  const c = deriveBankCounts((d.banks ?? []) as Bank[]);
  return json({
    schema: "csoai.bank-complete/0.2",
    status: "READER",
    writes_board: false,
    // Recounted from banks[], never read off the header.
    total_banks: c.total_banks,
    total_records: c.total_records,
    counts_producer: c.producer,
    banks_by_status: c.banks_by_status,
    records_by_status: c.records_by_status,
    ladder: {
      order: ["UNCHECKABLE", "DISCOVERED", "STAGED", "MEASURED"],
      banks_staged_or_measured: c.banks_staged_or_measured,
      records_behind_uncheckable: c.records_behind_uncheckable,
      records_behind_uncheckable_pct: c.records_behind_uncheckable_pct,
      note:
        "total_records counts rows on the registry tape, not measurements. A record " +
        "attributed to a bank whose status is UNCHECKABLE is not evidence about that bank. " +
        "These counts move when a bank moves up the ladder; the total alone never showed that.",
    },
    header_agrees: {
      producer: "functions/api/bank-complete.ts → snapshot header vs banks[] recounted here",
      header: { total_banks: d.total_banks, total_records: d.total_records },
      agrees: d.total_banks === c.total_banks && d.total_records === c.total_records,
      note: "If agrees is false the snapshot is internally inconsistent and neither set is quotable.",
    },
    recomputability:
      "Fetch this endpoint, sum banks[].records and tally banks[].statuses, and you get " +
      "total_records, banks_by_status and records_by_status exactly. Nothing here is typed.",
    banks: d.banks,
    verify: "https://councilof.ai/gspc-verify",
    honesty: "Measurement, not certification. Verification is free forever.",
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204 });
};
