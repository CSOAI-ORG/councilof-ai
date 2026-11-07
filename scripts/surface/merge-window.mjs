/**
 * merge-window — the READ of the merges that landed since the edition the catalogue
 * supersedes.
 *
 * WHY THIS EXISTS. The master catalogue's reconciliation block used to be hand-written: six
 * merges frozen on 2026-11-02, published inside an edition dated 2026-11-07 under a sentence
 * claiming it covered "since the previous edition", with a standing open-pull-request count
 * of 51 beside the live read's 80. A live surface must carry the live number, so the block
 * became a read.
 *
 * TWO SOURCES, AND THEY MUST AGREE. The list comes from the pulls API, which carries each
 * merge's commit SHA; the count comes from the search API, which carries the total. If they
 * disagree the read is thrown away rather than published: a list and a count that contradict
 * each other are not a reading, they are an unknown.
 *
 * A RATE LIMIT IS A TRANSPORT EVENT, NOT A CONTENT VERDICT — but it is also not a number to
 * publish, so it stops the read with the status named.
 *
 *   node scripts/surface/merge-window.mjs 2026-11-03T00:00:00Z 2026-11-03
 */
const UA = "CSOAI-catalogue-read/0.1 (councilof.ai master catalogue merge-window read)";
const TIMEOUT_MS = 25000;
const REPO_SLUG = "CSOAI-ORG/councilof-ai";

/** GitHub headers. A token raises the rate limit; it is never required, so an
 *  unauthenticated read still works — and a read that needs a secret it does not have is a
 *  read that fails. */
function ghHeaders() {
  const h = { accept: "application/vnd.github+json", "user-agent": UA };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

/**
 * The merges that landed since the window opened, newest first.
 *
 * The pulls list is ordered by most-recently-updated, so the walk stops as soon as a whole
 * page is older than the window: nothing newer can hide below it. The page cap is a refusal,
 * not a truncation — a truncated list published as complete is the defect this read exists
 * to end.
 */
export async function mergedSince(windowStartIso, maxPages = 20) {
  const start = Date.parse(windowStartIso);
  if (!Number.isFinite(start)) {
    throw new Error(`the merge window "${windowStartIso}" is not a date — unknown, not empty`);
  }
  const headers = ghHeaders();
  const merged = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.github.com/repos/${REPO_SLUG}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}`;
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!r.ok) {
      throw new Error(
        `GitHub pulls answered HTTP ${r.status} — a merge list with no source is null, never an empty list`
      );
    }
    const j = await r.json();
    if (!Array.isArray(j)) throw new Error("GitHub pulls returned no array");
    if (j.length === 0) break;
    let oldest = Infinity;
    for (const p of j) {
      const updated = Date.parse(p.updated_at);
      if (Number.isFinite(updated) && updated < oldest) oldest = updated;
      if (!p.merged_at) continue;
      if (Date.parse(p.merged_at) < start) continue;
      merged.push({
        merged_at: p.merged_at,
        sha: String(p.merge_commit_sha || "").slice(0, 10),
        pr: p.number,
      });
    }
    if (j.length < 100) break;
    if (Number.isFinite(oldest) && oldest < start) break;
    if (page === maxPages) {
      throw new Error(
        `the merge list ran past ${maxPages} pages without closing the window — the list is unknown, not partial`
      );
    }
  }
  merged.sort((a, b) => (a.merged_at < b.merged_at ? 1 : a.merged_at > b.merged_at ? -1 : 0));
  return merged;
}

/** The SAME window, counted by a different API. Used to cross-check the list above. */
export async function mergedCountSince(windowStartDate) {
  const q = encodeURIComponent(`repo:${REPO_SLUG} is:pr is:merged merged:>=${windowStartDate}`);
  const r = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=1`, {
    headers: ghHeaders(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) {
    throw new Error(
      `GitHub search answered HTTP ${r.status} — the merge count stays unknown, never 0`
    );
  }
  const j = await r.json();
  if (typeof j.total_count !== "number") throw new Error("GitHub search returned no total_count");
  return j.total_count;
}

/**
 * The window, read and cross-checked. Two sources that disagree produce NO reading: the
 * caller gets an exception naming both numbers, and publishes nothing.
 */
export async function readMergeWindow(windowStartIso, windowStartDate) {
  const merged = await mergedSince(windowStartIso);
  const count = await mergedCountSince(windowStartDate);
  if (count !== merged.length) {
    throw new Error(
      `two sources disagree about the merges since ${windowStartDate}: the list holds ${merged.length}, the count says ${count} — nothing is published`
    );
  }
  return { merged, count };
}

// Run directly: prove the read against the live API without publishing anything.
if (process.argv[1] && process.argv[1].endsWith("merge-window.mjs")) {
  const iso = process.argv[2] || "2026-11-03T00:00:00Z";
  const date = process.argv[3] || iso.slice(0, 10);
  const out = await readMergeWindow(iso, date);
  console.log(`window ${iso} → now: ${out.count} merges`);
  for (const m of out.merged.slice(0, 5)) console.log(`  ${m.merged_at}  ${m.sha}  PR #${m.pr}`);
  if (out.merged.length > 5) console.log(`  … and ${out.merged.length - 5} more`);
}
