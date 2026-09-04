#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";

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
  "/cobol",
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
