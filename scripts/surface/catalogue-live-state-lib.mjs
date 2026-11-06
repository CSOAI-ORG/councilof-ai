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
    .replace(/"open_pull_requests":\s*\d+/g, '"open_pull_requests": <PRS>')
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
