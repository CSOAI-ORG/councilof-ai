/**
 * art50Law — the legal facts the Article 50 marking-evidence pack quotes BESIDE the measurement.
 *
 * Nothing here is interpreted. The pack carries (a) the verbatim Article 50(2) text and its
 * SHA-256, so a reader can check the quoted words against EUR-Lex themselves; (b) the dates the
 * obligation turns on; (c) the Article 99(4) fine ceiling. The measurement never says whether the
 * obligation is met — that is a legal conclusion the pack is not allowed to draw.
 *
 * Verbatim source: Regulation (EU) 2024/1689 (the AI Act), OJ L, 2024/1689, 12.7.2024, Article
 * 50(2). EUR-Lex refused an automated fetch from the build runtime on 2026-09-02; the text below
 * was checked word-for-word against the artificialintelligenceact.eu mirror of the OJ text the
 * same day. The sha256 is recomputed at runtime over exactly these bytes.
 */

export const ART50_2_TEXT =
  "Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or " +
  "text content, shall ensure that the outputs of the AI system are marked in a machine-readable format and " +
  "detectable as artificially generated or manipulated. Providers shall ensure their technical solutions are " +
  "effective, interoperable, robust and reliable as far as this is technically feasible, taking into account the " +
  "specificities and limitations of various types of content, the costs of implementation and the generally " +
  "acknowledged state of the art, as may be reflected in relevant technical standards. This obligation shall not " +
  "apply to the extent the AI systems perform an assistive function for standard editing or do not substantially " +
  "alter the input data provided by the deployer or the semantics thereof, or where authorised by law to detect, " +
  "prevent, investigate or prosecute criminal offences.";

export const ART50_SOURCES = {
  /** ELI permalink for the Regulation (EN). */
  eur_lex: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
  /** CELEX view of the same text. */
  celex: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
  /** Commission Q&A on the AI Act (the grace-period statement the owner brief cites). */
  commission_faq: "https://digital-strategy.ec.europa.eu/en/faqs/artificial-intelligence-act-questions-and-answers",
} as const;

export const ART50_DATES = {
  /** Article 113: the Regulation applies from 2 August 2026; Article 50 carries no earlier or later carve-out. */
  applies_from: "2026-08-02",
  applies_from_basis: "Article 113, Regulation (EU) 2024/1689",
  /** Owner brief, citing the Commission FAQ: systems already on the market before 2 Aug 2026 — to 2 Dec 2026. */
  pre_existing_systems_until: "2026-12-02",
  pre_existing_basis: "Commission FAQ on the AI Act (as cited in the owner brief; the FAQ page is script-rendered and was not re-read by this build)",
} as const;

export const ART99_4 = {
  article: "Article 99(4)(g), Regulation (EU) 2024/1689",
  ceiling_eur: 15_000_000,
  ceiling_turnover_pct: 3,
  /** The operative words, verbatim from Article 99(4) and its point (g). */
  text:
    "shall be subject to administrative fines of up to EUR 15 000 000 or, if the offender is an undertaking, up to 3 % " +
    "of its total worldwide annual turnover for the preceding financial year, whichever is higher: … (g) transparency " +
    "obligations for providers and deployers pursuant to Article 50.",
} as const;

const hex = (b: ArrayBuffer): string => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

/** SHA-256 over the UTF-8 bytes of ART50_2_TEXT — what the signed payload carries instead of the prose. */
export async function art50TextSha256(): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ART50_2_TEXT)));
}

/** The block the pack returns beside the card (outside the ≤3KB payload, so the prose can be verbatim). */
export async function art50LawBlock(): Promise<Record<string, unknown>> {
  return {
    article: "Article 50(2), Regulation (EU) 2024/1689",
    text: ART50_2_TEXT,
    text_sha256: await art50TextSha256(),
    sources: ART50_SOURCES,
    dates: ART50_DATES,
    fine_ceiling: ART99_4,
    reading:
      "Quoted for the reader's own reading. The measurement beside it records whether a machine-readable mark was " +
      "DETECTED by the named methods at the stated time. It draws no conclusion about whether the obligation is met.",
  };
}
