import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { onRequestGet } from "../../functions/api/hub-cards.ts";

const HUB = "https://huggingface.co/datasets/csoai/gspc-hub-cards/resolve/main/mill-cards";
const TREE = "https://huggingface.co/api/datasets/csoai/gspc-hub-cards/tree/main/mill-cards";
const SUPERSEDED = "https://councilof.ai/interop/mill-cards-signed/SUPERSEDED.jsonl";
const WITHDRAWN = "https://councilof.ai/interop/mill-cards-signed/WITHDRAWN.jsonl";
const MODE = process.argv[2];

if (!["superseded", "withdrawn"].includes(MODE)) {
  throw new Error("usage: fixture superseded|withdrawn");
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = fileURLToPath(import.meta.url);
const HANDLER_PATH = resolve(HERE, "../../functions/api/hub-cards.ts");
const row = (model: string, axis: string, status: string, id: string) =>
  JSON.stringify({ model, axis, status, accuracy: 0.5, n: 30, signed: true,
    card_sha256: id, card_url: "https://example.invalid/" + id + ".json" });

const INDEX = MODE === "superseded"
  ? [
      row("fixture/same", "safety", "UNMEASURED", "pred-card"),
      row("fixture/same", "safety", "MEASURED", "replacement-card"),
    ].join("\n")
  : row("fixture/withdrawn", "swarm", "MEASURED", "withdraw-card");

const TREE_BODY = JSON.stringify([{ type: "file", path: "mill-cards/INDEX.jsonl" }]);
const SUPER_CHANGED = JSON.stringify({
  superseded_id: "pred-card", by_id: "replacement-card",
  model: "fixture/same", axis: "safety",
});
const WITH_CHANGED = JSON.stringify({
  withdrawn_id: "withdraw-card", model: "fixture/withdrawn",
  axis: "swarm", correction: "C-FIXTURE",
});

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const obj = value as Record<string, unknown>;
  return "{" + Object.keys(obj).sort()
    .map((k) => JSON.stringify(k) + ":" + canonical(obj[k])).join(",") + "}";
}

function installFetch(superseded: string, withdrawn: string) {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url === TREE) return new Response(TREE_BODY, { status: 200 });
    if (url === SUPERSEDED) return new Response(superseded, { status: 200 });
    if (url === WITHDRAWN) return new Response(withdrawn, { status: 200 });
    if (url === HUB + "/INDEX.jsonl") return new Response(INDEX, { status: 200 });
    throw new Error("unexpected fetch: " + url);
  }) as typeof fetch;
}

function semanticBody(body: unknown): unknown {
  const cloned = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(cloned, "as_of")) cloned.as_of = "<observation-time>";
  return cloned;
}

async function invoke(superseded: string, withdrawn: string) {
  installFetch(superseded, withdrawn);
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/hub-cards"),
  } as never);
  const body = await res.json();
  return { status: res.status, body, hash: sha(canonical(semanticBody(body))) };
}

const originalFetch = globalThis.fetch;
try {
  const baseline = await invoke("", "");
  const changed = MODE === "superseded"
    ? await invoke(SUPER_CHANGED, "")
    : await invoke("", WITH_CHANGED);
  const replay = await invoke("", "");

  if (baseline.status !== 200 || changed.status !== 200 || replay.status !== 200) {
    throw new Error("fixture handler did not return HTTP 200");
  }
  if (baseline.hash === changed.hash) {
    throw new Error("changed ledger bytes did not change hub-cards output");
  }
  if (baseline.hash !== replay.hash) {
    throw new Error("baseline replay was not deterministic");
  }

  const sourceId = MODE === "superseded"
    ? "csoai-hub-card-supersessions" : "csoai-hub-card-withdrawals";
  const sourceUrl = MODE === "superseded" ? SUPERSEDED : WITHDRAWN;
  const changedBytes = MODE === "superseded" ? SUPER_CHANGED : WITH_CHANGED;
  const receipt = {
    schema: "csoai.layer0-dependency-fixture/0.1",
    state: "VERIFIED_DIRECT_DEPENDENCY",
    capability_id: "hub-cards",
    source_id: sourceId,
    source_scope: sourceUrl,
    scope_match_required: true,
    watch: { kind: "http_artifact", url: sourceUrl },

    method: "synthetic fetch fixture; change only the named local ledger",
    inputs: {
      baseline_source_sha256: sha(""),
      changed_source_sha256: sha(changedBytes),
      invariant_tree_sha256: sha(TREE_BODY),
      invariant_hub_index_sha256: sha(INDEX),
      invariant_other_ledger_sha256: sha(""),
    },
    outputs: {
      baseline_sha256: baseline.hash,
      changed_sha256: changed.hash,
      replay_sha256: replay.hash,
      baseline_counts: (baseline.body as Record<string, unknown>).counts ?? null,
      changed_counts: (changed.body as Record<string, unknown>).counts ?? null,
      replay_stable: baseline.hash === replay.hash,
      changed: baseline.hash !== changed.hash,
    },
    implementation: {
      handler_path: "functions/api/hub-cards.ts",
      handler_sha256: sha(readFileSync(HANDLER_PATH, "utf8")),
      fixture_path: "scripts/layer0/hub-cards-ledger-dependency-fixture.ts",
      fixture_sha256: sha(readFileSync(FIXTURE_PATH, "utf8")),
    },
    authority: {
      dependency_registration: true,
      gspc_measurement: false,
      source_truth: false,
      endorsement: false,
      effect_authority: false,
    },
    law: "This receipt proves output dependence on the named ledger bytes only.",
  };
  console.log(JSON.stringify(receipt, null, 2));
} finally {
  globalThis.fetch = originalFetch;
}
