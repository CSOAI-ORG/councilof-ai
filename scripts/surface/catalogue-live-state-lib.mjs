/**
 * catalogue-live-state-lib — the PURE RULES of the master catalogue's live state.
 *
 * Split out of scripts/surface/rebind-catalogue-live-state.mjs so the rules can be tested
 * without the network: a guard that has never fired proves nothing about the tree it
 * passes, and these rules are the guard. The producer (the .mjs beside this file) reads the
 * live estate and calls these functions; nothing here touches the network.
 *
 * Every rule here has one job: put a number that was READ into the page that publishes it,
 * and refuse to publish a page whose layout no longer matches what the rules expect. A
 * moved layout must fail loudly, not half-write.
 */
import { createHash } from "node:crypto";

/** Replace exactly one match, or throw. */
export function subOnce(text, re, replacement, label) {
  const m = text.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"));
  if (!m || m.length !== 1) {
    throw new Error(`${label}: expected exactly 1 match for ${re}, found ${m ? m.length : 0}`);
  }
  // A function replacement: a literal "$&" in a count would otherwise be read as a
  // replacement pattern. A replacement may also be a FUNCTION, which then receives the
  // match arguments and may use them as capture groups.
  return text.replace(re, typeof replacement === "function" ? replacement : () => replacement);
}

/** Canonical JSON: object keys sorted, arrays in order. Two equal values, one spelling. */
export function canonical(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
}

/**
 * A digest of the CONTENT THAT PRODUCED THE COUNT, not of the whole response body.
 * The corrections ledger re-signs itself on every request, so its bytes differ on every
 * read while its contents do not: hashing the body would make the producer flap on every
 * run and would publish a digest no reader can reproduce. The counted content is stable
 * until the count itself moves, which is exactly when the digest SHOULD move.
 */
export const countDigest = (v) => createHash("sha256").update(canonical(v)).digest("hex");

/**
 * Normalisation for the --check comparison. A re-read always stamps a new moment, so
 * comparing two files byte for byte would make the check flap on every run. The
 * open-pull-request count is a live third-party count that moves for reasons that have
 * nothing to do with the catalogue's claims — lanes merge and close PRs all day — so it is
 * published at the moment of the read and compared on its own terms. A check that flaps
 * every time a lane lands would be set to continue-on-error within a week and would then
 * protect nothing: the same end state as a check that cannot go red.
 */
export const normalise = (s) =>
  s
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, "<TS>")
    .replace(/"open_pull_requests(?:_now)?":\s*\d+/g, '"open_pull_requests": <PRS>')
    .replace(/(<tr><td>Open pull requests<\/td><td><strong>)\d+(<\/strong>)/g, "$1<PRS>$2");

const htmlEscape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Apply the HTML rules. `v` carries the read: {board:{public_count, separation_public_count,
 * axes, measured_axes, unmeasured_axes}, root:{card_count, as_of}, corrections:{entries},
 * x402:{resources}, skills:{published}, mechanism:{totals}, register:{subjects, claims, as_of},
 * prs, readAt, edition, supersedes, unmeasuredAxes}.
 */
export function htmlRules(html, v) {
  let h = html;
  h = subOnce(
    h,
    /<tr><td>GSPC board<\/td><td><strong>[^<]*<\/strong><\/td>/,
    `<tr><td>GSPC board</td><td><strong>${htmlEscape(v.board.public_count)} · ${v.board.unmeasured_axes} unmeasured</strong></td>`,
    "html: GSPC board row"
  );
  h = subOnce(
    h,
    /<tr><td>Model-comparison separation<\/td><td>[^<]*<\/td>/,
    `<tr><td>Model-comparison separation</td><td>${htmlEscape(v.board.separation_public_count)}</td>`,
    "html: separation row"
  );
  h = subOnce(
    h,
    /<tr><td>Public root<\/td><td><strong>[^<]*<\/strong>[^<]*<\/td>/,
    `<tr><td>Public root</td><td><strong>${v.root.card_count} leaves</strong>, as_of ${htmlEscape(v.root.as_of)}</td>`,
    "html: public root row"
  );
  h = subOnce(
    h,
    /<tr><td>Corrections ledger<\/td><td><strong>[^<]*<\/strong><\/td>/,
    `<tr><td>Corrections ledger</td><td><strong>${v.corrections.entries} entries</strong></td>`,
    "html: corrections row"
  );
  h = subOnce(
    h,
    /<tr><td>x402 catalogue<\/td><td><strong>[^<]*<\/strong><\/td>/,
    `<tr><td>x402 catalogue</td><td><strong>${v.x402.resources} resources</strong></td>`,
    "html: x402 row"
  );
  h = subOnce(
    h,
    /(<tr><td>Agent Skills published<\/td><td><strong>)\d+(<\/strong>)/,
    (m, g1, g2) => `${g1}${v.skills.published}${g2}`,
    "html: agent skills row"
  );
  h = subOnce(
    h,
    /<tr><td>Mechanism coverage<\/td><td>\{[^<]*\}<\/td>/,
    `<tr><td>Mechanism coverage</td><td>${htmlEscape(JSON.stringify(v.mechanism.totals))}</td>`,
    "html: mechanism coverage row"
  );
  h = subOnce(
    h,
    /<tr><td>Claim-maintenance register<\/td><td>[^<]*<\/td>/,
    `<tr><td>Claim-maintenance register</td><td>${v.register.subjects} subjects · ${v.register.claims} claims · as_of ${htmlEscape(v.register.as_of)}</td>`,
    "html: claim register row"
  );
  h = subOnce(
    h,
    /<tr><td>Open pull requests<\/td><td><strong>[^<]*<\/strong><\/td>/,
    `<tr><td>Open pull requests</td><td><strong>${v.prs}</strong></td>`,
    "html: open PR row"
  );
  // The unmeasured-axes table is the board's own list, one row per declared slot with no run
  // behind it. It is rewritten from the board, not from the previous edition: a slot that
  // became measured leaves the table and a newly declared slot enters it.
  // With every slot measured there is no unmeasured axis to list, and an EMPTY table reads
  // as a broken page. The board has been at 34 measured of 34 slots since the subject-axis
  // promotion landed, so this is the normal case, not an edge case.
  const rows =
    v.unmeasuredAxes.length === 0
      ? `<tr><td colspan="5">\u2014</td></tr>`
      : v.unmeasuredAxes
          .map(
            (a) =>
              `<tr>\n  <td><code>${htmlEscape(a.axis)}</code></td><td>${htmlEscape(a.family)}</td><td>${htmlEscape(a.kind)}</td>\n` +
              `  <td>${htmlEscape(a.status)}</td><td>${a.n ?? 0}</td><td>${a.accuracy === null || a.accuracy === undefined ? "\u2014" : htmlEscape(a.accuracy)}</td>\n</tr>`
          )
          .join("\n");
  h = subOnce(
    h,
    /(<h3>The unmeasured axes, as the board reads them today<\/h3>\s*<table>[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>)/,
    (m, g1, g2) => `${g1}${rows}${g2}`,
    "html: unmeasured axes table body"
  );
  const supersedeNote =
    v.supersedes && v.supersedes !== v.edition
      ? ` Supersedes the ${v.supersedes} edition; a new edition is a new dated reading, never an edit of an older one.`
      : "";
  // The supersede note is part of the sentence this rule owns, so it is matched too: a rule
  // that appends its own note on every run is not idempotent, and a producer that is not
  // idempotent reports drift against itself forever.
  h = subOnce(
    h,
    /Published \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\.(?: Supersedes the \d{4}-\d{2}-\d{2} edition; a new edition is a new dated reading, never an edit of an older one\.)?/,
    `Published ${v.readAt}.${supersedeNote}`,
    "html: published-at line"
  );
  // The lane-activity table: the merges that landed since the edition this one supersedes.
  // It is rewritten from the read, never from the previous edition's list, so it cannot go
  // stale the way the hand-written one did (six merges frozen on 2026-11-02, published under
  // a heading that said "since 2026-11-01" in an edition dated 2026-11-07).
  if (v.laneActivity) {
    const la = v.laneActivity;
    const rows = la.merged.length
      ? la.merged
          .map(
            (m) =>
              `<tr><td>${htmlEscape(m.merged_at.slice(0, 16).replace("T", " "))}</td><td><code>${htmlEscape(m.sha)}</code></td><td class="ns">PR #${m.pr}</td></tr>`
          )
          .join("\n")
      : `<tr><td colspan="3">\u2014</td></tr>`;
    const block =
      `<h2>What the other lanes shipped since the ${htmlEscape(la.window_start.slice(0, 10))} edition</h2>\n` +
      `<p>Eight sessions work this estate in parallel. This catalogue is the reconciled picture, so what they merged is recorded here with its pull request. ` +
      `<strong>${la.merged.length}</strong> pull requests merged between ${htmlEscape(la.window_start)} and ${htmlEscape(la.window_end)}; the list is complete for that window, and the open-pull-request count above is the live one read at the same moment.</p>\n` +
      `<div class="scroll"><table><thead><tr><th>When (UTC)</th><th>Commit</th><th>Pull request</th></tr></thead><tbody>\n${rows}\n</tbody></table></div>`;
    h = subOnce(
      h,
      /<h2>What the other lanes shipped since [^<]*<\/h2>[\s\S]*?<\/tbody><\/table><\/div>/,
      block,
      "html: lane-activity table"
    );
  }
  return h;
}

/**
 * Apply the JSON rules. Returns a NEW document: the edition, the publication time, the
 * edition it supersedes and the whole live_state block. The dated counts block (the
 * 130-row read) is left exactly as it is — it carries its own date in its own field names
 * and is a dated record of that read.
 */
export function jsonRules(doc, live_state, readAt, edition) {
  const out = { ...doc };
  const prevEdition = out.edition || null;
  out.edition = edition;
  out.published_at = readAt;
  // Each edition names the edition it supersedes, so a reader of the published page can see
  // that this is a NEW dated reading and not an edit of an older one.
  if (prevEdition && prevEdition !== edition) out.supersedes_edition = prevEdition;
  out.live_state = live_state;
  out.edition_written_by = PRODUCER_ID;
  return out;
}

/**
 * THE LANE-ACTIVITY BLOCK — the catalogue's reconciliation record.
 *
 * It used to be hand-written, and it was wrong in three ways at once. Its key said
 * "since_2026_11_01" while its own sentence said "since the previous edition" (2026-11-03),
 * so the two disagreed about the window. The list itself stopped on 2026-11-02: six merges
 * were frozen there while 283 pull requests merged after 2026-11-01 — so the page that
 * called itself "the reconciled picture rather than one lane's view" was carrying one
 * lane's view, frozen. And it carried a standing open-pull-request count of 51 while the
 * live read in the SAME document said 80: two live numbers, one standing, disagreeing.
 *
 * So the producer owns the block now, the way it owns live_state. It reads the merges that
 * landed since the edition this one supersedes, states the window it read, and carries the
 * open-pull-request count FROM THE SAME READ as live_state — one read, one number.
 *
 * The old key is REMOVED, not kept beside the new one: a stale copy of a block next to a
 * live copy is itself a false claim, and it is exactly the defect this function exists to
 * end.
 */
export function laneActivityRules(doc, activity) {
  const out = { ...doc };
  delete out.lane_activity_since_2026_11_01;
  const merged = activity.merged.map((m) => ({
    merged_at: m.merged_at,
    sha: m.sha,
    pr: m.pr,
  }));
  out.lane_activity = {
    what_this_is:
      "What the other sessions working this estate merged since the edition this one supersedes, so the catalogue is the reconciled picture rather than one lane's view. The window is named here, the list is complete for it, and the open-pull-request count is the live one read at the same moment as the rest of this block.",
    window_start: activity.window_start,
    window_end: activity.window_end,
    window_start_source: activity.window_start_source,
    merged_count: merged.length,
    merged,
    open_pull_requests_now: activity.open_pull_requests_now,
    open_pull_requests_source:
      "GitHub search API — the same read as live_state.open_pull_requests; a catalogue may carry one open-pull-request number, not two",
  };
  return out;
}

/**
 * THE WINDOW THE MERGE LIST COVERS.
 *
 * "Since the previous edition" has to mean one thing. On a new day the previous edition is
 * yesterday's edition; on a same-day re-read the published edition already supersedes an
 * older one, and the window does not move. Either way the window is NAMED in the output, so
 * a reader can see exactly what the list covers instead of taking the key's word for it.
 */
export function mergeWindowStart(doc, edition) {
  const prev = doc?.edition || null;
  const startDate = prev && prev !== edition ? prev : doc?.supersedes_edition || prev;
  if (!startDate) {
    throw new Error(
      "the catalogue does not name the edition it supersedes — the merge window is unknown, not empty"
    );
  }
  return {
    startDate,
    windowStart: `${startDate}T00:00:00Z`,
    source: `the edition this one supersedes (${startDate})`,
  };
}

/**
 * ONE document, ONE open-pull-request number.
 *
 * The published catalogue carried 51 in its lane-activity block and 80 in its live_state
 * block, in the same file, at the same time, and a reader could not tell which one was
 * live. This guard refuses to publish a document that carries two different numbers for
 * the same quantity: the number in the lane-activity block is written from the same read as
 * the number in live_state, so they cannot drift, and this proves it rather than assuming it.
 */
export function assertOneOpenPullRequestNumber(text, n, name) {
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new Error(`${name}: the live read produced no open-pull-request count — a count with no source is null, never 0`);
  }
  const found = [...text.matchAll(/"open_pull_requests(?:_now)?"\s*:\s*(\d+)/g)].map((m) => Number(m[1]));
  // A document that carries NO number has not been checked — it has been skipped. A guard
  // that passes vacuously is a comment, not a guard.
  if (!found.length) {
    throw new Error(`${name}: the document carries no open-pull-request number at all`);
  }
  for (const f of found) {
    if (f !== n) {
      throw new Error(
        `${name}: the document carries an open-pull-request count of ${f} where the live read says ${n} — one document, one number`
      );
    }
  }
  return found.length;
}

/**
 * The page's own row. A page is not a JSON document, so the page's guard is its own: it
 * looks for the row a reader sees, and it fails when the row is gone — a page that lost
 * the row has not been checked, it has been skipped.
 */
export function assertOneOpenPullRequestNumberInPage(page, n, name) {
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new Error(`${name}: the live read produced no open-pull-request count — a count with no source is null, never 0`);
  }
  const rows = [...page.matchAll(/<tr><td>Open pull requests<\/td><td><strong>(\d+)<\/strong>/g)].map((m) =>
    Number(m[1])
  );
  if (!rows.length) {
    throw new Error(`${name}: the page shows no open-pull-request row at all`);
  }
  for (const f of rows) {
    if (f !== n) {
      throw new Error(
        `${name}: the page shows ${f} open pull requests where the live read says ${n} — one document, one number`
      );
    }
  }
  return rows.length;
}

/**
 * THE STRUCTURAL FORM OF THE SAME RULE: the document's two open-pull-request numbers must
 * both be present and both be the live one. A regex cannot see a key that JSON dropped
 * because its value was undefined — and "absent" is a state, never a zero that passes.
 */
export function assertLaneActivityNumbers(doc, n, name) {
  const live = doc?.live_state?.open_pull_requests;
  const block = doc?.lane_activity?.open_pull_requests_now;
  if (typeof live !== "number") {
    throw new Error(`${name}: live_state carries no open-pull-request count`);
  }
  if (typeof block !== "number") {
    throw new Error(`${name}: the lane-activity block carries no open-pull-request count`);
  }
  if (live !== n || block !== n) {
    throw new Error(
      `${name}: live_state says ${live} and the lane-activity block says ${block}, where the live read says ${n} — one document, one number`
    );
  }
  return { live, block };
}

/**
 * WHO OWNS THE EDITION ALREADY AT THIS PATH.
 *
 * On 2026-11-02 the master catalogue's 2026-11-02 edition was published at 04:33 by another
 * lane, and this producer ran at 07:13 and would have overwritten it — including that
 * lane's corrections table, its repair record and its jewel rows. Two editions dated the
 * same day, one of them silently gone, is not a publish; it is a collision.
 *
 * So the producer marks the edition it writes, and refuses to publish over an edition of
 * the same date that it did not write. The refusal names the other edition's publication
 * time, so the reader knows what is in the way. The next edition is tomorrow's, or the
 * other lane's re-read.
 */
export const PRODUCER_ID = "scripts/surface/rebind-catalogue-live-state.mjs";

export function assertEditionIsOurs(doc, edition, producerId = PRODUCER_ID) {
  const prev = doc?.edition;
  if (prev !== edition) return; // a different date: a new edition, not a collision
  if (doc?.edition_written_by === producerId) return; // our own edition: re-reading it
  throw new Error(
    `another lane already published the ${edition} edition of this catalogue ` +
      `(published_at ${doc?.published_at || "unknown"}). This producer does not overwrite ` +
      `another lane's edition: publish the next dated edition, or coordinate with the lane that wrote it.`
  );
}

/**
 * No board-count sentence in a published file may disagree with the board this commit
 * serves. A page that quotes one live number and a stale one is the drift this exists to
 * remove, so this is checked AFTER the rules run and BEFORE anything is written.
 */
export function assertBoardSentences(text, board, name) {
  for (const m of text.matchAll(/(\d{1,3}) axes · (\d{1,3}) measured/g)) {
    if (Number(m[1]) !== board.axes || Number(m[2]) !== board.measured_axes) {
      throw new Error(`${name}: a board-count sentence still reads "${m[0]}" where the board reads "${board.public_count}"`);
    }
  }
}
