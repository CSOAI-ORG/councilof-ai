#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";


/**
 * simulatedQuorumProblems — every way a council artifact could claim a consensus it never held.
 * Returns [] for a fail-closed observation. Shared by the live check and the selftest so the two
 * can never drift apart; an unparseable file is itself a problem rather than a silent pass.
 */
function simulatedQuorumProblems(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    // A vote-chain is line-delimited JSON, not one object — the 7 quarantined .jsonl files each
    // hold 33 records of {"vote":"YES","sig":...}. Parsing the whole file throws, and returning
    // "unparseable" here would have been a pass-by-accident for exactly the worst artifact type.
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const records = [];
    for (const line of lines) {
      try {
        records.push(JSON.parse(line));
      } catch (e) {
        return [`is neither JSON nor line-delimited JSON (${e.message})`];
      }
    }
    if (records.length === 0) return ["is empty"];
    const cast = records.filter((r) => typeof r?.vote === "string");
    const signed = records.filter((r) => typeof r?.sig === "string" && r.sig.length > 0);
    const found = [];
    if (cast.length > 0) found.push(`carries ${cast.length} cast vote records`);
    if (signed.length > 0) found.push(`carries ${signed.length} per-voter signatures`);
    return found.length > 0 ? found : ["is a vote chain with no fail-closed declaration"];
  }
  const problems = [];
  if (doc.quorum_reached === true) problems.push("claims quorum_reached: true");
  if (Number(doc.yes_count) > 0) problems.push(`claims yes_count ${doc.yes_count}`);
  if (Number(doc.evaluated_vote_count) > 0) problems.push(`claims ${doc.evaluated_vote_count} evaluated votes`);
  const votes = Array.isArray(doc.votes) ? doc.votes : [];
  if (votes.length > 0) problems.push(`carries ${votes.length} vote records`);
  if (votes.some((v) => typeof v?.sig === "string" && v.sig.length > 0)) {
    problems.push("carries per-voter signatures");
  }
  // Every document here must state, in one of the two vocabularies the honest producer uses, that
  // BFT is not demonstrated: a quorum observation says bft_status, a role registry says bft. The
  // two QUARANTINED types are caught precisely because neither says either — the fabricated
  // quorum-vote asserts a reached quorum and no disclaimer, and the council-manifest lists 33
  // seats and a quorum of 23 while stating nothing about credentials, independence or BFT.
  // Requiring bft_status alone was too narrow and rejected the honest registry; accepting silence
  // would be too wide and admit the manifest. Both selftest samples below hold this rule to it.
  const declaresNotDemonstrated =
    doc.bft_status === "NOT_DEMONSTRATED" || doc.bft === "NOT_DEMONSTRATED";
  if (!declaresNotDemonstrated) {
    problems.push(
      "does not state NOT_DEMONSTRATED in bft_status or bft " +
        `(got bft_status=${JSON.stringify(doc.bft_status)}, bft=${JSON.stringify(doc.bft)})`,
    );
  }
  return problems;
}

const UI_TRUTH_RULES = [
  ["wrong-threshold", /\b22\s*(?:\/|out of)\s*33\b/i],
  ["all-votes-public", /\ball council votes are public\b/i],
  ["live-council-voting", /\blive council voting\b|\bcouncil voting (?:session )?(?:is|are) (?:live|active)\b|\blive consensus rate\b/i],
  ["fabricated-independence", /\b33\s+(?:independent|measurement)\s+agents\b/i],
  ["fabricated-consensus", /\bdemocratic consensus from 33 AI agents\b/i],
  ["fabricated-resilience", /\bbias-resistant,\s*manipulation-proof\b|\bfault-aware council consensus\b/i],
  ["live-33-seat-council", /(?<!\bno\s)\blive\s+33[- ](?:agent|seat)\s+(?:BFT\s+)?council\b/i],
  ["live-five-agent-council", /\b(?:convene|run|start)\s+(?:the\s+)?live\s+(?:5|five)[- ]agent\s+council\b/i],
  ["roleplay-as-consensus", /\bthe council agrees\b|\bfive (?:ai )?agents (?:will )?(?:debate|deliberate)\b|\bmulti-agent consensus (?:decides|produces|provides)\b|\bconsensus-based decision governance\b/i],
  ["signed-consensus-verdict", /\bed25519-signed verdicts\b|\bsigns every verdict\b|\bemails? (?:you )?a signed gap report\b/i],
  ["continuous-council-monitoring", /\bthe council continuously monitors\b|\bcouncil independently reviews your compliance\b|\bcsoai monitors global ai regulations and publishes updates monthly\b/i],
  ["unbound-dr0007-number", /\bn_eff\s*=?\s*1\.21\b|\b1\.21 effective votes\b/i],
  ["independent-agent-debate", /\bwatch five independent agents debate\b/i],
  ["council-engine-live", /\bcouncil engine\s*[·:—-]\s*live\b/i],
  ["all-decisions-signed", /\bevery (?:decision|governed action)(?: i make)? is (?:ed25519-)?(?:signed|sealed)\b/i],
  ["cryptography-behind-every-move", /\bcryptographic proof behind every move\b|\bevery dot[^.\n]{0,100}\bmeasured, signed record\b|\bevery event[^.\n]{0,100}\bever signed\b/i],
  ["single-live-council-engine", /\ball running on one Council engine\b|\bCouncil engine and every Layer 0 protocol, checked live\b/i],
  ["all-agents-signed", /\beach one accountable and each one signed\b|\ball sealed to Layer 0\b|\bgoverned swarms[^.\n]{0,100}\beach one signed\b/i],
  ["government-live-operations", /\breal-time oversight capabilities for government regulators\b|\bjoin 47 regulatory bodies\b|\b24\/7 government support line\b/i],
  ["daily-regulation-watcher", /\bcorpus watcher hashes every provision daily\b/i],
  ["council-reviewed-determination", /\bsigned,?\s+council-reviewed determination\b/i],
  ["unconditional-layer0-seal", /\bsealed to Layer 0\b/i],
  ["wrong-gspc-chat-endpoint", /\/api\/gspc\b[^.\n]{0,80}\b(?:chat|model) endpoint|\b(?:chat|model) endpoint[^.\n]{0,80}\/api\/gspc\b/i],
];

function detectUiTruthViolations(source) {
  const violations = UI_TRUTH_RULES
    .filter(([, pattern]) => pattern.test(source))
    .map(([code]) => code);

  for (const line of source.split("\n")) {
    const claimsSignedVerdict = /\bseals? a signed verdict\b|\bseal a verdict with a Layer 0 ledger hash\b|\bverdict that can(?:no|'?)t be captured or bribed\b/i.test(line);
    const explicitlyDeniesSignedVerdict = /\b(?:does|do|is|are|will|can)\s+not\b[^.\n]{0,180}\bseal(?:s)? (?:a )?(?:signed )?verdict\b/i.test(line);
    if (claimsSignedVerdict && !explicitlyDeniesSignedVerdict) {
      violations.push("unproved-signed-council-verdict");
    }

    const claimsEveryOutputSigned = /\bevery (?:measurement run|output)(?:[^.\n]{0,40})\b(?:is|can be|produced as)\s+(?:a\s+)?(?:signed|sealed)\b/i.test(line);
    const deniesEveryOutputSigned = /\b(?:not every|does not automatically|only (?:a|an|specifically))\b[^.\n]{0,140}\b(?:signed|sealed)\b/i.test(line);
    if (claimsEveryOutputSigned && !deniesEveryOutputSigned) {
      violations.push("every-output-signed");
    }

    if (/\bevery output, every cross-boundary call, every containment event is logged, signed, and indexed\b/i.test(line)) {
      violations.push("continuous-universal-containment");
    }

    const blanketSigned = /\bevery\s+(?:(?:MCP|tool)\s+)?(?:call|action|verdict|decision|measurement|response|output|round|seat|assertion)s?\b[^.\n]{0,140}\b(?:signed|sealed|signature)\b|\bsigns every\s+(?:decision|verdict|action|call)\b/i.test(line);
    const blanketSignedDenied = /\b(?:not every|does not automatically|is not automatically|are not automatically|does not prove|do not prove|only when|only a|only an)\b[^.\n]{0,180}\b(?:signed|sealed|signature)\b|\bevery\s+(?:measurement|verdict|record)\s+(?:that\s+)?we publish\b/i.test(line);
    if (blanketSigned && !blanketSignedDenied) {
      violations.push("blanket-signing-claim");
    }

    const claimsLiveCouncil = /\blive Council\b/i.test(line);
    const deniesLiveCouncil = /\b(?:not|no|never|without)\b[^.\n]{0,100}\blive Council\b|\blive Council\b[^.\n]{0,100}\b(?:not|no|never)\b/i.test(line);
    const futureLiveCouncil = /\bfuture live Council\b/i.test(line);
    if (claimsLiveCouncil && !deniesLiveCouncil && !futureLiveCouncil) {
      violations.push("generic-live-council");
    }

    if (/\b(?:signed )?governance artifact\b/i.test(line) && !/\b(?:published|verify|if|when|not automatically|evidence state)\b/i.test(line)) {
      violations.push("unconditional-signed-artifact");
    }

    const mentionsPqc = /\b(?:PQC|post[- ]quantum|ML-DSA(?:-65)?)\b/i.test(line);
    const saysBuilt = /\b(?:is|are)\s+built\b|\bbuilt(?:\s+but|\s+and|,)\s+not shipped\b/i.test(line);
    const saysNotBuilt = /\b(?:no|not)\b[^.\n]{0,120}\b(?:is|are)?\s*built\b/i.test(line);
    if (mentionsPqc && saysBuilt && !saysNotBuilt) {
      violations.push("pqc-built");
      break;
    }
  }

  return [...new Set(violations)];
}

const PUBLIC_SURFACE_TRUTH_RULES = [
  ["universal-receipt-signing", /\bevery receipt is signed\b/i],
  ["universal-three-anchor-claim", /\bevery measurement\b[^.\n]{0,120}\bthree independent live anchors\b/i],
  ["universal-press-signing", /\bevery press release is signed\b/i],
  ["universal-result-signing", /\bsigns? every result\b|\bsign every result\b/i],
  ["universal-obligation-pack", /\bpre-built evidence packs? for every compliance obligation\b/i],
  ["confirmed-bitcoin-root-claim", /\bpublished roots?\b[^.\n]{0,120}\b(?:confirmed|carry)\b[^.\n]{0,80}\bBitcoin (?:block|attestation)/i],
  ["unverified-live-x402-price", /\blive\b[^.\n]{0,100}(?:\$1(?:\.00)?\b|\b1(?:\.00)?\s*USDC\b)|(?:\$1(?:\.00)?\b|\b1(?:\.00)?\s*USDC\b)[^.\n]{0,100}\blive\b/i],
];

function detectPublicSurfaceTruthViolations(source) {
  return PUBLIC_SURFACE_TRUTH_RULES
    .filter(([, pattern]) => pattern.test(source))
    .map(([code]) => code);
}

function assertCurrentGspcClaims(board) {
  const axes = board.axes ?? [];
  for (const axis of axes) {
    if (axis.public_leader_state === "EXCLUDED_OWN_MODEL") {
      assert.equal(axis.separation, "UNTESTED");
      assert.equal("measurement_note" in axis, false);
      assert.deepEqual(
        {
          state: axis.historical_measurement_record?.state,
          scope: axis.historical_measurement_record?.scope,
          current: axis.historical_measurement_record?.does_not_assert_current_public_fields,
        },
        {
          state: "SUPERSEDED_FOR_PUBLIC_RANKING",
          scope: "ORIGINAL_RUN_INCLUDED_EXCLUDED_OWN_MODEL",
          current: true,
        },
      );
    }
    if (axis.public_leader_state === "NO_SIGNED_CARD") {
      assert.equal(axis.separation, "UNTESTED");
      assert.equal("measurement_note" in axis, false);
      assert.equal(
        axis.historical_measurement_record?.scope,
        "ORIGINAL_RUN_NAMED_UNCARDED_LEADER",
      );
      assert.equal(
        axis.historical_measurement_record?.does_not_assert_current_public_fields,
        true,
      );
    }
  }

  const financial = axes.filter((axis) => axis.family === "financial");
  const signed = financial.filter(
    (axis) => axis.run_attestation === "ED25519_SIGNED",
  );
  const unsigned = financial.filter(
    (axis) => axis.run_attestation === "CONTENT_ADDRESSED_UNSIGNED",
  );
  assert.equal(financial.length, 8);
  assert.equal(signed.length, 1);
  assert.equal(unsigned.length, 7);
  assert.equal(board.totals.financial_run_attestations.ed25519_signed, signed.length);
  assert.equal(
    board.totals.financial_run_attestations.content_addressed_unsigned,
    unsigned.length,
  );
  assert.match(board.totals.sweep_note, /1 run artifact carries an Ed25519 signature/);
  assert.match(board.totals.sweep_note, /7 are content-addressed but unsigned/);
  assert.doesNotMatch(board.totals.sweep_note, /each (?:of the )?8[^.]*signed run/i);
}

function findUnreviewedPublicHtmlAppRoutes(
  appRoutes,
  reviewedRoutes,
  fileExists = existsSync,
) {
  const collisions = [...new Set(appRoutes)]
    .map((route) => route.replace(/\/+$/, "") || "/")
    .filter((route) => route !== "/" && route.startsWith("/"))
    .filter((route) => {
      const relative = route.replace(/^\//, "");
      return (
        fileExists(join("public", `${relative}.html`)) ||
        fileExists(join("public", relative, "index.html"))
      );
    });
  return collisions.filter((route) => !reviewedRoutes.has(route));
}

if (process.argv.includes("--selftest")) {
  const fixtureDir = "scripts/fixtures/council-runtime-truth";
  const safe = readFileSync(join(fixtureDir, "safe.txt"), "utf8");
  assert.deepEqual(detectUiTruthViolations(safe), []);

  for (const [fixture, expected] of [
    ["wrong-threshold.txt", "wrong-threshold"],
    ["live-council.txt", "live-33-seat-council"],
    ["pqc-built.txt", "pqc-built"],
    ["fabricated-consensus.txt", "fabricated-consensus"],
    ["live-five-agent.txt", "live-five-agent-council"],
    ["signed-consensus-verdict.txt", "signed-consensus-verdict"],
    ["continuous-council-monitoring.txt", "continuous-council-monitoring"],
    ["unreproducible-dr0007.txt", "unbound-dr0007-number"],
    ["independent-agent-debate.txt", "independent-agent-debate"],
    ["council-engine-live.txt", "council-engine-live"],
    ["all-decisions-signed.txt", "all-decisions-signed"],
    ["government-live-operations.txt", "government-live-operations"],
    ["daily-regulation-watcher.txt", "daily-regulation-watcher"],
  ]) {
    const violations = detectUiTruthViolations(
      readFileSync(join(fixtureDir, fixture), "utf8"),
    );
    assert.ok(violations.includes(expected), `${fixture} must trigger ${expected}`);
  }

  for (const [source, expected] of [
    ["cryptographic proof behind every move", "cryptography-behind-every-move"],
    ["the Council seals a signed verdict", "unproved-signed-council-verdict"],
    ["all running on one Council engine", "single-live-council-engine"],
    ["each one accountable and each one signed", "all-agents-signed"],
    ["Every measurement run is signed", "every-output-signed"],
    ["every output, every cross-boundary call, every containment event is logged, signed, and indexed", "continuous-universal-containment"],
    ["Every tool call emits signed evidence", "blanket-signing-claim"],
    ["The live Council decides", "generic-live-council"],
    ["Get a signed, council-reviewed determination", "council-reviewed-determination"],
    ["Governed answer sealed to Layer 0", "unconditional-layer0-seal"],
    ["Create your first signed governance artifact", "unconditional-signed-artifact"],
    ["The /api/gspc chat endpoint returns a model answer", "wrong-gspc-chat-endpoint"],
  ]) {
    assert.ok(
      detectUiTruthViolations(source).includes(expected),
      `${source} must trigger ${expected}`,
    );
  }
  assert.deepEqual(detectUiTruthViolations("This is not a live Council; only a published card is signed."), []);
  assert.deepEqual(detectUiTruthViolations("A configured /api/chat model endpoint returns one model answer, not a Council vote."), []);
  assert.deepEqual(detectUiTruthViolations("Not every tool response is signed."), []);
  for (const [source, expected] of [
    ["Every receipt is signed", "universal-receipt-signing"],
    ["Every measurement is bound to three independent live anchors", "universal-three-anchor-claim"],
    ["Every press release is signed", "universal-press-signing"],
    ["We sign every result", "universal-result-signing"],
    ["Pre-built evidence packs for every compliance obligation", "universal-obligation-pack"],
    ["Published roots carry confirmed Bitcoin block attestations", "confirmed-bitcoin-root-claim"],
    ["The live rail costs $1.00 per call", "unverified-live-x402-price"],
  ]) {
    assert.ok(
      detectPublicSurfaceTruthViolations(source).includes(expected),
      `${source} must trigger ${expected}`,
    );
  }

  const goodBoard = {
    axes: [
      {
        axis: "governance",
        family: "gspc",
        separation: "UNTESTED",
        public_leader_state: "EXCLUDED_OWN_MODEL",
        historical_measurement_record: {
          state: "SUPERSEDED_FOR_PUBLIC_RANKING",
          scope: "ORIGINAL_RUN_INCLUDED_EXCLUDED_OWN_MODEL",
          does_not_assert_current_public_fields: true,
        },
      },
      ...Array.from({ length: 8 }, (_, index) => ({
        axis: `financial-${index}`,
        family: "financial",
        run_attestation:
          index === 0 ? "ED25519_SIGNED" : "CONTENT_ADDRESSED_UNSIGNED",
      })),
    ],
    totals: {
      sweep_note:
        "1 run artifact carries an Ed25519 signature; 7 are content-addressed but unsigned.",
      financial_run_attestations: {
        ed25519_signed: 1,
        content_addressed_unsigned: 7,
      },
    },
  };
  assert.doesNotThrow(() => assertCurrentGspcClaims(goodBoard));
  const contradictoryBoard = structuredClone(goodBoard);
  contradictoryBoard.axes[0].measurement_note = "The excluded model leads.";
  assert.throws(() => assertCurrentGspcClaims(contradictoryBoard));
  const overclaimedBoard = structuredClone(goodBoard);
  overclaimedBoard.totals.financial_run_attestations.ed25519_signed = 8;
  assert.throws(() => assertCurrentGspcClaims(overclaimedBoard));

  // Both static ownership forms can silently shadow a maintained App route.
  // The guard must reject either form unless the route was explicitly reviewed.
  const collisionFixture = new Set([
    join("public", "flat.html"),
    join("public", "nested", "index.html"),
    join("public", "reviewed.html"),
  ]);
  assert.deepEqual(
    findUnreviewedPublicHtmlAppRoutes(
      ["/flat", "/nested/", "/reviewed", "/clean"],
      new Set(["/reviewed"]),
      (path) => collisionFixture.has(path),
    ),
    ["/flat", "/nested"],
  );

  // THE ACTIVE-QUEUE RULE MOVED FROM PATH TO CONTENTS, so it must be proved on real bytes that it
  // still catches what the path rule caught. These are the actual quarantined artifacts from
  // 2026-09-04 — if a future edit softens simulatedQuorumProblems into something that admits a
  // fabricated unanimous quorum, this fails here rather than in production.
  const QUARANTINE = "_quarantine/simulated-bft-2026-09-04";
  // BOTH quarantined shapes, not just the obvious one. Checking only quorum-vote-* would have let
  // a rule through that silently admits council-manifest-*, which carries no consensus fields at
  // all and would pass any check written around yes_count and votes.
  const simulatedSamples = readdirSync(QUARANTINE).filter((n) =>
    /^(?:quorum-vote|council-manifest|vote-chain)-.*\.jsonl?$/.test(n),
  );
  assert.ok(simulatedSamples.length >= 2, "selftest needs quarantined artifacts of both shapes");
  for (const shape of ["quorum-vote", "council-manifest", "vote-chain"]) {
    assert.ok(
      simulatedSamples.some((n) => n.startsWith(shape)),
      `selftest must cover the quarantined ${shape} shape`,
    );
  }
  for (const name of simulatedSamples) {
    const problems = simulatedQuorumProblems(readFileSync(join(QUARANTINE, name), "utf8"));
    assert.ok(
      problems.length > 0,
      `simulatedQuorumProblems must reject the quarantined artifact ${name}, but found nothing wrong`,
    );
  }
  // and it must ADMIT a genuinely fail-closed observation, or the gate blocks honest work
  assert.deepEqual(
    simulatedQuorumProblems(
      JSON.stringify({
        status: "UNCHECKABLE",
        evaluated_vote_count: 0,
        yes_count: 0,
        votes: [],
        quorum_reached: false,
        bft_status: "NOT_DEMONSTRATED",
        reason_code: "NO_INDEPENDENT_VERIFIABLE_VOTES",
      }),
    ),
    [],
  );
  assert.deepEqual(
    simulatedQuorumProblems(
      JSON.stringify({
        schema: "csoai.council-role-registry/0.2",
        status: "DESIGN_ONLY",
        credentials: "NOT_CONFIGURED",
        independence: "NOT_MEASURED",
        bft: "NOT_DEMONSTRATED",
      }),
    ),
    [],
  );
  // a file that is not JSON at all is a problem, never a silent pass
  assert.ok(simulatedQuorumProblems("not json").length > 0);

  console.log("council-runtime-truth-gate selftest: PASS");
  process.exit(0);
}

const appSource = readFileSync("client/src/App.tsx", "utf8");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function appPageSource(importPath) {
  const relative = importPath.startsWith("@/")
    ? importPath.slice(2)
    : importPath.startsWith("./")
      ? importPath.slice(2)
      : importPath;
  const base = join("client/src", relative);
  for (const candidate of [`${base}.tsx`, `${base}.ts`, join(base, "index.tsx")]) {
    if (existsSync(candidate)) return candidate;
  }
  assert.fail(`App.tsx page import ${importPath} has no source file`);
}

const CODE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx", ".json"]);

function resolveClientImport(fromPath, rawSpecifier) {
  const specifier = rawSpecifier.split("?")[0];
  if (!(specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("@/"))) {
    return null;
  }
  const base = normalize(
    specifier.startsWith("@/")
      ? join("client/src", specifier.slice(2))
      : join(dirname(fromPath), specifier),
  );
  if (!base.startsWith(normalize("client/src/"))) return null;

  const extension = extname(base);
  if (extension && !CODE_EXTENSIONS.has(extension)) return null;
  const candidates = extension
    ? [base]
    : [
        ...[".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"].map((suffix) => `${base}${suffix}`),
        ...["index.tsx", "index.ts", "index.jsx", "index.js", "index.mjs"].map((name) => join(base, name)),
      ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function transitiveClientSources(entries) {
  const visited = new Set();
  const pending = [...entries];
  while (pending.length) {
    const sourcePath = normalize(pending.pop());
    if (visited.has(sourcePath)) continue;
    visited.add(sourcePath);
    const source = readFileSync(sourcePath, "utf8");
    const specifiers = new Set();
    for (const pattern of [
      /\bfrom\s+["']([^"']+)["']/g,
      /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
      /\bimport\s+["']([^"']+)["']/g,
    ]) {
      for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
    }
    for (const specifier of specifiers) {
      const resolved = resolveClientImport(sourcePath, specifier);
      if (resolved && !visited.has(resolved)) pending.push(resolved);
    }
  }
  return visited;
}

// Derive the audit set from App.tsx itself. A manually maintained route list had
// covered 21 pages while App.tsx exposed more than 300, allowing routed claims to
// escape the truth gate. New page imports now enter this scan automatically.
const appPageImports = new Map();
for (const match of appSource.matchAll(
  /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(["'](\.\/pages\/[^"']+)["']/g,
)) {
  appPageImports.set(match[1], match[2]);
}
for (const match of appSource.matchAll(
  /import\s+(\w+)\s+from\s+["']((?:\.\/|@\/)pages\/[^"']+)["']/g,
)) {
  appPageImports.set(match[1], match[2]);
}

const routeBlock = appSource.slice(appSource.indexOf("<Switch>"));
const routedPagePaths = new Set();
const unusedPageImports = [];
for (const [component, importPath] of appPageImports) {
  const usedByRoute = new RegExp(
    `(?:component=\\{${escapeRegExp(component)}\\}|<${escapeRegExp(component)}(?:\\s|\\/|>))`,
  ).test(routeBlock);
  if (usedByRoute) routedPagePaths.add(appPageSource(importPath));
  else unusedPageImports.push(component);
}
assert.deepEqual(
  unusedPageImports.sort(),
  ["FrameworkDetail", "Leaderboard"],
  "App.tsx page imports changed: every new page import must be routed or explicitly removed",
);
assert.ok(
  routedPagePaths.size >= 250,
  `derived routed-page coverage unexpectedly fell to ${routedPagePaths.size}`,
);

assert.equal(existsSync("client/src/pages/FAQ.tsx"), true);
assert.doesNotMatch(
  appSource,
  /import\(["']\.\/pages\/FAQ["']\)/,
  "legacy FAQ.tsx is not the routed FAQ; audit FaqPage.tsx instead",
);

const altPageSource = readFileSync("client/src/pages/AltPage.tsx", "utf8");
assert.match(
  appSource,
  /const\s+AltPage\s*=\s*lazy\(\(\)\s*=>\s*import\(["']\.\/pages\/AltPage["']\)\)/,
  "AltPage.tsx must remain imported by App.tsx",
);
for (const [route, comparison] of [
  ["/vanta-alternative", "vanta"],
  ["/onetrust-alternative", "onetrust"],
  ["/credo-ai-alternative", "credo"],
]) {
  assert.match(
    appSource,
    new RegExp(`<Route\\s+path=["']${escapeRegExp(route)}["'][^>]*>\\{\\(\\)\\s*=>\\s*<AltPage\\s+comp=["']${comparison}["']\\s*\\/>\\}\\s*<\\/Route>`),
    `AltPage.tsx must remain reachable at ${route}`,
  );
}

// These non-page sources are either mounted in the shared shell or feed that
// shell. Keep the list explicit so review does not confuse an on-disk demo with
// a routed runtime; mount/import assertions below fail closed if the shell moves.
const sharedTruthSources = [
  "client/src/components/Header.tsx",
  "client/src/components/Footer.tsx",
  "client/src/components/GlobalSearch.tsx",
  "client/src/components/BuiltOnFooter.tsx",
  "client/src/components/SovereignDock.tsx",
  "client/src/components/CouncilVote.tsx",
  "client/src/components/home/LivingStages.tsx",
  "client/src/lib/demoTour.ts",
];
assert.match(appSource, /import \{ Header \} from "\.\/components\/Header"/);
assert.match(appSource, /<Header \/>/);
assert.match(appSource, /import \{ Footer \} from "\.\/components\/Footer"/);
assert.match(appSource, /<Footer \/>/);

// Free CobolBridge re-land: /cobol must stay on CobolBridge (no public prices).
assert.match(
  appSource,
  /const\s+CobolBridge\s*=\s*lazy\(\(\)\s*=>\s*import\(["']\.\/pages\/CobolBridge["']\)\)/,
  "CobolBridge.tsx must remain imported by App.tsx",
);
assert.match(
  appSource,
  /<Route path=["']\/cobol["'] component=\{CobolBridge\} \/>/,
  "/cobol must route to CobolBridge (not ContentReviewNotice)",
);
assert.match(
  appSource,
  /<Route path=["']\/cobolbridge["'] component=\{CobolBridge\} \/>/,
  "/cobolbridge must remain an alias to CobolBridge",
);
assert.doesNotMatch(
  appSource,
  /<Route path=["']\/cobol["'] component=\{ContentReviewNotice\} \/>/,
  "/cobol must not remain on ContentReviewNotice",
);

const headerSource = readFileSync("client/src/components/Header.tsx", "utf8");
assert.match(headerSource, /import \{ GlobalSearch \} from ['"]@\/components\/GlobalSearch['"]/);
assert.match(headerSource, /<GlobalSearch\b/);

// Audit every local module transitively reachable from a routed page or the
// shared shell. Direct-page scanning missed copy imported by those pages (for
// example homepage testimonials and demo narration), which made route coverage
// look complete while public claims still escaped it.
const activeClientSources = transitiveClientSources([
  "client/src/App.tsx",
  ...routedPagePaths,
  ...sharedTruthSources,
  "client/src/pages/AltPage.tsx",
]);
assert.ok(
  activeClientSources.has("client/src/pages/demoOsSteps.ts"),
  "demo narration transitive imports must remain inside the routed truth audit",
);
assert.equal(
  activeClientSources.has("client/src/data/sectors-content.ts"),
  false,
  "unreviewed generated sector claims must stay outside the routed public graph",
);
assert.equal(
  activeClientSources.has("client/src/data/blog-content.ts"),
  false,
  "unreviewed historic blog claims must stay outside the routed public graph",
);
assert.equal(
  activeClientSources.has("client/src/data/industries-content.ts"),
  false,
  "unreviewed generated industry claims must stay outside the routed public graph",
);
assert.equal(
  activeClientSources.has("client/src/data/frameworks-content.ts"),
  false,
  "unreviewed generated framework claims must stay outside the routed public graph",
);
assert.equal(
  activeClientSources.has("client/src/pages/features/TrainingCertificationFeature.tsx"),
  false,
  "legacy certification marketing must stay outside the routed public graph",
);
assert.equal(
  activeClientSources.has("client/src/pages/EUAIActUrgency.tsx"),
  false,
  "legacy certification urgency marketing must stay outside the routed public graph",
);
for (const sourcePath of [
  "client/src/pages/OscalStudio.tsx",
  "client/src/pages/RegulatorFindings.tsx",
  "client/src/pages/RegulatorFindingsDetail.tsx",
  "client/src/pages/GovernmentPortal.tsx",
  "client/src/pages/Webhooks.tsx",
  "client/src/pages/ComplianceMonitoring.tsx",
  "client/src/pages/McpFleet.tsx",
  "client/src/pages/Distribution.tsx",
  "client/src/pages/StatusPage.tsx",
  "client/src/pages/NewHome-v2.tsx",
  "client/src/pages/RegulationFeed.tsx",
  "client/src/pages/Pressroom.tsx",
  "client/src/pages/GovernmentLinks.tsx",
  "client/src/pages/RegulatoryCompliance.tsx",
  "client/src/pages/EUAIActCompliance.tsx",
  "client/src/pages/NISTAIRMFCompliance.tsx",
  "client/src/pages/AgentRegistry.tsx",
  "client/src/pages/PartnersAdvisory.tsx",
  "client/src/pages/CertificationHowItWorks.tsx",
  "client/src/pages/Support.tsx",
  "client/src/pages/CyberScan.tsx",
  "client/src/pages/CouncilHives.tsx",
  "client/src/pages/LegacyBridge.tsx",
  "client/src/pages/GlobalAIRegulation.tsx",
  "client/src/pages/legal/DataProcessingAgreement.tsx",
  "client/src/pages/legal/ServiceLevelAgreement.tsx",
  "client/src/pages/legal/PrivacyPolicy.tsx",
  "client/src/pages/TrustCenter.tsx",
  "client/src/pages/FoundingMembers.tsx",
  "client/src/pages/EvidenceHub.tsx",
  "client/src/pages/PricingFree.tsx",
  "client/src/pages/CaseStudies.tsx",
  "client/src/pages/Certification.tsx",
  "client/src/pages/Certification-v2.tsx",
  "client/src/pages/CertificationExam.tsx",
  "client/src/pages/CertificationResults.tsx",
  "client/src/pages/ExamReview.tsx",
  "client/src/pages/Technology.tsx",
  "client/src/pages/CharterArticle.tsx",
  "client/src/pages/SystemCard.tsx",
  "client/src/pages/Training-v2.tsx",
  "client/src/pages/Signup.tsx",
  "client/src/pages/Welcome.tsx",
  "client/src/pages/Status.tsx",
  "client/src/pages/SocialConnect.tsx",
  "client/src/pages/SECDisclosure.tsx",
  "client/src/pages/RegistryAll.tsx",
  "client/src/pages/TrainingHub.tsx",
  "client/src/pages/Courses.tsx",
  "client/src/pages/MyCourses.tsx",
  "client/src/pages/CoursePlayer.tsx",
  "client/src/pages/FreeCoursePlayer.tsx",
  "client/src/pages/MyCertificates.tsx",
  "client/src/pages/CEASAITraining.tsx",
  "client/src/pages/TrainingHowItWorks.tsx",
  "client/src/pages/VerifyCertificate.tsx",
  "client/src/pages/StudentProgress.tsx",
  "client/src/pages/CertificateVerification.tsx",
]) {
  assert.equal(
    activeClientSources.has(sourcePath),
    false,
    `${sourcePath} is a legacy prototype and must stay outside the routed public graph`,
  );
}
assert.doesNotMatch(appSource, /data\/(?:sectors-content|industries-content|frameworks-content|blog-content)/);
assert.match(
  appSource,
  /<Route path="\/sectors\/:slug" component=\{ContentReviewNotice\} \/>/,
);
assert.match(
  appSource,
  /<Route path="\/blog\/:slug" component=\{ContentReviewNotice\} \/>/,
);
assert.match(
  appSource,
  /<Route path="\/industries\/:slug" component=\{ContentReviewNotice\} \/>/,
);
assert.match(
  appSource,
  /<Route path="\/frameworks\/:slug" component=\{ContentReviewNotice\} \/>/,
);
assert.match(
  appSource,
  /<Route path="\/features\/training-certification" component=\{ContentReviewNotice\} \/>/,
);
assert.match(
  appSource,
  /<Route path="\/eu-ai-act-urgency" component=\{ContentReviewNotice\} \/>/,
);
for (const route of [
  "/government-portal",
  "/soai-pdca/government",
  "/regulator-findings",
  "/regulator/:id",
  "/mcp-fleet",
  "/distribution",
  "/webhooks",
  "/oscal",
  "/compliance-monitoring",
  "/status",
  "/system",
  "/home-v2",
  "/feed",
  "/press",
  "/pressroom",
  "/government-links",
  "/regulatory-compliance",
  "/compliance/eu-ai-act",
  "/compliance/nist-ai-rmf",
  "/agent-registry",
  "/partners",
  "/advisory",
  "/how-it-works/certification",
  "/support",
  "/scan",
  "/gods-eye",
  "/cyber-scan",
  "/hives",
  "/legacy",
  "/dpa",
  "/data-processing-agreement",
  "/legal/dpa",
  "/global-ai-regulation",
  "/sla",
  "/service-level-agreement",
  "/legal/sla",
  "/privacy-policy",
  "/privacy",
  "/legal/privacy",
  "/trust-center",
  "/security",
  "/founding-members",
  "/evidence",
  "/pricing-free",
  "/case-studies",
  "/certification",
  "/certification/exam",
  "/certification/results",
  "/certification/review",
  "/technology",
  "/architecture",
  "/charter/article/:id",
  "/system-card",
  "/assurance",
  "/systemcard",
  "/training",
  "/signup",
  "/welcome",
  "/system-status",
  "/connect",
  "/sec-disclosure",
  "/sec-ai-disclosure",
  "/registry",
  "/all",
  "/credential-training",
  "/certificate-verification",
  "/how-it-works/training",
  "/verify/:certificateNumber",
  "/training-hub",
  "/courses",
  "/my-courses",
  "/dashboard/progress",
  "/courses/:id/learn",
  "/free-course/:courseId",
  "/verify-certificate/:id",
  "/certificates",
]) {
  assert.match(
    appSource,
    new RegExp(`<Route path=["']${escapeRegExp(route)}["'] component=\\{ContentReviewNotice\\} \\/>`),
  );
}
assert.match(
  appSource,
  /<Route path="\/blog" component=\{ContentReviewNotice\} \/>/,
);

const reviewNoticeSource = readFileSync("client/src/pages/ContentReviewNotice.tsx", "utf8");
assert.match(reviewNoticeSource, /name="robots" content="noindex,nofollow,noarchive"/);
const withdrawnExactRoutes = [...appSource.matchAll(
  /<Route\b[^>]*?\bpath="([^"]+)"[^>]*?\bcomponent=\{ContentReviewNotice\}/g,
)].map((match) => match[1]).filter((route) => !route.includes(":"));
const sitemapSource = readFileSync("public/sitemap.xml", "utf8");
const routeManifestSource = readFileSync("client/src/data/route-manifest.ts", "utf8");
for (const route of withdrawnExactRoutes) {
  assert.doesNotMatch(
    sitemapSource,
    new RegExp(`<loc>https:\/\/councilof\\.ai${escapeRegExp(route)}\/?<\/loc>`),
    `${route} is withdrawn and must not remain in the sitemap`,
  );
  assert.doesNotMatch(
    routeManifestSource,
    new RegExp(`"path":\\s*"${escapeRegExp(route)}"`),
    `${route} is withdrawn and must not remain in the route manifest`,
  );
}

const activeUiSources = [
  ...activeClientSources,
  "public/claims-register.json",
];
for (const sourcePath of activeUiSources) {
  const violations = detectUiTruthViolations(readFileSync(sourcePath, "utf8"));
  assert.deepEqual(
    violations,
    [],
    `${sourcePath} has routed council/PQC truth violations: ${violations.join(", ")}`,
  );
}

function publicTextSurfaces(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...publicTextSurfaces(path));
    else if (/\.(?:html|txt)$/i.test(entry.name)) files.push(path);
  }
  return files;
}

for (const sourcePath of publicTextSurfaces("public")) {
  const violations = detectPublicSurfaceTruthViolations(readFileSync(sourcePath, "utf8"));
  assert.deepEqual(
    violations,
    [],
    `${sourcePath} has public-surface truth violations: ${violations.join(", ")}`,
  );
}

const supportedEvidencePackDoors = new Set(["dora.json", "eu-cra.json"]);
for (const name of readdirSync("public/.well-known").filter((entry) => entry.endsWith(".json"))) {
  const sourcePath = join("public/.well-known", name);
  const document = JSON.parse(readFileSync(sourcePath, "utf8"));
  if (!String(document.schema ?? "").startsWith("csoai.door/")) continue;
  assert.equal(document.measurement?.status, "UNMAPPED", `${name} is a discovery door, not a live measurement`);
  assert.equal(document.measurement?.axes_covered, 0, `${name} must not borrow the global 22-axis count`);
  if (supportedEvidencePackDoors.has(name)) {
    assert.match(document.door?.evidence_pack ?? "", /\/api\/evidence-bundle\?obligation=(?:dora|eu-cra)$/);
    assert.match(document.door?.evidence_pack_status ?? "", /^SUPPORTED_REQUEST/);
  } else {
    assert.equal(document.door?.evidence_pack, null, `${name} has no supported evidence-bundle resolver`);
    assert.match(document.door?.evidence_pack_status ?? "", /^UNMAPPED/);
  }
}

const scittDoor = JSON.parse(readFileSync("public/.well-known/scitt.json", "utf8"));
assert.equal(scittDoor.implementation_status, "PLANNED");
assert.equal(scittDoor.measurement?.status, "UNMAPPED");
assert.equal(scittDoor.measurement?.axes_covered, 0);
assert.equal(scittDoor.door?.evidence_pack, null);
assert.deepEqual(scittDoor.statements, []);
assert.equal(scittDoor.verification?.scitt_receipt, null);

const independence = JSON.parse(
  readFileSync("public/interop/council-independence.json", "utf8"),
);
const claims = JSON.parse(readFileSync("public/claims-register.json", "utf8"));
const overviewSources = [
  readFileSync("client/src/components/home/LivingStages.tsx", "utf8"),
  readFileSync("client/src/pages/Layer0.tsx", "utf8"),
  readFileSync("public/claims-register.json", "utf8"),
];
const blogSource = readFileSync("client/src/data/blog-content.ts", "utf8");
const voteSource = readFileSync(
  "client/src/components/CouncilVote.tsx",
  "utf8",
);
const charterArticleSource = readFileSync(
  "client/src/pages/CharterArticle.tsx",
  "utf8",
);
const tryCouncilSource = readFileSync(
  "client/src/pages/TryCouncil.tsx",
  "utf8",
);
const complianceHowItWorksSource = readFileSync(
  "client/src/pages/ComplianceHowItWorks.tsx",
  "utf8",
);
const retiredGenerator = readFileSync(
  "scripts/badger/csoai-engine-bft.py",
  "utf8",
);
const failClosedCouncilGenerator = readFileSync(
  "scripts/badger/csoai-bft-council.py",
  "utf8",
);
const retiredWiringGenerator = readFileSync(
  "scripts/badger/csoai-wiring-wave.py",
  "utf8",
);

assert.equal(independence.assessment.n_eff, 1);
assert.equal(independence.assessment.rho, 1);
assert.equal(new Set(independence.legs.map((leg) => leg.provider)).size, 2);
assert.ok(
  independence.does_not_establish.includes(
    "Fault tolerance. n_eff is a measurement of independence, not a guarantee.",
  ),
);
assert.equal(
  claims.claims.find((claim) => claim.id === "CR-007")?.status,
  "retired",
);
const pqcClaim = claims.claims.find((claim) => claim.id === "CR-006");
assert.equal(pqcClaim?.status, "planned");
assert.match(pqcClaim?.notes ?? "", /Planned and scaffolded only/);
assert.match(
  pqcClaim?.notes ?? "",
  /No ML-DSA signer or runtime is built or published/,
);
assert.doesNotMatch(pqcClaim?.notes ?? "", /Built, not shipped/);
for (const source of overviewSources) {
  assert.match(source, /historical numeric result/);
  assert.match(source, /unbound/);
  assert.match(source, /cited result(?:s\/n_eff\.json)? artifact is absent/);
  assert.match(source, /latest (?:published )?point experiment/);
  assert.match(source, /rho=1 and n_eff=1/);
  assert.match(source, /independent review or fault tolerance/);
  assert.match(source, /\/interop\/council-independence\.json/);
}
assert.equal(
  existsSync("results/n_eff.json"),
  false,
  "DR-0007's historical numeric result must remain unbound while results/n_eff.json is absent",
);
assert.doesNotMatch(
  blogSource,
  /\bn_eff\s*=?\s*1\.21\b|\b1\.21 effective votes\b/i,
  "routed blog content must not present DR-0007's unbound historical number as a result",
);
assert.match(blogSource, /historical numeric result is (?:now )?unbound/);
assert.match(blogSource, /latest (?:published |bound )?point test records rho=1 and n_eff=1/);
assert.match(voteSource, /Math\.floor\(\(2 \* N\) \/ 3\) \+ 1/);
assert.match(voteSource, /Design simulation only/);
assert.match(charterArticleSource, /\/interop\/council-independence\.json/);
assert.match(charterArticleSource, /rho=1 and n_eff=1/);
assert.match(charterArticleSource, /not treated\s+as independently reproducible here/);
assert.doesNotMatch(
  charterArticleSource,
  /DR-0007 (?:result|run) measured n_eff\s*=?\s*1\.21/i,
);
assert.match(tryCouncilSource, /Local classification complete — no Council vote/);
assert.match(tryCouncilSource, /33 seats and a target threshold of 23\/33/);
assert.match(tryCouncilSource, /it is not live/);
assert.match(tryCouncilSource, /independence and fault tolerance have not been demonstrated/);
assert.doesNotMatch(tryCouncilSource, /Convene the live 5-agent council/);
assert.doesNotMatch(tryCouncilSource, /Consensus reached|The council agrees/);
assert.match(complianceHowItWorksSource, /No continuous Council monitoring/);
assert.match(complianceHowItWorksSource, /target threshold of 23\/33/);
assert.match(complianceHowItWorksSource, /it is not live/);
assert.doesNotMatch(
  complianceHowItWorksSource,
  /The Council continuously monitors|Council independently reviews your compliance/,
);
assert.match(altPageSource, /Designed 33-seat Council, target 23\/33/);
assert.match(altPageSource, /not live and no demonstrated independent operation or resilience under failed voters/);
assert.doesNotMatch(
  altPageSource,
  /multi-agent consensus|Ed25519-signed verdicts|signs every verdict|consensus-based decision governance/i,
);
assert.match(retiredGenerator, /QUARANTINED_GENERATOR = True/);
assert.match(failClosedCouncilGenerator, /"bft_status": "NOT_DEMONSTRATED"/);
assert.match(failClosedCouncilGenerator, /NO_INDEPENDENT_VERIFIABLE_VOTES/);
assert.doesNotMatch(
  failClosedCouncilGenerator,
  /"vote":\s*"YES"|agent_keypair|priv\s*\+/,
);
assert.match(retiredWiringGenerator, /RETIRED_GENERATOR = True/);
assert.match(retiredWiringGenerator, /raise SystemExit\(2\)/);
assert.doesNotMatch(retiredWiringGenerator, /def build_substrate_manifest/);

const bftRegression = execFileSync(
  "python3",
  ["scripts/badger/test_bft_council.py"],
  { encoding: "utf8" },
);
assert.match(bftRegression, /fail-closed tests: PASS/);

// WHAT THIS RULE IS FOR. On 2026-09-04, 21 artifacts carrying fabricated unanimous votes —
// yes_count 33, quorum_reached true, 33 "vote":"YES" entries with invented `sig` hex — were
// quarantined, and this gate froze the active queue directory out of existence to stop them
// coming back. That was the right shape of rule while nothing legitimate wrote there.
//
// It stopped being the right shape when the generator was rewritten to fail closed. This same
// gate now REQUIRES that generator to emit "bft_status": "NOT_DEMONSTRATED" and
// NO_INDEPENDENT_VERIFIABLE_VOTES (see the assertions above) — and that generator writes to
// scripts/badger/_queue/bft-council/. So the gate blessed a producer and simultaneously forbade
// its output directory, and the deploy went red on 2026-09-05 with an honest artifact in hand:
//   {"status":"UNCHECKABLE","evaluated_vote_count":0,"votes":[],"quorum_reached":false,
//    "bft_status":"NOT_DEMONSTRATED","reason_code":"NO_INDEPENDENT_VERIFIABLE_VOTES"}
// That document is the opposite of a simulated quorum. Blocking it protected nobody.
//
// THE RULE IS NOT WEAKENED — it is moved from the path to the contents, which is where the lie
// would actually live. A file in this directory must now prove it claims no consensus. Anything
// resembling the quarantined artifacts (a reached quorum, any YES vote, any per-voter signature,
// a non-zero vote count) fails, and it fails whatever the file is named. Verified against a real
// quarantined artifact in the selftest below, so this cannot rot into a check that passes them.
// PHANTOM DOORS: an endpoint that CLAIMS to read a source it never reads.
//
// On 2026-09-05 a single commit replaced eight functions/api handlers with an identical
// 39-line template whose note read "Returns the live data from <source>" — with zero fetch()
// calls in any of them. Five had been honest `unavailable()` stubs declaring NOT_IMPLEMENTED,
// so an explicit 501 became a false 200; /api/trace lost a real, working card resolver;
// /api/regulation lost a 114-line source-cited deadline register; and /api/reported lost the
// empty-set contract whose own docstring records that this exact regression took the site down
// on 2026-09-04 and kept it down across eight merged PRs.
//
// The rule is narrow on purpose: it fires only when a handler asserts it returns live/fetched
// data from a named source while containing no fetch at all. An honest "NOT_IMPLEMENTED", an
// empty array with an explanation, or a computed answer that claims nothing are all untouched.
const LIVE_CLAIM = /returns?\s+the\s+live\s+data\s+from|live\s+data\s+fetched\s+from/i;
/**
 * Comments are documentation, not claims. reported.ts QUOTES the false note in its docstring to
 * record how the outage happened — a gate that fired on that would punish writing the history
 * down, so only the code that actually runs is tested.
 */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
for (const name of readdirSync("functions/api")) {
  if (!name.endsWith(".ts") || name.endsWith(".test.ts") || name.startsWith("_")) continue;
  const where = `functions/api/${name}`;
  const src = stripComments(readFileSync(where, "utf8"));
  if (!LIVE_CLAIM.test(src)) continue;
  assert.ok(
    /\bfetch\s*\(/.test(src),
    `${where} claims to return live data from a source but contains no fetch() — an endpoint ` +
      "must not describe a read it never performs",
  );
}

const ACTIVE_BFT_QUEUE = "scripts/badger/_queue/bft-council";
if (existsSync(ACTIVE_BFT_QUEUE)) {
  for (const name of readdirSync(ACTIVE_BFT_QUEUE)) {
    // .jsonl as well as .json. The 21 quarantined artifacts are 14 .json plus 7 .jsonl
    // vote-chains, and the old path rule forbade every one of them by forbidding the directory.
    // Scanning only .json would have let a fabricated vote-chain back in through the gap.
    if (extname(name) !== ".json" && extname(name) !== ".jsonl") continue;
    const where = `${ACTIVE_BFT_QUEUE}/${name}`;
    for (const problem of simulatedQuorumProblems(readFileSync(join(ACTIVE_BFT_QUEUE, name), "utf8"))) {
      assert.fail(`simulated BFT output in the active queue: ${where} ${problem}`);
    }
  }
}
const bftQuarantine = "_quarantine/simulated-bft-2026-09-04";
assert.equal(existsSync(`${bftQuarantine}/README.md`), true);
const quarantinedBftArtifacts = readdirSync(bftQuarantine).filter((name) =>
  /^(?:council-manifest|quorum-vote|vote-chain)-/.test(name),
);
assert.equal(
  quarantinedBftArtifacts.length,
  21,
  "all 21 simulated BFT artifacts must remain preserved in quarantine",
);

for (const slug of [
  "oswao",
  "microsoft",
  "nvidia",
  "asi-evolve",
  "huggingface",
  "gspc",
  "council-os",
]) {
  assert.equal(existsSync(`public/interop/engine-${slug}.json`), false);
  assert.equal(
    existsSync(`public/.well-known/agents/${slug}-agent.json`),
    false,
  );
  assert.equal(existsSync(`public/.well-known/mcp/${slug}.json`), false);
}
assert.equal(existsSync("public/interop/engine-bft-index.json"), false);

const retiredPublicPaths = [
  "public/interop/chat-binding.json",
  "public/interop/growth-loops.json",
  "public/interop/prod-readiness.json",
  "public/interop/synthesis-layer.json",
  "public/outreach/academic.md",
  "public/outreach/ai-vendors.md",
  "public/outreach/huggingface-team.md",
  "public/outreach/investors.md",
  "public/outreach/open-source-maintainers.md",
  "public/outreach/press.md",
  "public/outreach/regulators.md",
  "public/outreach/standards-bodies.md",
];
for (const path of retiredPublicPaths) {
  assert.equal(
    existsSync(path),
    false,
    `${path} must remain quarantined outside public/`,
  );
}

const publicOutreachFiles = existsSync("public/outreach")
  ? readdirSync("public/outreach", { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join("public/outreach", entry.name))
  : [];
assert.equal(
  publicOutreachFiles.length,
  0,
  "operator outreach drafts must not be served from public/outreach",
);
const unsupportedOutreachClaim =
  /103 API endpoints|1126(?:\/1126| passing tests)|every route signed|x402 (?:paid )?(?:rail|attestations) live|settling real USDC|33-agent BFT council/i;
for (const path of publicOutreachFiles) {
  assert.doesNotMatch(
    readFileSync(path, "utf8"),
    unsupportedOutreachClaim,
    `${path} contains an unsupported runtime, test-count, payment or council claim`,
  );
}

const retiredApiPaths = [
  "functions/api/growth-loops.ts",
  "functions/api/prod-readiness.ts",
  "functions/api/synthesis.ts",
];
const formerRuntimeClaim =
  /15\/15 rails|1126\/1126|relentless cycle|Every standard maps|Every package enforces|Every loop updates|live attestation streaming|settling real USDC|33-agent BFT council/i;
for (const path of retiredApiPaths) {
  const source = readFileSync(path, "utf8");
  assert.match(source, /@openapi-unavailable/);
  assert.match(source, /status: "UNAVAILABLE"/);
  assert.match(source, /code: "RETIRED"/);
  assert.match(source, /}\s*,\s*503\s*,?\s*\);/);
  assert.doesNotMatch(source, formerRuntimeClaim);
}

const routerSource = readFileSync("functions/api/router.ts", "utf8");
assert.doesNotMatch(
  routerSource,
  /\/interop\/(?:chat-binding|growth-loops|prod-readiness|synthesis-layer)\.json/,
);
assert.doesNotMatch(
  routerSource,
  /well_known_doors|interop_formats|growth_loops|synthesis_mappings/,
);
assert.match(routerSource, /code: "RETIRED"/);
assert.match(routerSource, /}\s*,\s*503\s*,?\s*\);/);

const wireGenerator = readFileSync(
  "scripts/badger/csoai-wire-routes.py",
  "utf8",
);
assert.doesNotMatch(
  wireGenerator,
  /\/interop\/(?:chat-binding|growth-loops|prod-readiness|synthesis-layer)\.json/,
);
assert.match(wireGenerator, /@openapi-unavailable/);
assert.match(wireGenerator, /code: \"RETIRED\"/);

const indexGenerator = readFileSync(
  "scripts/badger/csoai-prod-readiness.py",
  "utf8",
);
assert.match(indexGenerator, /RETIRED_INTEROP_FILES/);
assert.doesNotMatch(
  indexGenerator,
  /loops_path\.write_text|synthesis_path\.write_text|checklist_path\.write_text/,
);

const gamesGenerator = readFileSync(
  "scripts/badger/csoai-games-bind.py",
  "utf8",
);
assert.doesNotMatch(gamesGenerator, /chat-binding\.json|chat_path\.write_text/);

const gameCatalogue = JSON.parse(
  readFileSync("public/interop/games-arcade.json", "utf8"),
);
assert.equal(gameCatalogue.schema, "csoai.game-planning-catalogue/0.2");
assert.equal(gameCatalogue.status, "PRACTICE_ONLY");
assert.equal(gameCatalogue.total_concepts, gameCatalogue.concepts.length);
assert.ok(gameCatalogue.concepts.length > 0);
for (const concept of gameCatalogue.concepts) {
  assert.equal(concept.status, "PRACTICE_ONLY");
  assert.equal(concept.writes_board, false);
  for (const retiredField of [
    "multiplayer",
    "agui",
    "a2ui",
    "x402_sku",
    "x402_price_usdc",
  ]) {
    assert.equal(
      retiredField in concept,
      false,
      `${concept.slug} still exposes ${retiredField}`,
    );
  }
}

for (const slug of gameCatalogue.concepts.map((concept) => concept.slug)) {
  for (const path of [
    `public/.well-known/${slug}.json`,
    `public/.well-known/agents/${slug}-agent.json`,
    `public/.well-known/mcp/${slug}.json`,
    `public/interop/game-${slug}.json`,
  ]) {
    assert.equal(
      existsSync(path),
      false,
      `${path} is a retired callable-looking game manifest`,
    );
  }
}
assert.doesNotMatch(
  JSON.stringify(gameCatalogue),
  /"LIVE"|multiplayer|AG-UI|A2UI|x402|Every turn emits|signed every turn/i,
);
assert.doesNotMatch(
  gamesGenerator,
  /"LIVE"|multiplayer|AG-UI|A2UI|x402|Every turn emits|signed every turn|build_game_(?:discovery|agent|mcp|interop)/i,
);
assert.match(gamesGenerator, /PRACTICE_ONLY/);

const outreachGenerator = readFileSync(
  "scripts/badger/csoai-execute-send-wave.py",
  "utf8",
);
assert.match(outreachGenerator, /docs" \/ "operator" \/ "outreach/);
assert.match(outreachGenerator, /UNVERIFIED OPERATOR DRAFT — DO NOT SEND/);
assert.doesNotMatch(outreachGenerator, /PUBLIC_OUTREACH|public\/outreach/);

const benchmarkSource = readFileSync("public/benchmarks/index.html", "utf8");
const benchmarkRows = benchmarkSource.match(
  /<tbody id="board-rows">([\s\S]*?)<\/tbody>/,
);
assert.ok(
  benchmarkRows,
  "benchmark table must keep its derived-row mount point",
);
assert.match(benchmarkSource, /fetch\("\/api\/gspc"/);
assert.match(benchmarkSource, /a\.accuracy\.toFixed\(3\)/);
assert.match(benchmarkSource, /a\.leader\|\|a\.public_leader_state/);
assert.doesNotMatch(benchmarkSource, /\bcouncil specialist\b/i);
assert.doesNotMatch(
  benchmarkRows[1],
  /<td class="num">\s*(?:\d+|\d*\.\d+)\s*<\/td>/,
  "benchmark table must not carry hardcoded sample counts or scores",
);

// P1 convergence gate: legacy second shells must resolve into Council OS rather
// than awarding local-only "certifications" or presenting a second marketing
// hierarchy. Check both client-side navigation and edge redirects so either
// hosting path fails closed.
assert.doesNotMatch(
  appSource,
  /WidgetRouter|components\/widget|pages\/PublicHome/,
  "legacy /public and /widget shells must stay outside the routed client graph",
);
assert.match(
  appSource,
  /"\/public"[\s\S]{0,220}<DashboardDoor defaultTab="home"/,
  "/public must converge on the canonical Council OS home pane",
);
assert.match(
  appSource,
  /path === "\/widget"[\s\S]{0,220}<DashboardDoor defaultTab="learn"/,
  "/widget must converge on the practice-only Council OS learning pane",
);
const redirectGeneratorSource = readFileSync("scripts/generate-redirects.mjs", "utf8");
const redirectsSource = readFileSync("public/_redirects", "utf8");
for (const source of [redirectGeneratorSource, redirectsSource]) {
  assert.match(source, /\/public\/?\s+\/dashboard\?tab=home\s+308/);
  assert.match(source, /\/widget\/?\s+\/dashboard\?tab=learn\s+308/);
  assert.match(source, /\/widget\/\*\s+\/dashboard\?tab=learn\s+308/);
}

// A public/foo.html can take ownership of the clean /foo URL and silently
// displace a maintained React route. Keep the reviewed exceptions explicit and
// fail closed on every new collision. GovBench/ProvBench are deliberately not
// exceptions: their retired human HTML must stay quarantined from public/.
const reviewedPublicHtmlAppRoutes = new Set([
  "/404",
  "/advisory",
  "/benchmarks",
  "/globe",
]);
const concreteAppRoutes = [...appSource.matchAll(/<Route\s+path=["']([^"']+)["']/g)]
  .map((match) => match[1].replace(/\/+$/, "") || "/")
  .filter((route) => route.startsWith("/") && !route.includes(":") && !route.includes("*"));
assert.deepEqual(
  findUnreviewedPublicHtmlAppRoutes(concreteAppRoutes, reviewedPublicHtmlAppRoutes),
  [],
  "an unreviewed public HTML file shadows a maintained App route",
);
for (const route of ["govbench", "provbench"]) {
  assert.equal(existsSync(`public/${route}.html`), false, `${route}.html must stay out of public/`);
  for (const source of [redirectGeneratorSource, redirectsSource]) {
    assert.match(source, new RegExp(`/${route}\\s+/${route}/\\s+308`));
    assert.match(source, new RegExp(`/${route}\\.html\\s+/${route}/\\s+308`));
  }
}

const axisSetsSource = readFileSync("client/src/data/axis-sets.ts", "utf8");
const measurementBoardSource = readFileSync("client/src/pages/MeasurementBoard.tsx", "utf8");
assert.match(axisSetsSource, /the content-addressed unsigned run/);
assert.match(axisSetsSource, /fallbackStatusUrl:\s*"\/signed\/gspc-board\.status\.json"/);
assert.match(axisSetsSource, /status\?\.current !== true \|\| status\?\.state !== "CURRENT"/);
assert.match(measurementBoardSource, /fetchPublishedSet\(set\)/);

// The generated, unsigned snapshot is the regression oracle for the current
// API contract. Historical leader prose may be retained, but only in a
// structure that says it does not assert today's public fields.
const currentBoard = JSON.parse(
  readFileSync("extensions/chrome-gspc-verify/fixtures/api-gspc.snapshot.json", "utf8"),
);
assertCurrentGspcClaims(currentBoard);
for (const axis of currentBoard.axes.filter((entry) => entry.family === "financial")) {
  const run = JSON.parse(readFileSync(`public${axis.evidence_url}`, "utf8"));
  const actuallySigned =
    run.signature?.alg === "Ed25519" && typeof run.signature?.sig === "string";
  assert.equal(
    axis.run_attestation,
    actuallySigned ? "ED25519_SIGNED" : "CONTENT_ADDRESSED_UNSIGNED",
    `${axis.axis} run-attestation state must be derived from its evidence artifact`,
  );
}

// Never rewrite a valid historical signature to make its claims look current.
// The immutable bytes remain independently verifiable, while a separate
// unsigned status document withdraws reliance until the owner MPC re-signs.
const signedBoardPath = "public/signed/gspc-board.signed.json";
const signedBoardBytes = readFileSync(signedBoardPath);
const signedBoard = JSON.parse(signedBoardBytes.toString("utf8"));
const signedBoardStatus = JSON.parse(
  readFileSync("public/signed/gspc-board.status.json", "utf8"),
);
assert.match(
  execFileSync("node", ["scripts/gspc-board-verify.mjs", signedBoardPath], {
    encoding: "utf8",
  }),
  /^VERIFIED/m,
);
assert.equal(signedBoardStatus.current, false);
assert.equal(signedBoardStatus.state, "SUPERSEDED_KNOWN_CLAIM_DEFECT");
assert.equal(signedBoardStatus.current_authority, "/api/gspc");
assert.equal(
  signedBoardStatus.integrity.sha256_file_bytes,
  createHash("sha256").update(signedBoardBytes).digest("hex"),
);
assert.equal(
  signedBoardStatus.integrity.content_id,
  signedBoard.custody_attestation.content_id,
);
const defectCodes = new Set(
  signedBoardStatus.known_claim_defects.map((defect) => defect.code),
);
assert.equal(defectCodes.has("FINANCIAL_RUN_SIGNATURE_OVERCLAIM"), true);
assert.equal(defectCodes.has("HISTORICAL_LEADER_NOTE_PRESENTED_AS_CURRENT"), true);
assert.match(signedBoard.totals.sweep_note, /each has a signed run/);
const historicalAxisSnapshot = JSON.parse(
  readFileSync("public/six-axes/gspc-axes.json", "utf8"),
);
assert.equal(historicalAxisSnapshot.superseded, true);
assert.match(historicalAxisSnapshot.authority, /current unsigned live-board response/);
assert.match(historicalAxisSnapshot.authority, /gspc-board\.status\.json/);
assert.doesNotMatch(historicalAxisSnapshot.authority, /live signed board/);
for (const stateEndpoint of ["functions/api/state.ts", "functions/api/counters.ts"]) {
  const source = readFileSync(stateEndpoint, "utf8");
  assert.match(source, /boardClaimState === "CURRENT"/);
  assert.match(source, /gspc-board\.status\.json/);
}

console.log(
  "council-runtime-truth-gate: PASS — one Council OS shell, current GSPC claims cohere with evidence, the known-defect MPC snapshot fails closed, BFT is not live, PQC is planned only, and n_eff=1",
);
