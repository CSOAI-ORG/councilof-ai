/**
 * art50Law — the legal facts the Article 50 marking-evidence pack quotes BESIDE the measurement.
 *
 * Nothing here is interpreted. The pack carries (a) the verbatim Article 50(2) text and its
 * SHA-256, so a reader can check the quoted words against EUR-Lex themselves; (b) the dates the
 * obligation turns on, each with its verbatim basis. The measurement never says whether the
 * obligation is met — that is a legal conclusion the pack is not allowed to draw.
 *
 * NO FINE CEILING (2026-09-30). The pack used to quote the Article 99(4) ceiling beside every
 * detection result. Dropped from delivered records: a penalty figure next to a "not detected"
 * reads as pressure, which a measurement has no business applying; and the single figure was
 * incomplete — Art 99(6) (SMEs) and Art 99(6a) (SMCs, inserted by Reg (EU) 2026/1744 Art 1(38)(c))
 * make the ceiling "whichever is lower" for most readers. Penalties are for the reader's counsel.
 *
 * Verbatim sources, both read from the Publications Office cellar (the OJ XHTML) on 2026-09-30:
 *   - Reg (EU) 2024/1689, OJ L 12.7.2024 — cellar dc8116a1-3fe6-11ef-865a-01aa75ed71a1.0006.03/DOC_1,
 *     sha256 8f0b656302f9864cc87e040c371f209a9d65ae1a6cecc25ca5eb737e872d721a. ART50_2_TEXT below
 *     occurs verbatim in those bytes (first checked 2026-09-02 against the artificialintelligenceact.eu
 *     mirror, when EUR-Lex refused an automated fetch). 2026/1744 does not amend Article 50(2).
 *   - Reg (EU) 2026/1744, OJ L 24.7.2026 — cellar b459c07f-86fb-11f1-bf5e-01aa75ed71a1.0006.03/DOC_1,
 *     sha256 9d754652b867722807e4219c85912ce354233e58a1b4eb8c7752b4d1922993db. ART111_4_TEXT below
 *     occurs verbatim in those bytes (Art 1(39)(b)). In force 27 July 2026 (its Art 4: the third day
 *     following publication).
 * The sha256 the pack carries is recomputed at runtime over exactly the ART50_2_TEXT bytes.
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
  /** ELI permalink for Regulation (EU) 2026/1744, which added Article 111(4) (the 2 December 2026 date). */
  eur_lex_2026_1744: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng",
} as const;

/** Article 111(4) of Reg (EU) 2024/1689, added by Reg (EU) 2026/1744 Art 1(39)(b), verbatim. */
export const ART111_4_TEXT =
  "Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or " +
  "text content, that have been placed on the market before 2 August 2026 shall take the necessary steps in " +
  "order to comply with Article 50(2) by 2 December 2026.";

export const ART50_DATES = {
  /** Article 113: the Regulation applies from 2 August 2026; 2026/1744 amends Art 113 but does not move Article 50. */
  applies_from: "2026-08-02",
  applies_from_basis: "Article 113, Regulation (EU) 2024/1689",
  /** Only for systems placed on the market before 2 August 2026 — the text carries the scope; the pack applies it to no one. */
  pre_existing_systems_until: "2026-12-02",
  pre_existing_basis:
    "Article 111(4), Regulation (EU) 2024/1689, as added by Regulation (EU) 2026/1744 Article 1(39)(b) " +
    "(OJ L, 24.7.2026; in force 27 July 2026)",
  pre_existing_text: ART111_4_TEXT,
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
    reading:
      "Quoted for the reader's own reading. The measurement beside it records whether a machine-readable mark was " +
      "DETECTED by the named methods at the stated time. It draws no conclusion about whether the obligation is met.",
  };
}
