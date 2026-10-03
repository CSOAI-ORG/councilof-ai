// functions/api/_gspc_cite.ts — GET /api/gspc?format=cite (and /api/gspc/axis/:axis?format=cite).
//
// A citation a reader can check with two commands, no DOI and no GitHub needed:
//
//   curl -s '<origin>/api/gspc?axis=governance&format=cite' | jq -r .sha256
//   curl -s "$(… | jq -r .url)" | shasum -a 256          # the same hex
//
// The hash is over the EXACT bytes that `url` serves: the handler asks the board for those
// bytes in-process (through the same edge-cache key the url resolves to) and hashes what it
// got back, so nothing here is typed and nothing is re-serialised. Every count in the block
// (public_count, measured_on, the signature id) is copied verbatim from those bytes.
//
// What the hash does NOT establish: that the numbers are good, or that the board will serve
// the same bytes tomorrow. The board is re-served on every deploy; when it changes, a later
// fetch no longer matches and the citation names a state that is no longer served. The block
// says so, and tells the reader to keep a copy of the bytes.
//
// Doctrine: measurement, not certification. No grade, rank or score is produced here.

export const CITE_SCHEMA = "csoai.gspc-cite/0.1";

export interface CiteInput {
  /** The exact response bytes of the cited url. */
  bytes: Uint8Array;
  /** The sha256 hex of `bytes`. */
  sha256: string;
  /** The public url that serves `bytes` (the axis alias, or /api/gspc for the whole board). */
  url: string;
  axis: string | null;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer);
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** The public url a cite block names. /api/gspc/axis/:axis is an alias of /api/gspc?axis=:axis. */
export function citeUrl(origin: string, axis: string | null): string {
  return axis ? `${origin}/api/gspc/axis/${encodeURIComponent(axis)}` : `${origin}/api/gspc`;
}

export function buildCite(input: CiteInput): Record<string, unknown> {
  let d: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(new TextDecoder().decode(input.bytes));
    if (parsed && typeof parsed === "object") d = parsed as Record<string, unknown>;
  } catch {
    /* fields below then read as absent; the hash still stands */
  }
  const totals = (d.totals ?? {}) as Record<string, unknown>;
  const measuredOn = (d.measured_on ?? {}) as Record<string, unknown>;
  const att = (d.site_attestation ?? {}) as Record<string, unknown>;
  const sig = str(att.sig);
  const signer = str(att.signer);
  const publicCount = str(totals.public_count);
  const asOf = str(measuredOn.date);
  const doi = str(d.doi);
  const doiStatus = str(d.doi_status);
  const signatureId = sig && signer ? `${signer} sig:${sig.slice(0, 16)}` : null;

  const lines = [
    `Council of AI (CSOAI Ltd). GSPC board${input.axis ? `, axis "${input.axis}"` : ""} [dataset].`,
    `URL: ${input.url}`,
    `sha256: ${input.sha256} (${input.bytes.byteLength} bytes)`,
    `public_count: ${publicCount ?? "absent from the payload"}`,
    `measured_on: ${asOf ?? "absent from the payload"}`,
    `site_attestation: ${signatureId ?? "absent — this payload carries no site signature"}`,
    "Measurement, not certification.",
  ];

  return {
    schema: CITE_SCHEMA,
    grammar: "measurement, not certification",
    url: input.url,
    sha256: input.sha256,
    bytes: input.bytes.byteLength,
    content_type: "application/json; charset=utf-8",
    axis: input.axis,
    public_count: publicCount,
    separation_public_count: str(totals.separation_public_count),
    measured_on: asOf,
    site_attestation: sig
      ? { state: "SIGNED", signer, alg: str(att.alg), sig, signature_id: signatureId }
      : { state: "ABSENT", reason: str(att.error) ?? "the cited payload carries no site_attestation.sig" },
    methodology_doi: doi
      ? {
          doi,
          status: doiStatus ?? "not stated by the board",
          note: doiStatus === "UNAVAILABLE"
            ? "Kept as an identifier. It does not currently resolve, so it is not a way to read the record; cite the url and sha256 above."
            : "The methodology record the board names; it is not the live numbers.",
        }
      : null,
    check: `curl -s '${input.url}' | shasum -a 256`,
    check_note:
      "The sha256 is over the exact bytes the url serves for the current deploy, copied from them " +
      "in-process, never typed. The board is re-served on every deploy: when it changes, a later " +
      "fetch no longer matches and this citation names a state that is no longer served. Keep a " +
      "copy of the bytes if you need to show them later. A matching hash establishes that you hold " +
      "the bytes that were cited; it does not establish that the numbers are good.",
    text: lines.join("\n"),
  };
}
