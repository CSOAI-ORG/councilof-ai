import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { onRequestGet } from "../../functions/api/hub-cards.ts";

const HUB = "https://huggingface.co/datasets/csoai/gspc-hub-cards/resolve/main/mill-cards";
const TREE = "https://huggingface.co/api/datasets/csoai/gspc-hub-cards/tree/main/mill-cards";
const SUPERSEDED = "https://councilof.ai/interop/mill-cards-signed/SUPERSEDED.jsonl";
const WITHDRAWN = "https://councilof.ai/interop/mill-cards-signed/WITHDRAWN.jsonl";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = fileURLToPath(import.meta.url);
const HANDLER_PATH = resolve(HERE, "../../functions/api/hub-cards.ts");
const row = (model: string, axis: string, status: string) =>
  JSON.stringify({ model, axis, status, accuracy: 0.5, n: 30, signed: true });

const BASE = {
  INDEX: row("fixture/a", "governance", "MEASURED"),
  "INDEX-safety": row("fixture/b", "safety", "UNMEASURED"),
  "INDEX-art5-affect": "",
  "INDEX-empty3": "",
};
const CHANGED = {
  ...BASE,
  "INDEX-safety": [BASE["INDEX-safety"], row("fixture/c", "safety", "UNMEASURED")].join("\n"),
};

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const obj = value as Record<string, unknown>;
  return "{" + Object.keys(obj).sort()
    .map((k) => JSON.stringify(k) + ":" + canonical(obj[k])).join(",") + "}";
}

const treeBody = JSON.stringify(Object.keys(BASE).map((name) => ({
  type: "file", path: `mill-cards/${name}.jsonl`,
})));

function installFetch(files: Record<string, string>) {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url === TREE) return new Response(treeBody, { status: 200 });
    if (url === SUPERSEDED || url === WITHDRAWN) return new Response("", { status: 200 });
    if (url.startsWith(HUB + "/")) {
      const name = url.slice(HUB.length + 1).replace(/\.jsonl$/, "");
      return new Response(files[name] ?? "", { status: 200 });
    }
    throw new Error("unexpected fetch: " + url);
  }) as typeof fetch;
}

function semanticBody(body: unknown): unknown {
  const cloned = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(cloned, "as_of")) cloned.as_of = "<observation-time>";
  return cloned;
}

async function invoke(files: Record<string, string>) {
  installFetch(files);
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/hub-cards"),
  } as never);
  const body = await res.json();
  return { status: res.status, body, hash: sha(canonical(semanticBody(body))) };
}

const originalFetch = globalThis.fetch;
try {
  const baseline = await invoke(BASE);
  const changed = await invoke(CHANGED);
  const replay = await invoke(BASE);
  if (baseline.status !== 200 || changed.status !== 200 || replay.status !== 200) {
    throw new Error("fixture handler did not return HTTP 200");
  }
  if (baseline.hash === changed.hash) {
    throw new Error("changed Hugging Face dataset bytes did not change hub-cards output");
  }
  if (baseline.hash !== replay.hash) {
    throw new Error("baseline replay was not deterministic");
  }

  const before = baseline.body as { counts?: Record<string, unknown> };
  const after = changed.body as { counts?: Record<string, unknown> };
  const receipt = {
    schema: "csoai.layer0-dependency-fixture/0.1",
    state: "VERIFIED_DIRECT_DEPENDENCY",
    capability_id: "hub-cards",
    source_id: "huggingface-datasets",
    source_scope: "csoai/gspc-hub-cards dataset tree + index JSONL",
    method: "synthetic fetch fixture; change one upstream dataset index while all other inputs stay fixed",
    inputs: {
      baseline_hf_bytes_sha256: sha(canonical(BASE)),
      changed_hf_bytes_sha256: sha(canonical(CHANGED)),
      changed_artifact: "INDEX-safety.jsonl",
      before_artifact_sha256: sha(BASE["INDEX-safety"]),
      after_artifact_sha256: sha(CHANGED["INDEX-safety"]),
      invariant_tree_sha256: sha(treeBody),
      invariant_superseded_ledger_sha256: sha(""),
      invariant_withdrawn_ledger_sha256: sha(""),
    },
    outputs: {
      baseline_sha256: baseline.hash,
      changed_sha256: changed.hash,
      replay_sha256: replay.hash,
      baseline_counts: before.counts ?? null,
      changed_counts: after.counts ?? null,
      replay_stable: baseline.hash === replay.hash,
      changed: baseline.hash !== changed.hash,
    },
    implementation: {
      handler_path: "functions/api/hub-cards.ts",
      handler_sha256: sha(readFileSync(HANDLER_PATH, "utf8")),
      fixture_path: "scripts/layer0/hub-cards-dependency-fixture.ts",
      fixture_sha256: sha(readFileSync(FIXTURE_PATH, "utf8")),
    },
    authority: {
      dependency_registration: true,
      gspc_measurement: false,
      source_truth: false,
      endorsement: false,
      effect_authority: false,
    },
    law: "This receipt proves output dependence on the named source bytes only.",
  };
  console.log(JSON.stringify(receipt, null, 2));
} finally {
  globalThis.fetch = originalFetch;
}
