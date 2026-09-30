/**
 * /connect#stacks — "GSPC for <platform>": the installable artefacts, per stack (lane ecosystem-install-20260930).
 *
 * WHAT IT MAY SAY. Only what was installed and run on 30 Sep 2026 against the real upstream packages
 * (receipts: council-os/receipts/ecosystem-install-20260930/), and each block's listing line says plainly that no
 * official marketplace lists it yet. Every command names only artefacts we publish (PyPI, councilof.ai/helm/,
 * councilof.ai/lib/, the free MCP door). Nothing here is a vendor integration or a vendor endorsement.
 * stackInstall.test.ts checks every PyPI name, chart and URL named here against the files that produce them.
 */
export type StackStep = { label: string; text: string };
export type Stack = {
  id: string;
  platform: string;
  what: string;
  steps: StackStep[];
  listing: string;
  notMeasured: string;
};

export const HELM_REPO = "https://councilof.ai/helm/";
export const VERIFY_MODULE = "https://councilof.ai/lib/csoai-verify.mjs";
export const PYPI = {
  fabric: "csoai-evidence-fabric",
  llamaStack: "llama-stack-provider-csoai",
  nat: "nat-csoai-evidence",
} as const;
export const HELM_CHART = "llama-stack-csoai-eval";

export const STACKS: Stack[] = [
  {
    id: "redhat",
    platform: "Red Hat OpenShift AI (Llama Stack)",
    what:
      "An out-of-tree Llama Stack eval provider, remote::csoai. A job verifies signed evidence batches offline against a pinned DID document and returns each event's state word; it never calls a model and never returns a score. The Helm chart runs it in a Llama Stack server.",
    steps: [
      { label: "pip (Python 3.12, llama-stack 0.7)", text: `pip install ${PYPI.llamaStack}\ncurl -o did.json https://csoai.org/.well-known/did.json` },
      {
        label: "Llama Stack run config",
        text: "providers:\n  eval:\n  - provider_id: csoai\n    provider_type: remote::csoai\n    module: llama_stack_provider_csoai\n    config:\n      did_json: ./did.json",
      },
      {
        label: "Helm",
        text: `helm repo add csoai ${HELM_REPO}\nhelm install csoai-evidence csoai/${HELM_CHART} --set bundles.existingClaim=<pvc>\n# OpenShift restricted SCC: add --set podSecurityContext.runAsUser=null`,
      },
    ],
    listing: "Official listing: not yet. Not in the Red Hat Ecosystem Catalog.",
    notMeasured:
      "Run on 30 Sep 2026 against llama-stack 0.7.3: the fixture job returned CONSISTENT, DIVERGENT, UNMEASURED, INVALID and UNVERIFIABLE_KEY in order. The chart was linted and rendered, and its start command was run outside Kubernetes; an install on a live OpenShift cluster is UNMEASURED.",
  },
  {
    id: "nvidia",
    platform: "NVIDIA NeMo Agent Toolkit and OpenShell",
    what:
      "A NeMo Agent Toolkit evaluator plugin, _type: csoai_evidence. Each item's result is the event's state word with score None, never 0.0 on an error. OpenShell writes its audit trail as OCSF; the same evidence events render as OCSF 1.9 Detection Findings to sit beside it.",
    steps: [
      { label: "pip (Python 3.11 to 3.13, nvidia-nat 1.9)", text: `pip install "${PYPI.nat}[eval]"\ncurl -o did.json https://csoai.org/.well-known/did.json` },
      { label: "NAT eval config", text: "eval:\n  evaluators:\n    evidence:\n      _type: csoai_evidence\n      did_json: ./did.json" },
      { label: "Run", text: "nat eval --config_file eval.yml --skip_workflow" },
      { label: "OCSF output", text: `pip install ${PYPI.fabric}\ncsoai-evidence render ocsf events.jsonl > findings.ocsf.jsonl` },
    ],
    listing: "Official listing: not yet. Not an NVIDIA-published plugin.",
    notMeasured:
      "Run on 30 Sep 2026 with nvidia-nat 1.9.0: nat eval returned the five expected results with average_score None. nvidia-nat-eval 1.9.0 imports langchain_core without declaring it; the [eval] extra adds it. A run inside an NVIDIA-hosted service is UNMEASURED.",
  },
  {
    id: "crowdstrike",
    platform: "CrowdStrike Falcon (Charlotte AI AgentWorks, Next-Gen SIEM)",
    what:
      "Two routes. AgentWorks connects to remote MCP servers: add the free door below, read-only, no key. For Next-Gen SIEM, the evidence renders as ECS documents in HEC NDJSON; event.category is configuration and UNMEASURED maps to event.outcome unknown, never success.",
    steps: [
      { label: "MCP server URL (Streamable HTTP, no auth)", text: "https://councilof.ai/mcp/free" },
      { label: "ECS in HEC NDJSON", text: `pip install ${PYPI.fabric}\ncsoai-evidence render ecs-hec events.jsonl > hec.ndjson` },
    ],
    listing: "Official listing: not yet. Not in the CrowdStrike Marketplace; no Falcon Foundry app.",
    notMeasured:
      "The MCP address answers tools/list live. Ingestion into a Falcon tenant was not run; it needs an account, so it is UNMEASURED.",
  },
  {
    id: "cisco",
    platform: "Cisco AI Defense and Splunk",
    what:
      "Splunk's AI monitoring reads OpenTelemetry GenAI conventions: the evidence renders as gen_ai.evaluation.result events, with score.value absent unless a number was measured. The same events go to a Splunk HTTP Event Collector as HEC NDJSON. SARIF from Cisco's skill-scanner can be read in as the declared side.",
    steps: [
      { label: "OTel and HEC", text: `pip install ${PYPI.fabric}\ncsoai-evidence render otel events.jsonl > evaluation.otlp.json\ncsoai-evidence render ecs-hec events.jsonl > hec.ndjson` },
      {
        label: "Send to a Splunk HEC",
        text: 'curl -H "Authorization: Splunk $HEC_TOKEN" https://<your-splunk>:8088/services/collector/event --data-binary @hec.ndjson',
      },
      { label: "Read skill-scanner SARIF in", text: "csoai-evidence ingest sarif scanner.sarif --read-at 2026-09-30T12:00:00Z > events.jsonl" },
    ],
    listing: "Official listing: not yet. No Splunk app on Splunkbase; not in the AGNTCY directory.",
    notMeasured:
      "Each output was checked against the carrier's published schema or registry (OTel semantic conventions, SARIF 2.1.0). Ingestion into a Splunk or AI Defense tenant was not run; it is UNMEASURED.",
  },
  {
    id: "palantir",
    platform: "Palantir AIP Evals",
    what:
      "One ES module with no dependencies that verifies a board-signed record offline: sha256, sha512 and Ed25519 are in the file. It is written for a custom evaluator that gets its inputs passed in and has no network egress. It returns VALID, INVALID or UNVERIFIABLE_KEY, and VALID shows who signed the bytes, not that a claim is true.",
    steps: [
      {
        label: "ES module (browsers, Node, Deno, Bun)",
        text: `import { verifyCard, keysFromDid } from "${VERIFY_MODULE}";\nconst r = verifyCard({ signed, recordText, keys: keysFromDid(savedDidJson) });\n// r.state: "VALID" | "INVALID" | "UNVERIFIABLE_KEY"`,
      },
    ],
    listing: "Official listing: not yet. The npm package csoai-verify is prepared and not yet published.",
    notMeasured:
      "The built module verified our real board-signed SAFE-pack record as VALID and rejected a one-byte record edit, a one-nibble signature edit and an unpinned key. Running it inside a Foundry evaluator needs an account; it is UNMEASURED.",
  },
];
