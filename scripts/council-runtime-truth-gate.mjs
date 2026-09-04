#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

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
  ["all-decisions-signed", /\bevery (?:decision|governed action) is (?:ed25519-)?(?:signed|sealed)\b/i],
  ["government-live-operations", /\breal-time oversight capabilities for government regulators\b|\bjoin 47 regulatory bodies\b|\b24\/7 government support line\b/i],
  ["daily-regulation-watcher", /\bcorpus watcher hashes every provision daily\b/i],
];

function detectUiTruthViolations(source) {
  const violations = UI_TRUTH_RULES
    .filter(([, pattern]) => pattern.test(source))
    .map(([code]) => code);

  for (const line of source.split("\n")) {
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
  ["Certification", "FrameworkDetail", "Leaderboard"],
  "App.tsx page imports changed: every new page import must be routed or explicitly removed",
);
assert.ok(
  routedPagePaths.size >= 300,
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

const newHomeSource = readFileSync("client/src/pages/NewHome-v2.tsx", "utf8");
assert.match(newHomeSource, /import ConsensusHero from "\.\.\/components\/ConsensusHero"/);
assert.match(newHomeSource, /<ConsensusHero\b/);

// These non-page sources are either mounted in the shared shell or feed that
// shell. Keep the list explicit so review does not confuse an on-disk demo with
// a routed runtime; mount/import assertions below fail closed if the shell moves.
const sharedTruthSources = [
  "client/src/components/Header.tsx",
  "client/src/components/Footer.tsx",
  "client/src/components/ConsensusHero.tsx",
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
const headerSource = readFileSync("client/src/components/Header.tsx", "utf8");
assert.match(headerSource, /import \{ GlobalSearch \} from ['"]@\/components\/GlobalSearch['"]/);
assert.match(headerSource, /<GlobalSearch\b/);
assert.match(newHomeSource, /import ConsensusHero from "\.\.\/components\/ConsensusHero"/);
assert.match(newHomeSource, /<ConsensusHero\b/);

const activeUiSources = [
  ...routedPagePaths,
  ...sharedTruthSources,
  "client/src/pages/AltPage.tsx",
  "public/claims-register.json",
  "client/src/lib/verify.ts",
  "client/src/data/chain.ts",
  "client/src/data/deckWorlds/evidenceRail.ts",
  "client/src/data/deckWorlds/openSource.ts",
  "client/src/data/deckWorlds/coliseum.ts",
  "client/src/data/deckWorlds/predicateCompiler.ts",
];
for (const sourcePath of activeUiSources) {
  const violations = detectUiTruthViolations(readFileSync(sourcePath, "utf8"));
  assert.deepEqual(
    violations,
    [],
    `${sourcePath} has routed council/PQC truth violations: ${violations.join(", ")}`,
  );
}

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
assert.match(altPageSource, /not live and no demonstrated independence or fault tolerance/);
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

assert.equal(
  existsSync("scripts/badger/_queue/bft-council"),
  false,
  "simulated BFT output must not remain in the active queue",
);
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

console.log(
  "council-runtime-truth-gate: PASS — routed UI says 33-seat design / 23-seat target / not live, PQC remains planned only, n_eff=1, and retired runtimes fail closed",
);
