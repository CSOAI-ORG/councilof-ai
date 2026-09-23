#!/usr/bin/env node
/**
 * osaia-membership.mjs — the producer for the Open Secure AI Alliance claim map.
 *
 * WHY THIS EXISTS. The Open Secure AI Alliance publishes no member list. Its own site names no
 * organisation: /members and /about both 404, and the one sentence about membership is
 * "Leaders across cloud computing, cybersecurity, enterprise software, open source foundations,
 * and AI research have joined as inaugural partners." Press coverage names organisations, and
 * the counts it prints disagree with each other. So a page that said "these are the members"
 * would be asserting facts about a hundred other companies from no primary source — which is
 * exactly the defect this repository exists to catch in other people.
 *
 * WHAT THIS BUILDS INSTEAD. A registry of what each organisation's OWN public record says,
 * captured verbatim, hashed, dated, and re-read on a schedule, under
 * https://councilof.ai/spec/claim-maintenance/v0.1/ (CC0). Every digest here is produced by the
 * specification's own reference implementation, scripts/claim-capture.mjs, so a third party
 * recomputes them with the published extractor rather than with ours.
 *
 * THE TWO VOCABULARIES, AND WHY THEY ARE NOT THE SAME THING.
 *   · `state` is the specification's §4 state machine: CLAIM_CAPTURED, CLAIM_MEASURED,
 *     UNMEASURED, UNCHECKABLE. There are four, there are only four, and nothing here invents a
 *     fifth. It lives on the artifact and describes whether a measurement exists beside a claim.
 *   · `evidence_class` is a registry-level field on a MAP ROW, not on an artifact. It records
 *     WHO said this organisation is a member and WHERE: CORROBORATED (that organisation's own
 *     public record), ANNOUNCED (the founding vendor, the alliance or the Linux Foundation named
 *     them), REPORTED (press only), NOT_FOUND (we looked and found nothing), UNCHECKABLE (their
 *     own surface refused our reader — the status code is recorded).
 * The two are orthogonal and are never collapsed into one count. `evidence_class: UNCHECKABLE`
 * means "we could not read their page"; the specification's `state: UNCHECKABLE` means "no public
 * evidence can settle this claim". Both appear in this registry and each says which it is.
 *
 * SUBJECT ATTRIBUTION (spec §1.4). A claim a third party makes about an organisation is the
 * third party's claim, and is filed under the third party. So the artifact behind every
 * ANNOUNCED row has the FOUNDING VENDOR as its subject, not the organisation named in it. Only
 * an organisation that published the statement itself is the subject of its own artifact. That
 * single rule is what makes "they said it" and "somebody said it about them" visibly different
 * to a reader, which is the whole point of the map.
 *
 * WHAT IT NEVER DOES. It asserts no falsity about anyone. NOT_FOUND means we did not find it,
 * never that it is false. No logo is used, no mark is issued, no score, rank or index is derived
 * from any count, and nothing here implies the alliance has seen, reviewed or approved it.
 *
 *   node scripts/claims/osaia-membership.mjs --build     # capture live, write the registry
 *   node scripts/claims/osaia-membership.mjs --check      # CI: the committed registry must match
 *   node scripts/claims/osaia-membership.mjs --watch      # weekly re-read -> observed changes
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifact, canonicalBytes, extractVisibleText, verifyArtifact } from "../claim-capture.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SOURCES = join(ROOT, "data/claims/osaia-membership-sources.json");
const OUT = join(ROOT, "public/claims/osaia-membership-2026-09-23.json");
const REGISTRY_ID = "osaia-membership-2026-09-23";
const SPEC = "https://councilof.ai/spec/claim-maintenance/v0.1/";
const BASE = "https://councilof.ai";
const UA = `CSOAI-claim-maintenance/0.1 (+${SPEC})`;

const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
const mode = process.argv.includes("--check") ? "check" : process.argv.includes("--watch") ? "watch" : "build";

/**
 * The conflict every artifact in this registry carries, at artifact level, where a reader of
 * that one record sees it (spec §10.3). A disclosure on a policy page the artifact does not link
 * is not a disclosure.
 */
const CONFLICTS = [
  "The maintainer, Council of AI (CSOAI Ltd), states that it is itself a member of the Open Secure AI Alliance and of the Linux Foundation, both since 21 September 2026, on private evidence: the confirmations are in the maintainer's mailbox and neither body names the maintainer on any public surface we can read. Membership is not endorsement, in either direction.",
  "No payment, sponsorship or contingent arrangement exists between the maintainer and any organisation named in this registry, and none was sought. No organisation named here was contacted about this registry.",
];

const DOES_NOT_PROVE_BASE = [
  "that the claim captured here is false — this record does not indicate that, and no statement of falsity about any organisation may be derived from it",
  "that any organisation named here is not a member of the Open Secure AI Alliance — this registry makes no such statement about anyone, and none may be derived from it",
  "that any organisation named here is a member — membership is a private arrangement between the organisation and the alliance, and this registry reads public pages, not membership records",
  "that the absence of a statement on an organisation's own website means anything at all about that organisation",
  "that a timestamp receipt over these bytes is anchored in a block; a receipt is submitted, and stays submitted, until its upgrade has been run and its attestation path verified",
];

/** RFC 9162 §2.1: leaf 0x00, node 0x01, split at the largest power of two below n. No odd-node duplication. */
function mth(leaves) {
  if (leaves.length === 0) return sha256(Buffer.alloc(0));
  if (leaves.length === 1) return sha256(Buffer.concat([Buffer.from([0x00]), leaves[0]]));
  let k = 1;
  while (k * 2 < leaves.length) k *= 2;
  return sha256(
    Buffer.concat([
      Buffer.from([0x01]),
      Buffer.from(mth(leaves.slice(0, k)), "hex"),
      Buffer.from(mth(leaves.slice(k)), "hex"),
    ]),
  );
}

/**
 * Read one public URL. Returns what happened, never an exception: a page that refuses our reader
 * is a recorded outcome with its status code, not a gap in the map and not a fact about the
 * organisation that published it.
 */
async function probe(url, attempts = 3) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    const started = nowIso();
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
        signal: AbortSignal.timeout(45_000),
      });
      const body = await res.text();
      const text = extractVisibleText(body);
      const out = {
        url, access_date: started, http_status: res.status, ok: res.ok, attempts_made: i + 1,
        extracted_chars: text.length, content_sha256: sha256(Buffer.from(text, "utf8")), text,
      };
      // A refusal is an answer: retrying a 403 three times only asks a settled question again.
      if (res.ok || (res.status >= 400 && res.status < 500)) return out;
      last = out;
    } catch (err) {
      last = { url, access_date: started, http_status: null, ok: false, attempts_made: i + 1,
               error: String((err && err.message) || err) };
    }
    if (i + 1 < attempts) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  return last;
}

const nextMonday = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
  d.setUTCHours(9, 40, 0, 0);
  return d.toISOString().replace(/\.\d+Z$/, "Z");
};


/**
 * The weekly re-read (spec §1.1, §1.7, §4.9).
 *
 * It re-reads every source in the published registry with the same extractor, recomputes each
 * digest, and records a difference as an OBSERVED CHANGE REQUIRING REVIEW: the two digests, the
 * two access dates, and whether the captured sentence was still present. That is the entire
 * content of the statement.
 *
 * It never writes an allegation, never counts observed changes as a measure of anybody, and
 * never edits the published registry — a correction is a NEW registry that names the one it
 * supersedes (spec §9.4). A read that did not happen is recorded as a read that did not happen,
 * because a schedule that is silently skipped is indistinguishable from no schedule at all.
 * Nothing is sent to any organisation named in the registry.
 */
async function watch() {
  if (!existsSync(OUT)) { console.error(`[osaia-watch] no published registry at ${OUT}`); return 1; }
  const reg = JSON.parse(readFileSync(OUT, "utf8"));
  const outDir = process.argv.includes("--out")
    ? process.argv[process.argv.indexOf("--out") + 1]
    : join(ROOT, ".osaia-watch");
  mkdirSync(outDir, { recursive: true });
  const ranAt = nowIso();
  const changes = [];
  const reads = [];

  for (const a of reg.claims) {
    // OSAIA-SELF's source is this site's own page; it is re-read like any other, and it is the
    // maintainer's own claim, held in the same state as everybody else's unreadable one.
    const r = await probe(a.source_url);
    if (!r || !r.ok) {
      reads.push({
        claim_id: a.claim_id, url: a.source_url, read: "DID_NOT_HAPPEN",
        outcome: r ? (r.http_status ? `HTTP ${r.http_status}` : `no HTTP status: ${r.error}`) : "no response",
        attempted_utc: ranAt,
        note: "The scheduled read did not produce a reading. That is recorded as an event, not as nothing, and not as anything about the organisation whose page it is.",
      });
      continue;
    }
    const same = r.content_sha256 === a.source_content_hash.value;
    const present = r.text.includes(a.claim_verbatim);
    reads.push({
      claim_id: a.claim_id, url: a.source_url, read: "OK", http_status: r.http_status,
      access_date: r.access_date, current_hash: r.content_sha256, recorded_hash: a.source_content_hash.value,
      extracted_chars: r.extracted_chars, recorded_extracted_chars: a.source_content_hash.extracted_chars ?? null,
      digest_unchanged: same, claim_present: present,
    });
    if (!same) {
      changes.push({
        claim_id: a.claim_id, subject: a.subject.name, source_url: a.source_url,
        observed_utc: r.access_date, previous_access_date: a.access_date,
        previous_hash: a.source_content_hash.value, current_hash: r.content_sha256,
        claim_present: present,
        note: present
          ? "The bytes at this URL differ from the bytes recorded at the previous read. The captured sentence was still present at this read. That is the whole of the observation."
          : "The bytes at this URL differ from the bytes recorded at the previous read, and the captured sentence was not present in the extracted text at this read. A page may change for any reason, including a better one than ours; this records what was seen and not why.",
      });
    }
  }

  const receipt = {
    schema: "csoai.claim-watch-receipt/0.1",
    loop: "osaia-membership",
    registry: `/claims/${REGISTRY_ID}.json`,
    registry_sha256: sha256(readFileSync(OUT)),
    ran_at_utc: ranAt,
    cadence: "weekly",
    claims_read: reads.filter((x) => x.read === "OK").length,
    claims_whose_read_did_not_happen: reads.filter((x) => x.read === "DID_NOT_HAPPEN").length,
    observed_changes_requiring_review: changes,
    observed_changes_count: changes.length,
    reads,
    discipline:
      "An observed change is a statement about two digests. It is a prompt for a person to look. " +
      "This loop makes no allegation, derives no count about any organisation from these changes, " +
      "sends nothing to anyone named in the registry, and never edits a published file.",
  };
  const file = join(outDir, `receipt-${ranAt.replace(/[:-]/g, "")}.json`);
  writeFileSync(file, JSON.stringify(receipt, null, 1) + "\n");
  writeFileSync(join(outDir, "latest-receipt.json"), JSON.stringify(receipt, null, 1) + "\n");
  console.log(`[osaia-watch] ${receipt.claims_read} read, ${receipt.claims_whose_read_did_not_happen} did not happen, ${changes.length} observed change(s)`);
  for (const c of changes) console.log(`OBSERVED-CHANGE-REQUIRING-REVIEW ${c.claim_id} ${c.subject} ${c.previous_hash.slice(0, 10)}…→${c.current_hash.slice(0, 10)}… claim_present=${c.claim_present}`);
  console.log(`WROTE ${file}`);
  return 0;
}

async function main() {
  if (mode === "watch") { process.exitCode = await watch(); return; }
  const src = JSON.parse(readFileSync(SOURCES, "utf8"));
  const orgs = src.organisations;
  const NEXT = nextMonday();
  const artifacts = [];
  const rows = [];
  const notes = [];

  // ── 1. The alliance's own surface. Probed at every path a reader would try, because "there is
  //       no member list" is a claim about bytes and has to be one we actually checked.
  const alliancePaths = ["/", "/members", "/about", "/membership", "/join"];
  const allianceProbes = [];
  for (const p of alliancePaths) allianceProbes.push(await probe("https://secureaialliance.org" + p));
  const home = allianceProbes[0];
  if (!home.ok) throw new Error(`the alliance's own page did not answer: ${home.http_status ?? home.error}`);

  // How many of the named organisations does the alliance's own home page name? This is a real
  // measurement over bytes we hold, and it is the number the whole map turns on.
  const namedOnAllianceSurface = orgs
    .map((o) => o.name_as_printed.replace(/^the /, ""))
    .filter((n) => new RegExp(`(?<![A-Za-z])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z])`).test(home.text));

  const allianceArtifact = buildArtifact({
    claim_id: "OSAIA-1",
    subject: { name: "Open Secure AI Alliance", identifier: "secureaialliance.org", identifier_kind: "domain" },
    claim_verbatim: src.alliance_claim.quote,
    claim_type: "membership-composition",
    source_url: home.url,
    access_date: home.access_date,
    content_hash: home.content_sha256,
    covers: "visible-text",
    extracted_chars: home.extracted_chars,
    state: "UNCHECKABLE",
    uncheckable_reason:
      "No public evidence can settle which organisations this sentence refers to. The alliance publishes no member " +
      "list: on the read recorded here its own home page named " + namedOnAllianceSurface.length + " of the " + orgs.length +
      " organisations the founding vendor's announcement lists" +
      (namedOnAllianceSurface.length ? " (" + namedOnAllianceSurface.join(", ") + ", in the site's copyright line, not in a member listing)" : "") +
      ", and " + alliancePaths.slice(1).map((p) => `${p} returned ${allianceProbes[alliancePaths.indexOf(p)].http_status}`).join(", ") +
      ". \"Leaders\" is also non-quantitative. This is a statement about the evidence a stranger can reach, never about the alliance.",
    does_not_prove: [
      ...DOES_NOT_PROVE_BASE,
      "that the alliance has no members, or fewer members than any source states — it publishes no list, which is a fact about the website and nothing else",
      "that the alliance has seen, reviewed or approved this registry; it has not been contacted about it",
    ],
    conflicts: CONFLICTS,
    next_read_utc: NEXT,
  });
  artifacts.push(allianceArtifact);

  // ── 2. The founding vendor's announcement: the sentence that names every organisation, and the
  //       one claim in this registry that public evidence can partly settle.
  const nvidia = await probe(src.founding_announcement.url);
  if (!nvidia.ok) throw new Error(`the founding announcement did not answer: ${nvidia.http_status ?? nvidia.error}`);
  const announcementPresent = nvidia.text.includes(src.founding_announcement.quote);

  // ── 3. Each organisation's own record, where we found one.
  const selfReads = new Map();
  for (const o of orgs) {
    if (o.evidence_class !== "CORROBORATED" || o.name_as_printed === "NVIDIA") continue;
    const r = await probe(o.self_source.url);
    selfReads.set(o.name_as_printed, r);
  }
  // And each organisation whose own surface refused our reader, re-probed so the status code in
  // the published record is one this run actually observed rather than one carried over.
  const refusals = new Map();
  for (const o of orgs) {
    if (o.evidence_class !== "UNCHECKABLE") continue;
    refusals.set(o.name_as_printed, await probe(o.self_source_unreadable.url));
  }

  const readOk = [...selfReads.values()].filter((r) => r.ok).length + 1; // +1: the founding vendor's own page
  const couldNotRead = [...refusals.values()].filter((r) => !r.ok).length;

  const measured = buildArtifact({
    claim_id: "OSAIA-2",
    subject: { name: "NVIDIA", identifier: "nvidia.com", identifier_kind: "domain" },
    claim_verbatim: src.founding_announcement.quote,
    claim_type: "membership-composition",
    source_url: nvidia.url,
    access_date: nvidia.access_date,
    content_hash: nvidia.content_sha256,
    covers: "visible-text",
    extracted_chars: nvidia.extracted_chars,
    state: "CLAIM_MEASURED",
    does_not_prove: [
      ...DOES_NOT_PROVE_BASE,
      "that the organisations without a statement of their own are not members — the measurement counts published statements, not memberships",
      "that a statement published by an organisation is accurate; it is that organisation's own words, captured, and nothing more",
      "that this count is the alliance's membership; the alliance publishes no list and this number is not one",
    ],
    conflicts: CONFLICTS,
    next_read_utc: NEXT,
  });
  measured.window = { from: src.read_window.from, to: nowIso() };
  measured.denominator = {
    description:
      "Organisations named as inaugural partners in the sentence captured in this artifact, counted once each, " +
      "exactly as printed. \"the Linux Foundation\" is counted as one organisation. No name is merged with another " +
      "and none is dropped.",
    n: orgs.length,
    source_url: nvidia.url,
    excluded: [
      "Council of AI (CSOAI Ltd), the maintainer — it is not named in this sentence and is carried as a separate self-application row, never inside this denominator",
    ],
  };
  measured.method = {
    description:
      "For each of the " + orgs.length + " names, one web search restricted to that organisation's primary domain for the " +
      "phrase \"Open Secure AI Alliance\", then a direct fetch of every first-party candidate the search returned, then " +
      "visible-text extraction by scripts/claim-capture.mjs (spec §6.3) and a check that the quoted sentence is present " +
      "in the extracted text. An organisation counts only when a page on a domain it controls contains a sentence in " +
      "which that organisation states its own membership or participation. No site was crawled; no organisation was " +
      "contacted. Where a domain could not be determined from public record the row records that rather than guessing, " +
      "and where a server refused our reader the status code is recorded and the organisation is reported as unread, " +
      "never as absent.",
    implementation_url: "https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/claims/osaia-membership.mjs",
    evidence: [
      { url: nvidia.url, access_date: nvidia.access_date, content_hash: nvidia.content_sha256 },
      { url: home.url, access_date: home.access_date, content_hash: home.content_sha256 },
      ...[...selfReads.values()].filter((r) => r.ok).map((r) => ({ url: r.url, access_date: r.access_date, content_hash: r.content_sha256 })),
    ],
  };
  measured.result = {
    value: String(orgs.filter((o) => o.evidence_class === "CORROBORATED").length),
    unit: "organisations whose own public record we read and found stating their membership",
    n: orgs.length,
    unmeasured_of_population: couldNotRead,
  };
  measured.artifact_sha256 = undefined;
  delete measured.artifact_sha256;
  measured.artifact_sha256 = sha256(canonicalBytes(Object.fromEntries(Object.entries(measured).filter(([k]) => k !== "artifact_sha256" && k !== "sig"))));
  artifacts.push(measured);

  // ── 4. One artifact per organisation that published the statement itself.
  let n = 3;
  for (const o of orgs) {
    if (o.evidence_class !== "CORROBORATED" || o.name_as_printed === "NVIDIA") continue;
    const r = selfReads.get(o.name_as_printed);
    const present = r.ok && r.text.includes(o.self_source.quote);
    if (!r.ok) {
      notes.push(`${o.name_as_printed}: own page answered ${r.http_status ?? r.error} on this run; the row keeps the digest of the read that captured the sentence and records the outcome`);
    } else if (!present) {
      notes.push(`${o.name_as_printed}: the quoted sentence was not found in the extracted text on this run — recorded as an observed change requiring review, never as a finding about ${o.name_as_printed}`);
    }
    const a = buildArtifact({
      claim_id: `OSAIA-${n++}`,
      subject: { name: o.name_as_printed.replace(/^the /, "The "), identifier: o.identifier, identifier_kind: o.identifier_kind },
      claim_verbatim: o.self_source.quote,
      claim_type: "self-published-membership",
      ...(o.self_source.excerpt ? { excerpt: true } : {}),
      source_url: r.url,
      access_date: r.access_date,
      content_hash: r.ok ? r.content_sha256 : o.self_source.content_sha256_at_first_capture,
      covers: "visible-text",
      extracted_chars: r.ok ? r.extracted_chars : undefined,
      state: "CLAIM_CAPTURED",
      measurement_plan:
        "Re-read weekly. This claim becomes settleable by public evidence only if the alliance publishes a member " +
        "list a stranger can reach; on that day the claim moves to UNMEASURED and the transition records what " +
        "appeared (spec §4.8). Until then the maintenance is: the sentence is still there, or it is not, and either " +
        "reading is recorded as an observed change and nothing more.",
      does_not_prove: [
        ...DOES_NOT_PROVE_BASE,
        `that this sentence is accurate — it is ${o.name_as_printed}'s own published wording, captured verbatim, and this record takes no view on it`,
      ],
      conflicts: CONFLICTS,
      next_read_utc: NEXT,
    });
    artifacts.push(a);
    o._artifact = a;
    o._present = present;
    o._read = r;
  }

  // ── 5. Self-application (spec §10.6). A body that observes others' claims and exempts its own
  //       is running a campaign, not a discipline.
  const selfUrl = `${BASE}/alliance-map`;
  const selfClaim =
    "Council of AI (CSOAI Ltd) is a member of the Open Secure AI Alliance and of the Linux Foundation, both since " +
    "21 September 2026, on private evidence: the confirmations are in our mailbox, and neither body names us on any " +
    "public surface we can read. Membership is not endorsement, and we speak for neither body.";
  artifacts.push(buildArtifact({
    claim_id: "OSAIA-SELF",
    subject: { name: "Council of AI (CSOAI Ltd)", identifier: "16939677", identifier_kind: "company-register", identifier_note: "UK Companies House" },
    claim_verbatim: selfClaim,
    claim_type: "self-published-membership",
    source_url: selfUrl,
    access_date: nowIso(),
    content_hash: sha256(Buffer.from(selfClaim, "utf8")),
    covers: "raw-bytes",
    extracted_chars: selfClaim.length,
    state: "UNCHECKABLE",
    uncheckable_reason:
      "Our own evidence for this is private correspondence, which the specification puts out of scope as a public " +
      "claim (§1.3), and neither the alliance nor the Linux Foundation names us on a surface a stranger can reach. " +
      "So no public evidence can settle it, and we hold our own claim in exactly the state we hold everybody else's " +
      "unreadable one. If either body publishes a list that names us, this moves to UNMEASURED and records what appeared. " +
      "The source_url is the page on which we publish this statement. Until that page is served, the digest here covers " +
      "the statement's own bytes rather than a page's visible text, which is why this one artifact records covers: raw-bytes, " +
      "and the weekly loop records a read that did not happen rather than a reading it did not take.",
    does_not_prove: [
      ...DOES_NOT_PROVE_BASE,
      "that the Open Secure AI Alliance or the Linux Foundation endorses, has reviewed, or has seen this registry or the page that renders it",
      "that our membership gives this registry any standing inside either body — it gives it none",
    ],
    conflicts: CONFLICTS,
    next_read_utc: NEXT,
  }));

  // ── 6. The map rows. One per organisation, plus the maintainer's own.
  for (const o of orgs) {
    const row = {
      name_as_printed: o.name_as_printed,
      evidence_class: o.evidence_class,
      identifier: o.identifier,
      identifier_kind: o.identifier_kind,
      ...(o.identifier ? {} : {
        identifier_note:
          "The founding vendor's announcement carries no identifier for this organisation and we found no page of " +
          "its own naming the alliance, so we have a trading name and nothing else. A trading name does not identify " +
          "an organisation (spec §5.7), and we do not guess a domain to fill the gap.",
      }),
      stack_layer: o.contribution ? o.contribution.stack_layer : "NOT_STATED",
      ...(o.contribution
        ? {
            contribution_quote: o.contribution.quote,
            contribution_source_url: o.contribution.source_url,
            stack_layer_note:
              "The layer names are the alliance's own, from the \"Beyond the Model\" section of its home page. Placing " +
              "this organisation at that layer is OUR reading of the quoted sentence, not the alliance's assignment " +
              "and not the organisation's. The sentence is printed beside it so a reader can disagree.",
          }
        : {
            stack_layer_note:
              "No source we read names a contribution by this organisation to the alliance, so no layer is assigned. " +
              "That is a statement about the documents we read, not about the organisation.",
          }),
    };
    if (o.evidence_class === "CORROBORATED") {
      const a = o._artifact;
      row.source_url = o.self_source.url;
      row.quote = o.self_source.quote;
      row.says_it_itself = true;
      if (o.name_as_printed === "NVIDIA") {
        row.claim_id = "OSAIA-2";
        row.access_date = nvidia.access_date;
        row.source_content_sha256 = nvidia.content_sha256;
        row.extracted_chars = nvidia.extracted_chars;
        row.quote_present_at_this_read = announcementPresent;
      } else {
        row.claim_id = a.claim_id;
        row.access_date = a.access_date;
        row.source_content_sha256 = a.source_content_hash.value;
        row.extracted_chars = a.source_content_hash.extracted_chars ?? null;
        row.quote_present_at_this_read = o._present;
        if (o.self_source.read_note) row.read_note = o.self_source.read_note;
      }
    } else if (o.evidence_class === "UNCHECKABLE") {
      const r = refusals.get(o.name_as_printed);
      row.says_it_itself = null;
      row.source_url = o.self_source_unreadable.url;
      row.access_date = r.access_date;
      row.read_outcome = r.ok ? `HTTP ${r.http_status} on this run` : (r.http_status ? `HTTP ${r.http_status}` : `no HTTP status: ${r.error}`);
      row.http_status = r.http_status;
      row.attempts = o.self_source_unreadable.attempts;
      row.read_note = o.self_source_unreadable.note;
      row.named_in = { source_url: nvidia.url, claim_id: "OSAIA-2" };
    } else {
      row.says_it_itself = false;
      row.named_in = { source_url: nvidia.url, claim_id: "OSAIA-2" };
      row.access_date = nvidia.access_date;
      row.source_content_sha256 = nvidia.content_sha256;
      row.search_note =
        "One web search restricted to this organisation's primary domain for the alliance's name returned no page of " +
        "its own that names the alliance. We did not crawl the site. This means we did not find it.";
    }
    rows.push(row);
  }
  rows.push({
    name_as_printed: "Council of AI (CSOAI Ltd)",
    // NOT_FOUND, and it is our own row. We looked at the alliance's public surface and at the
    // Linux Foundation's and found nothing naming us, so the maintainer sits in the weakest class
    // on its own map, by the same rule as everyone else. Our own statement is printed beside it
    // and rests on private evidence, which is not public evidence and is not treated as any.
    evidence_class: "NOT_FOUND",
    is_the_maintainer: true,
    identifier: "16939677",
    identifier_kind: "company-register",
    stack_layer: "NOT_STATED",
    stack_layer_note: "We have contributed nothing to the alliance and claim no layer.",
    says_it_itself: true,
    claim_id: "OSAIA-SELF",
    source_url: selfUrl,
    quote: selfClaim,
    access_date: nowIso(),
    read_note:
      "Our membership rests on private evidence and is held as UNCHECKABLE under the specification, on the same rule " +
      "we apply to every organisation whose page we could not read. Membership is not endorsement.",
  });

  // ── 7. Totals. Five evidence classes, four specification states, counted separately and never
  //       added together. A class with zero rows is printed as zero, not omitted.
  const CLASSES = ["CORROBORATED", "ANNOUNCED", "REPORTED", "NOT_FOUND", "UNCHECKABLE"];
  const STATES = ["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"];
  const byClass = Object.fromEntries(CLASSES.map((c) => [c, rows.filter((r) => r.evidence_class === c).length]));
  const byState = Object.fromEntries(STATES.map((s) => [s, artifacts.filter((a) => a.state === s).length]));

  const leaves = artifacts
    .map((a) => Buffer.from(a.artifact_sha256, "hex"))
    .sort(Buffer.compare);

  const registry = {
    schema: "csoai.claim-registry/0.3",
    registry_id: REGISTRY_ID,
    title: "What the public record says about membership of the Open Secure AI Alliance",
    created_utc: "2026-09-23",
    built_at_utc: nowIso(),
    specification: SPEC,
    specification_licence: "CC0-1.0",
    maintainer: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
    generated_by: "scripts/claims/osaia-membership.mjs — every digest computed by the specification's own reference implementation, scripts/claim-capture.mjs",
    registry_shape: "artifact array (spec §5). The claims[] entries validate against the published claim-artifact schema; the organisations[] rows are this registry's own map layer and carry no specification state of their own.",

    this_is_not_a_member_list: {
      what_it_is:
        "A record of what public sources say, one row per organisation, with a source URL, the date we read it, the " +
        "digest of what we read, and the organisation's own words where it published any. It is not a membership " +
        "roster and it is not a list of members.",
      why:
        "The Open Secure AI Alliance publishes no member list. On the read recorded in OSAIA-1 its own site named " +
        "no organisation as a member, /members and /about both returned 404, and the only membership sentence on it " +
        "is the one captured verbatim in OSAIA-1. Publishing a roster from press coverage would be asserting facts " +
        "about other companies from no primary source.",
      we_speak_for_nobody:
        "We speak for no organisation on this map. A listing here is not an endorsement and it is not an accusation " +
        "(spec §10.4). Nothing here states or implies that any organisation's claim is false, and NOT_FOUND means we " +
        "did not find it, never that it is not so.",
      no_logos:
        "No logo or trademark of any organisation appears on this map or on the page that renders it. Names are text, " +
        "and each links to that organisation's own record rather than to ours.",
      not_reviewed_by_the_alliance:
        "The Open Secure AI Alliance has not seen, reviewed or approved this registry or the page that renders it, " +
        "and has not been contacted about either.",
    },

    evidence_classes: {
      note:
        "These five describe WHO said it and WHERE. They are a field on a map row, not a specification state, and " +
        "they are never added to the state counts below or collapsed into one another.",
      CORROBORATED: "the organisation's own site, blog, newsroom or filing carries the statement. The sentence is quoted and the page is linked.",
      ANNOUNCED: "the alliance, the Linux Foundation or the founding vendor named the organisation in a public announcement, and we found no page of the organisation's own that does. This is weaker than the organisation saying it itself.",
      REPORTED: "only press coverage names the organisation, and no primary source confirms it.",
      NOT_FOUND: "we looked and found nothing. This means we did not find it. It never means it is not so.",
      UNCHECKABLE: "the organisation's own surface refused our reader, so we could not determine what its own record says. The status code is recorded. This is a fact about a server, not about the organisation.",
      relationship_to_specification_states:
        "An evidence_class of UNCHECKABLE is not the specification's §4.4 UNCHECKABLE. The first means we could not " +
        "read a page; the second means no public evidence can settle a claim. Both appear here and each is named.",
    },

    totals: {
      organisations_on_this_map: rows.length,
      organisations_named_in_the_founding_announcement: orgs.length,
      by_evidence_class: byClass,
      by_evidence_class_of_the_122_named_in_the_announcement: Object.fromEntries(
        CLASSES.map((c) => [c, rows.filter((r) => r.evidence_class === c && !r.is_the_maintainer).length]),
      ),
      by_specification_state: byState,
      artifacts: artifacts.length,
      organisations_whose_own_record_we_read_and_found_the_statement: rows.filter((r) => r.evidence_class === "CORROBORATED" && !r.is_the_maintainer).length,
      organisations_named_only_by_the_founding_announcement: rows.filter((r) => r.evidence_class === "ANNOUNCED" && !r.is_the_maintainer).length,
      organisations_named_only_by_press: byClass.REPORTED,
      organisations_we_looked_for_and_found_nothing: byClass.NOT_FOUND,
      organisations_we_looked_for_and_found_nothing_note: "One: the maintainer's own row. Neither the alliance nor the Linux Foundation names Council of AI on any public surface we can read.",
      organisations_whose_own_surface_we_could_not_read: byClass.UNCHECKABLE,
      organisations_the_alliances_own_site_names: namedOnAllianceSurface.length,
      organisations_with_a_contribution_named_in_any_source_we_read: rows.filter((r) => r.stack_layer !== "NOT_STATED").length,
      counts_are_never_added:
        "The five evidence classes and the four specification states count different things over different " +
        "populations. Adding them, or reporting one as the other, is a conformance failure.",
    },

    published_counts_of_the_membership: src.published_counts,

    alliance_surface_probe: {
      note: "What the alliance's own site returned to our reader on this run. A status code, nothing more.",
      read: allianceProbes.map((p) => ({
        url: p.url, access_date: p.access_date, http_status: p.http_status,
        extracted_chars: p.extracted_chars ?? null, content_sha256: p.content_sha256 ?? null,
        ...(p.error ? { error: p.error } : {}),
      })),
      organisations_named: namedOnAllianceSurface,
      organisations_named_note:
        "Names found in the extracted visible text of the home page. On the first read the only match was the Linux " +
        "Foundation, in the copyright line, because the alliance is a Linux Foundation project — not in a member listing.",
    },

    selection_criteria:
      "Every organisation named in the founding vendor's public announcement of the alliance is on this map, in the " +
      "order that announcement prints them, with nothing added and nothing left out. The maintainer's own row is " +
      "appended and is excluded from the denominator of the measurement. There is no other selection rule, because a " +
      "selection rule is the one place an editorial agenda can hide (spec §10.3).",
    right_of_reply:
      "If a row here is wrong about your organisation — a quote out of context, a page we missed, a link to the wrong " +
      "company — that is a defect in this record and we will correct it. Write to nicholas@csoai.org. Corrections are " +
      `published at ${BASE}/api/corrections. We will not remove a row as a favour and we will not add one as a favour; ` +
      "nothing here can be bought, and no organisation can pay to be listed, delisted or classed differently (spec §10.2).",
    re_read:
      "Every claim in this registry carries next_read_utc. The weekly loop re-reads each source, recomputes its " +
      "digest with the same extractor, and appends any difference to that claim's observed_changes as an OBSERVED " +
      "CHANGE REQUIRING REVIEW. An observed change is a statement about two digests. It is never a finding, never an " +
      "allegation, and nothing is sent to any organisation named here.",
    does_not_prove: DOES_NOT_PROVE_BASE,

    merkle: {
      algorithm: "RFC 9162 §2.1 Merkle Tree Hash (leaf 0x00, node 0x01, split at the largest power of two below n; no odd-node duplication)",
      leaves: "artifact_sha256 of each claim in claims[], as bytes, sorted ascending",
      n_leaves: leaves.length,
      root: mth(leaves),
      not_the_public_card_root:
        "This is not the public card root at /root.json, which is an older, separate structure over a separate corpus " +
        "and uses a different shape (spec §7.3). The two are never reconciled, added or substituted.",
    },
    signature_state: "unsigned until the sidecar osaia-membership-2026-09-23.signed.json is published beside this file; see spec §9.1 — an unsigned registry says these bytes existed by this time, a signed one says this key committed to them",
    timestamp_state: "SUBMITTED — see the .ots receipt beside this file. Submitted is not anchored (spec §8.1): the receipt stays a calendar commitment until its upgrade has been run and its attestation path verified.",

    claims: artifacts,
    organisations: rows,
    ...(notes.length ? { build_notes: notes } : {}),
  };

  // spec §7.1: the registry digest is over the canonical bytes of the registry object without
  // registry_digest itself. A field cannot be inside its own digest.
  registry.registry_digest = sha256(canonicalBytes(registry));

  const body = JSON.stringify(registry, null, 1) + "\n";

  // Refuse to write a registry whose artifacts the reference verifier rejects. A producer that
  // ships a non-conforming artifact has published the defect it exists to prevent.
  let bad = 0;
  for (const a of artifacts) {
    const { ok, errors } = verifyArtifact(a);
    if (!ok) { bad++; console.error(`REJECTED ${a.claim_id}`); for (const e of errors) console.error("  · " + e); }
  }
  if (bad) { console.error(`${bad} artifact(s) do not conform — nothing written`); process.exit(1); }

  if (mode === "check") {
    if (!existsSync(OUT)) { console.error(`[osaia] MISSING ${OUT}`); process.exit(1); }
    const have = JSON.parse(readFileSync(OUT, "utf8"));
    const same =
      have.totals.by_evidence_class && CLASSES.every((c) => have.totals.by_evidence_class[c] === byClass[c]) &&
      have.organisations.length === rows.length &&
      have.claims.length === artifacts.length;
    if (!same) {
      console.error("[osaia] DRIFT: the committed registry's row and class counts differ from a fresh read.");
      console.error("  committed:", JSON.stringify(have.totals.by_evidence_class), have.organisations.length, "rows");
      console.error("  fresh:    ", JSON.stringify(byClass), rows.length, "rows");
      process.exit(1);
    }
    console.log(`[osaia] OK — ${rows.length} rows, ${artifacts.length} artifacts, ${JSON.stringify(byClass)}`);
    return;
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, body);
  console.log(
    `[osaia] wrote ${OUT.replace(ROOT + "/", "")} — ${rows.length} rows ` +
      `(${CLASSES.map((c) => `${c} ${byClass[c]}`).join(", ")}), ${artifacts.length} artifacts ` +
      `(${STATES.map((s) => `${s} ${byState[s]}`).join(", ")}), merkle ${registry.merkle.root.slice(0, 12)}…, ` +
      `sha256 ${sha256(Buffer.from(body, "utf8"))}`,
  );
  for (const nt of notes) console.log("  NOTE " + nt);
}

main().catch((err) => { console.error(String(err && err.stack || err)); process.exit(1); });
