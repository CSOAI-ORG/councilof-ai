/**
 * ProvBench C2PA manifest-survival figures: the SIGNED run, and nothing else.
 *
 * Source of truth: public/packs/eu-article-50/provbench.json, Ed25519-signed over
 * provbench.body with the key in provbench.sig.json (verify offline with
 * `python3 sign.py --verify provbench.json`). client/src/lib/provbenchFigures.test.ts
 * re-derives every value below from those bytes, verifies the signature, and scans the
 * site source for any other C2PA survival figure. Import from here; do not retype.
 *
 * Why this file exists (15 Sep 2026): the site stated one C2PA result three different ways.
 * Two of those figures came from EARLIER, UNSIGNED runs of 29–30 July 2026 that are not
 * published on this site. They are kept below, labelled with date and n, not deleted. The
 * signed run tested no watermark (its own caveat says so).
 */

export const PROVBENCH_SIGNED = {
  url: "/packs/eu-article-50/provbench.json",
  sigUrl: "/packs/eu-article-50/provbench.sig.json",
  generated: "2026-08-13T04:02:31Z",
  generatedLabel: "13 August 2026",
  nAssets: 12,
  /** transforms with measured cells, identity control excluded */
  transformsMeasured: 9,
  unmeasuredTransform: "format_convert_heic",
  /** embedded_only · binding_intact (every embedded check pools identically) */
  embedded: { survived: 0, cells: 108, assetsSurviving: 0 },
  /** sidecar_oracle · manifest_present: the disclosure comes back */
  sidecarDisclosure: { survived: 108, cells: 108 },
  /** sidecar_oracle · binding_intact: the binding never does */
  sidecarBinding: { survived: 0, cells: 108 },
  /** clustered at n=12 assets, percent */
  ciClusteredPct: [0, 24.25] as const,
  /** one-sided 95% Clopper-Pearson upper bound on per-asset survival, percent */
  cpUpperOneSidedPct: 22.09,
} as const;

const S = PROVBENCH_SIGNED;

/** One sentence, derived from the constants above. */
export const PROVBENCH_HEADLINE =
  `${S.embedded.assetsSurviving} of ${S.nAssets} marked assets kept an intact embedded C2PA manifest ` +
  `(${S.embedded.survived} of ${S.embedded.cells} measured cells)`;

export const PROVBENCH_INTERVAL =
  `clustered 95% interval ${S.ciClusteredPct[0]} to ${S.ciClusteredPct[1]}%, computed at n=${S.nAssets} assets; ` +
  `one-sided 95% Clopper–Pearson upper bound ${S.cpUpperOneSidedPct.toFixed(1)}%`;

/**
 * Earlier runs. Different experiments, so they are labelled with date and n rather than
 * deleted. Neither is signed and neither result file is served by councilof.ai, so neither
 * is a headline.
 */
export const PROVBENCH_EARLIER_RUNS = [
  {
    label: "Earlier unsigned 20-asset run",
    date: "29–30 July 2026",
    design: "20 marked assets, the same C2PA embedded and sidecar configurations, 180 measured cells",
    result: "0 of 20 assets survived (0 of 180 measured cells); one-sided 95% Clopper–Pearson upper bound 13.9%",
    status: "unsigned; its result file is not published on councilof.ai",
  },
  {
    label: "Earlier unsigned preprint run",
    date: "30 July 2026",
    design: "15 assets × 7 transforms = 105 cells, mixed binding types including a soft watermark",
    result: "the preprint reports 18 of 105 cells surviving (17.14%)",
    status: "unsigned; its per-cell data is not published on councilof.ai, so the figure cannot be re-derived here",
  },
] as const;
