/** Shared, network-free public tracker contract. No writes or authority grants. */
export const STATUSES = ["draft", "adopted", "review", "last-call", "published", "withdrawn", "superseded"];
const slug = /^[a-z][a-z0-9-]{1,80}$/;
export function validateCatalog(catalog) {
  const fail = message => { throw new Error("Invalid working-group catalog: " + message); };
  if (catalog?.schema !== "csoai.working-group-catalog/1") fail("schema");
  if (!Array.isArray(catalog.groups) || !Array.isArray(catalog.documents)) fail("collections");
  const groups = new Set();
  for (const group of catalog.groups) {
    if (!slug.test(group.id) || groups.has(group.id)) fail("group id");
    groups.add(group.id);
  }
  const ids = new Set();
  for (const doc of catalog.documents) {
    if (!/^COAI-WG-\d{3,6}$/.test(doc.id) || ids.has(doc.id)) fail("document id");
    ids.add(doc.id);
    if (!groups.has(doc.groupId)) fail("unknown group");
    if (!STATUSES.includes(doc.status)) fail("status");
    if (!Number.isSafeInteger(doc.version) || doc.version < 1) fail("version");
    if (typeof doc.title !== "string" || !doc.title.trim() || doc.title.length > 180) fail("title");
    if (!/^[a-f0-9]{40}$/.test(doc.source?.commit)) fail("source commit");
    if (!/^[a-zA-Z0-9_./-]+$/.test(doc.source?.path) || doc.source.path.includes("..") || doc.source.path.startsWith("/")) fail("source path");
    if (!Array.isArray(doc.history) || !doc.history.length || doc.history.at(-1).version !== doc.version) fail("history");
    if (!Array.isArray(doc.reviewers) || !Array.isArray(doc.deliverables)) fail("review fields");
    if (doc.status !== "draft" && (!doc.decision?.humanReviewReference || !doc.decision?.rationale || !Array.isArray(doc.decision?.dissent))) fail("missing human review reference");
    if (doc.discussionUrl !== null && !/^https:\/\/github\.com\/CSOAI-ORG\/councilof-ai\/discussions\/[0-9]+$/.test(doc.discussionUrl)) fail("discussion URL");
  }
  return catalog;
}
export function selectDocuments(catalog, {query = "", group = "", status = ""} = {}) {
  if (typeof query !== "string" || query.length > 200) throw new Error("Query must be at most 200 characters.");
  if (group && !catalog.groups.some(g => g.id === group)) throw new Error("Unknown working group.");
  if (status && !STATUSES.includes(status)) throw new Error("Unknown document status.");
  const q = query.trim().toLocaleLowerCase("en");
  return catalog.documents.filter(d =>
    (!group || d.groupId === group) && (!status || d.status === status) &&
    (!q || [d.id,d.title,d.summary,d.groupId,...(catalog.groups.find(g=>g.id===d.groupId)?.axes ?? [])].join(" ").toLocaleLowerCase("en").includes(q)));
}
export function sourceUrl(doc) {
  return "https://github.com/CSOAI-ORG/councilof-ai/blob/" + doc.source.commit + "/" + doc.source.path;
}
export function reviewDraft(catalog, documentId, {observation = "", conflicts = ""} = {}) {
  const doc = catalog.documents.find(d => d.id === documentId);
  if (!doc) throw new Error("Unknown document.");
  for (const value of [observation, conflicts]) if (typeof value !== "string" || value.length > 8000 || /\u0000/.test(value)) throw new Error("Draft fields must be text of at most 8,000 characters.");
  return [
    "# Review draft — " + doc.title, "",
    "Document: " + doc.id + " · version " + doc.version,
    "Group: " + doc.groupId, "Source: " + sourceUrl(doc), "",
    "Status: UNSENT DRAFT. This file is not a submitted review, decision or appointment.", "",
    "## Observation and evidence", observation.trim() || "[Add public or synthetic evidence, exact revision, method and observed result.]",
    "", "## Competence and conflicts", conflicts.trim() || "[State relevant experience and conflicts; do not infer independence.]",
    "", "## Dissent, uncertainty and next step", "[Record unresolved objections, missing evidence and a proposed correction or reasoned no-change.]",
    "", "## Permission and review", "[Agree attribution and publication permission with the coordinator.]",
    "Use public evidence only. Keep confidential cases and personal data out of public discussions.",
    "Prepare an email: https://councilof.ai/contact/?arm=working-group&group=" + doc.groupId + "&stage=review",
    "Public discussion: " + (doc.discussionUrl || catalog.forum),
    "A named human must accept the review, consider dissent and record any decision through the governed review process.", ""
  ].join("\n");
}
