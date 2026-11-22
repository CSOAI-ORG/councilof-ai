/** Read-only view of the existing Article 53 evidence-bundle preview. No payment path. */
const ORIGIN = "https://councilof.ai";
const ROUTE = "/api/evidence-bundle";
export const PREVIEW_BYTE_LIMIT = 131072;

export type EvidencePreview = {
  subject: string;
  count: number;
  corpusDate: string | null;
  counselConfirmed: boolean | null;
  reviewNote: string | null;
  termsPath: string;
  cards: { sha256: string; subject: string; path: string; asOf: string | null }[];
  availableSubjects: string[];
};

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_PREVIEW");
  return value as Record<string, unknown>;
}
function requireValue(ok: boolean): asserts ok {
  if (!ok) throw new Error("INVALID_PREVIEW");
}
function dateOrUnknown(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 19) === value.slice(0, 19) ? value : null;
}
export function normaliseGpaiSubject(value: string): string | null {
  const subject = value.trim();
  return subject.length <= 120 && !/[\u0000-\u001f\u007f]/.test(subject) ? subject : null;
}
export function gpaiPreviewPath(subject: string): string {
  const normalized = normaliseGpaiSubject(subject);
  if (normalized === null) throw new Error("INVALID_SUBJECT");
  const query = new URLSearchParams({ obligation: "article-53" });
  if (normalized) query.set("subject", normalized);
  return `${ROUTE}?${query}`;
}

/** Never let a response turn the next step into another origin, obligation or subject. */
function scopedTermsPath(value: unknown, subject: string): string {
  requireValue(typeof value === "string");
  const url = new URL(value, ORIGIN);
  requireValue(url.origin === ORIGIN && url.pathname === ROUTE && !url.username && !url.password && !url.hash);
  const entries = [...url.searchParams];
  requireValue(entries.every(([key]) => ["obligation", "bundle", "subject"].includes(key)));
  requireValue(new Set(entries.map(([key]) => key)).size === entries.length);
  requireValue(url.searchParams.get("obligation") === "article-53" && url.searchParams.get("bundle") === "1");
  requireValue((url.searchParams.get("subject") ?? "") === subject);
  return url.pathname + url.search;
}

export function parseGpaiPreview(input: unknown, requestedSubject: string): EvidencePreview {
  const normalized = normaliseGpaiSubject(requestedSubject);
  requireValue(normalized !== null);
  const data = object(input);
  requireValue(data.schema === "csoai.evidence-bundle/0.1" && data.kind === "preview" && !data.error);
  requireValue(data.status !== "UNCHECKABLE");
  requireValue(data.subject === (normalized || null));
  const obligation = object(data.obligation);
  requireValue(obligation.id === "article-53");
  const corpus = object(data.corpus);
  requireValue(corpus.read_state !== "UNCHECKABLE");
  const count = data.relevant_signed_cards;
  const total = corpus.signed_cards_total;
  requireValue(typeof count === "number" && Number.isSafeInteger(count) && count >= 0);
  requireValue(typeof total === "number" && Number.isSafeInteger(total) && total >= count);
  requireValue(Array.isArray(data.cards) && data.cards.length === Math.min(count, 40));
  const seen = new Set<string>();
  const cards = data.cards.map((value) => {
    const card = object(value);
    requireValue(typeof card.sha256 === "string" && /^[a-f0-9]{64}$/.test(card.sha256) && !seen.has(card.sha256));
    seen.add(card.sha256);
    requireValue(typeof card.subject === "string" && card.subject.length <= 1000);
    requireValue(typeof card.url === "string");
    const url = new URL(card.url, ORIGIN);
    requireValue(url.origin === ORIGIN && !url.username && !url.password && !url.search && !url.hash
      && url.pathname === `/cards/${card.sha256.slice(0, 16)}.json`);
    return { sha256: card.sha256, subject: card.subject, path: url.pathname, asOf: dateOrUnknown(card.as_of) };
  });
  const availableSubjects = Array.isArray(data.available_subjects)
    ? [...new Set(data.available_subjects.filter((x): x is string => typeof x === "string" && !!x.trim() && normaliseGpaiSubject(x) !== null).map(x => x.trim()))].slice(0, 20)
    : [];
  return {
    subject: normalized, count, corpusDate: dateOrUnknown(corpus.as_of),
    counselConfirmed: typeof obligation.counsel_confirmed === "boolean" ? obligation.counsel_confirmed : null,
    reviewNote: typeof obligation.review_note === "string" && obligation.review_note.length <= 2000 ? obligation.review_note : null,
    termsPath: scopedTermsPath(object(data.buy).resource, normalized), cards, availableSubjects,
  };
}

/** One same-origin GET, no credentials, redirects, retry, purchase or model invocation. */
export async function loadGpaiPreview(subject: string, signal: AbortSignal): Promise<EvidencePreview> {
  const response = await fetch(gpaiPreviewPath(subject), {
    method: "GET", credentials: "omit", cache: "no-store", redirect: "error",
    headers: { accept: "application/json" }, signal,
  });
  if (!response.ok || !/\bapplication\/(?:[\w.+-]+\+)?json\b/i.test(response.headers.get("content-type") ?? "")) {
    await response.body?.cancel();
    throw new Error("PREVIEW_UNAVAILABLE");
  }
  const declaredSize = response.headers.get("content-length");
  if (declaredSize && (!/^\d+$/.test(declaredSize) || Number(declaredSize) > PREVIEW_BYTE_LIMIT)) {
    await response.body?.cancel();
    throw new Error("PREVIEW_TOO_LARGE");
  }
  if (!response.body) throw new Error("PREVIEW_UNAVAILABLE");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0, text = "";
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > PREVIEW_BYTE_LIMIT) throw new Error("PREVIEW_TOO_LARGE");
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    return parseGpaiPreview(JSON.parse(text), subject);
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
}
