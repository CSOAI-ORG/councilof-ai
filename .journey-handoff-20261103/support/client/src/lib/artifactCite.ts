// A per-artifact citation built from the repository's own CITATION.cff (title, authors, url) plus
// the exact record a reader loaded (URL, sha256, byte length) and the access date. Nothing is typed
// here that CITATION.cff or the record does not already say. Measurement, not certification.
import CFF from "../../../CITATION.cff?raw";

const field = (src: string, key: string): string | undefined =>
  src.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?\\s*$`, "m"))?.[1]?.trim();

export function cffBasics(src: string = CFF): { title?: string; author?: string; url?: string } {
  const author = src.match(/^authors:\s*\n\s*-\s*name:\s*"?([^"\n]+)"?/m)?.[1]?.trim();
  return { title: field(src, "title"), author, url: field(src, "url") };
}

export function artifactCitation(
  rec: { href: string; sha256?: string; bytes?: number },
  accessed: Date,
  src: string = CFF,
): string {
  const { title, author, url } = cffBasics(src);
  const day = accessed.toISOString().slice(0, 10);
  const hash = rec.sha256 ? `sha256 ${rec.sha256}` : "sha256 not computed in this browser";
  const size = typeof rec.bytes === "number" ? `, ${rec.bytes} bytes` : "";
  return `${author ?? "CSOAI Ltd"}. ${title ?? "Council of AI"}: signed record. ${rec.href} (${hash}${size}). ${url ?? "https://councilof.ai"}. Accessed ${day}. Measurement, not certification.`;
}
