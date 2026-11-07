/** Read-only projections. Topic mapping is not a legal control crosswalk. */
export const OBSERVATORY_VERSION = "2026-09-18.2";
export interface FrameworkLens { id: string; label: string; kind: string; axes: readonly string[]; source: string; note: string }
export const FRAMEWORK_LENSES: readonly FrameworkLens[] = [
  { id: "all", label: "All instruments", kind: "catalogue", axes: [], source: "/api/gspc", note: "Independent instruments remain separate; no overall safety score is calculated." },
  { id: "eu-ai-act", label: "EU AI Act — topic lens", kind: "legislation", axes: ["governance", "art5-safeguard", "affect", "provenance", "detector-interop", "cross-reality"], source: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai", note: "CSOAI topic selection, not an official crosswalk or a determination that a particular obligation applies." },
  { id: "nist-ai-rmf", label: "NIST AI RMF 1.0 — topic lens", kind: "voluntary framework", axes: ["governance", "safety", "care", "swarm", "cross-reality"], source: "https://airc.nist.gov/", note: "NIST publishes a voluntary risk framework. These relevant benchmarks are not NIST certification or complete GOVERN / MAP / MEASURE / MANAGE coverage." },
  { id: "gpai", label: "EU GPAI Code — topic lens", kind: "voluntary code", axes: ["governance", "safety", "openness", "provenance"], source: "https://digital-strategy.ec.europa.eu/en/policies/contents-code-gpai", note: "Code signatory notices are organisational disclosures, not evidence that all obligations are fulfilled. Systemic-risk applicability requires separate review." },
  { id: "care", label: "CARE and the Maternal Covenant", kind: "CSOAI principles", axes: ["care", "affect", "safety", "cross-reality"], source: "/maternal-covenant", note: "Measure protection, useful assistance, agency and proportionality. The philosophy is not an empirical guarantee of alignment." },
  { id: "machinery", label: "Humanoids and machinery — topic lens", kind: "physical-system context", axes: ["machinery-conformity", "humanoid-labour-index", "care", "cross-reality"], source: "/interop/humanoid-registry-unsigned.json", note: "Public deployment announcements do not establish physical safety, labour hours or conformity. Model, robot and deployment evidence must stay distinct." },
  { id: "financial", label: "Financial and infrastructure facts", kind: "disclosure instruments", axes: ["provenance-controls", "reserve-attestation", "regulatory-framework", "distribution-integrity", "custody-disclosure", "ai-adoption-components", "labour-components"], source: "/api/gspc", note: "These are separate fact instruments, not comparable model accuracies or investment ratings." },
];
export interface ObservatoryAxis { axis: string; bench?: string; status?: string; n?: number; n_unit?: string; kind?: string; family?: string }
export function selectAxes<T extends ObservatoryAxis>(axes: readonly T[], lensId: string, query = ""): T[] {
  const lens = FRAMEWORK_LENSES.find(l => l.id === lensId);
  if (!lens) return []; // An unknown filter must not silently widen scope.
  const q = query.trim().toLocaleLowerCase();
  return axes.filter(a => (lens.id === "all" || lens.axes.includes(a.axis)) &&
    `${a.axis} ${a.bench ?? ""}`.toLocaleLowerCase().includes(q));
}
export function safeSource(value: unknown): string | null {
  if (typeof value !== "string" || /[\\\u0000-\u0020\u007f]/u.test(value)) return null;
  if (/^\/(?!\/)/u.test(value)) return value;
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password ? u.href : null; }
  catch { return null; }
}
export type Freshness = "CURRENT_WINDOW" | "STALE" | "UNKNOWN" | "FUTURE_DATE";
export function freshness(date: unknown, now: number, maxAgeMs = 7 * 86400000): Freshness {
  if (typeof date !== "string" || !date || !Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) return "UNKNOWN";
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return "UNKNOWN";
  if (t > now) return "FUTURE_DATE";
  return now - t > maxAgeMs ? "STALE" : "CURRENT_WINDOW";
}
export interface LabCheck { id: string; label: string; state: "YES" | "PARTIAL" | "NO" | "UNCHECKABLE"; evidence: string; note: string }
export interface OrganisationEvidence { id: string; name: string; subject: string; kind: "gpai-notice" | "humanoid-deployment" | "lab-artifact"; labChecks?: LabCheck[]; artifacts?: string[]; disclosure: string; observedAt: string | null; source: string | null; receipt: string | null; qualification: string; measured: false }
const obj = (v: unknown): Record<string, any> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, any> : {};
const text = (v: unknown, fallback = ""): string => typeof v === "string" ? v : fallback;
/** Shape and schema checks prevent an HTML fallback or unrelated JSON becoming evidence. */
export function parseOrganisationEvidence(kind: OrganisationEvidence["kind"], value: unknown): OrganisationEvidence[] {
  const root = obj(value);
  if (kind === "lab-artifact") {
    if (root.schema !== "csoai.lab-card-census/0.1" || !Array.isArray(root.rows)) throw new Error("Unrecognised lab evidence schema");
    const seen = new Set<string>();
    const checkLabels: Record<string, string> = { signed: "Published-result signatures", content_addressed: "Publisher content addressing", bank_published: "Evaluation bank availability", corrections: "Correction record", recomputable: "Recomputability" };
    return root.rows.flatMap((raw: unknown): OrganisationEvidence[] => {
      const r = obj(raw), name = text(r.org).trim();
      if (!name || seen.has(name)) return [];
      seen.add(name);
      const labChecks = Object.entries(checkLabels).map(([id, label]): LabCheck => {
        const c = obj(r[id]);
        const state = ["YES", "PARTIAL", "NO", "UNCHECKABLE"].includes(c.state) ? c.state as LabCheck["state"] : "UNCHECKABLE";
        return { id, label, state, evidence: text(c.evidence), note: text(c.note) };
      });
      const artifacts = Array.isArray(r.artifacts_examined) ? r.artifacts_examined.map(safeSource).filter((u: string | null): u is string => u !== null) : [];
      return [{ id: `lab-artifact:${name}`, name, subject: "Published evaluation artefacts — verifiability census", kind, disclosure: "DATED CENSUS · NOT RE-VERIFIED ON THIS PAGE", observedAt: text(r.fetched) || text(root.as_of) || null, source: safeSource(r.url), receipt: "/interop/lab-card-census-2026-09-17.json", qualification: "These are the retained census author's scoped findings, not a new audit. They concern evidence verifiability, not organisational safety, research quality or legal compliance. Read each qualification and the census limitations.", measured: false, labChecks, artifacts }];
    });
  }
  const gpai = kind === "gpai-notice";
  if (root.schema !== (gpai ? "csoai.gpai-signatory-notice-index/0.1" : "csoai.humanoid-registry-unsigned/0.1")) throw new Error("Unrecognised evidence schema");
  const rows: unknown = gpai ? root.cards : root.rows;
  if (!Array.isArray(rows)) throw new Error("Missing evidence rows");
  const seen = new Set<string>();
  return rows.flatMap((raw): OrganisationEvidence[] => {
    const r = obj(raw), id = text(r.id), name = text(gpai ? r.provider : r.operator);
    if (!id || !name || seen.has(id)) return [];
    seen.add(id);
    const source = safeSource(gpai ? obj(root.primary_source).url : r.evidence_url);
    const receipt = gpai && /^[a-z0-9.-]+\.json$/u.test(text(r.path)) ? `/interop/gpai-signatory-2026-09/${r.path}` : null;
    return [{ id: `${kind}:${id}`, name, subject: gpai ? "GPAI Code public-list notice" : text(r.deployment_name), kind,
      disclosure: text(gpai ? r.appearance : r.status, "not recorded"),
      observedAt: text(gpai ? root.fetched_at : root.published_at) || null, source, receipt,
      qualification: gpai ? text(r.qualification, "List appearance only. No organisational safety or compliance assessment.") : "Source-stated deployment status. Not independently verified physical safety, labour hours or a measured index.",
      measured: false }];
  });
}
export interface TrustContext { subject: string; capability: string; context: string; revision: string }
export interface TrustEvent extends TrustContext { id: string; direction: "human-to-system" | "system-to-human"; outcome: "supported" | "contradicted" | "revoked"; observedAt: string; expiresAt: string; evidenceDigest: string; independentReview: boolean }
export interface TrustCup { supported: number; contradicted: number; revoked: number; excluded: number; state: "NO_ADMITTED_EVIDENCE" | "EVIDENCE_PRESENT" | "REVOKED" }
/** Prototype admission projection, NOT an authorisation mechanism or a global score of people. */
export function projectTrust(events: readonly TrustEvent[], target: TrustContext, now: number) {
  const cups: Record<TrustEvent["direction"], TrustCup> = {
    "human-to-system": { supported: 0, contradicted: 0, revoked: 0, excluded: 0, state: "NO_ADMITTED_EVIDENCE" },
    "system-to-human": { supported: 0, contradicted: 0, revoked: 0, excluded: 0, state: "NO_ADMITTED_EVIDENCE" },
  };
  const seen = new Set<string>();
  for (const e of events) {
    if (!e || !Object.hasOwn(cups, e.direction)) continue;
    const cup = cups[e.direction];
    const scope = e.subject === target.subject && e.capability === target.capability && e.context === target.context && e.revision === target.revision;
    const validTime = Number.isFinite(now) && Number.isFinite(Date.parse(e.observedAt)) && Date.parse(e.observedAt) <= now;
    const notExpired = Number.isFinite(Date.parse(e.expiresAt)) && Date.parse(e.expiresAt) > now;
    if (!scope || !validTime || e.independentReview !== true || !/^[a-f0-9]{64}$/u.test(e.evidenceDigest) || !e.id || !["supported", "contradicted", "revoked"].includes(e.outcome)) { cup.excluded++; continue; }
    // Revocation is a tombstone for this scoped revision; aging it must not silently regrant trust.
    if (e.outcome !== "revoked" && !notExpired) { cup.excluded++; continue; }
    const key = `${e.direction}:${e.outcome}:${e.evidenceDigest}`;
    if (seen.has(key)) { cup.excluded++; continue; }
    seen.add(key);
    cup[e.outcome]++;
  }
  for (const cup of Object.values(cups)) cup.state = cup.revoked ? "REVOKED" : cup.supported + cup.contradicted ? "EVIDENCE_PRESENT" : "NO_ADMITTED_EVIDENCE";
  return { cups, authorisesAction: false as const, constitutionalFloor: "Human agency, consent and care are not earned through scores." };
}

export interface ObservatoryFilters { lens: string; query: string; scope: string }
const EVIDENCE_SCOPES = ["all", "gpai-notice", "humanoid-deployment", "lab-artifact"];
export function readObservatoryFilters(search: string): ObservatoryFilters {
  const p = new URLSearchParams(search);
  const rawLens = p.get("gspcLens") ?? "all";
  return { lens: FRAMEWORK_LENSES.some(l => l.id === rawLens) ? rawLens : "all", query: (p.get("gspcQuery") ?? "").slice(0, 160), scope: EVIDENCE_SCOPES.includes(p.get("gspcCollection") ?? "") ? p.get("gspcCollection")! : "all" };
}
export function writeObservatoryFilters(href: string, filters: ObservatoryFilters): string {
  const url = new URL(href);
  for (const [key, value, fallback] of [["gspcLens", filters.lens, "all"], ["gspcQuery", filters.query.slice(0, 160), ""], ["gspcCollection", filters.scope, "all"]]) {
    if (value === fallback) url.searchParams.delete(key); else url.searchParams.set(key, value);
  }
  return url.href;
}
