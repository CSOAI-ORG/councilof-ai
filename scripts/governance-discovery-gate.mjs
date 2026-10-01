#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL = "https://councilof.ai/governance/manifest.json";
const BOARD = "https://councilof.ai/api/gspc";
const ROOT = "https://councilof.ai/root.json";
const DISCOVERY_PATH = "/.well-known/csoai-governance.json";
const MANIFEST_PATH = "/governance/manifest.json";
const ROLES = new Map([
  ["https://councilof.ai", "canonical_measurement_governance"],
  ["https://csoai.org", "institutional_identity"],
  ["https://meok.ai", "human_agent_operations"],
  ["https://openmoe.ai", "openness_models"],
  ["https://proofof.ai", "verification_provenance"],
  ["https://safetyof.ai", "safety_literacy"],
  ["https://agisafe.ai", "safety_evaluation"],
  ["https://asisecurity.ai", "security_continuity"],
]);
const COMPONENTS = {
  authority_model: "https://councilof.ai/governance/authority-model.json",
  committee_registry: "https://councilof.ai/governance/committee-registry.json",
  contribution_routes: "https://councilof.ai/governance/contribution-routes.json",
  correction_policy: "https://councilof.ai/governance/correction-policy.json",
  corrections: "https://councilof.ai/api/corrections",
  gspc: BOARD,
  institutional_record: "https://councilof.ai/memberships/",
  root: ROOT,
  state: "https://councilof.ai/api/state",
  work_evidence_schema: "https://councilof.ai/interop/work-evidence-capsule-v0.1.schema.json",
};
const STATIC_COMPONENTS = [
  "authority_model", "committee_registry", "contribution_routes",
  "correction_policy", "root", "work_evidence_schema",
];

function jsonFile(root, path, errors) {
  try {
    const bytes = readFileSync(join(root, path));
    return { bytes, value: JSON.parse(bytes.toString("utf8")) };
  } catch (error) {
    errors.push(`${path}: missing or invalid JSON (${error.message})`);
    return { bytes: null, value: null };
  }
}

function mediaType(headers, path) {
  const blocks = [];
  let current = null;
  for (const line of headers.split(/\r?\n/)) {
    if (line.startsWith("/") && !line.startsWith("//")) {
      current = { path: line.trim(), types: [] };
      blocks.push(current);
    } else if (current && /^\s+Content-Type:/i.test(line)) {
      current.types.push(line.split(":", 2)[1].trim().toLowerCase());
    }
  }
  return blocks.filter((block) => block.path === path).flatMap((block) => block.types);
}

export function validateDiscovery({ manifest, pointer, bundle, headers, bytes }) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    errors.push("canonical manifest is not a JSON object");
  } else {
    if (manifest.schema !== "csoai.governance.fabric/0.1") errors.push("manifest schema mismatch");
    if (manifest.canonical !== CANONICAL) errors.push("manifest canonical URL mismatch");
    if (manifest.measurement_authority !== "https://councilof.ai") errors.push("measurement authority mismatch");
    if (!manifest.scope?.includes("independent readback")) errors.push("manifest must require independent readback");
    if ("status" in manifest || "generated_at" in manifest) errors.push("manifest must not advertise a static live status or generation time");

    const components = manifest.components;
    if (!components || typeof components !== "object") {
      errors.push("manifest components missing");
    } else {
      for (const [name, expected] of Object.entries(COMPONENTS)) {
        if (components[name] !== expected) errors.push(`${name}: canonical Council link mismatch`);
      }
      if (Object.keys(components).length !== Object.keys(COMPONENTS).length) errors.push("unexpected component link");
    }

    const sites = manifest.sites;
    if (!Array.isArray(sites) || sites.length !== ROLES.size) {
      errors.push("configured site set incomplete");
    } else {
      const seen = new Set();
      for (const site of sites) {
        if (!site || !ROLES.has(site.site) || seen.has(site.site)) {
          errors.push("unknown or duplicate configured site");
          continue;
        }
        seen.add(site?.site);
        if (site.role !== ROLES.get(site.site)) errors.push(`${site.site}: role mismatch`);
        if (site.configured_discovery_path !== DISCOVERY_PATH) errors.push(`${site.site}: discovery path mismatch`);
        if (Object.keys(site).some((key) => !["site", "role", "configured_discovery_path"].includes(key))) {
          errors.push(`${site.site}: site row may configure a role, not assert deployment`);
        }
      }
      for (const site of ROLES.keys()) if (!seen.has(site)) errors.push(`${site}: missing configured site`);
    }
  }

  if (!pointer || typeof pointer !== "object" || Array.isArray(pointer)) {
    errors.push("well-known pointer is not a JSON object");
  } else {
    if (pointer.schema !== "csoai.well-known.governance/0.1") errors.push("well-known schema mismatch");
    if (pointer.canonical !== CANONICAL || pointer.measurement_authority !== "https://councilof.ai") errors.push("well-known authority mismatch");
    if (pointer.board !== BOARD || pointer.root !== ROOT) errors.push("well-known board/root mismatch");
    if (pointer.site !== "https://councilof.ai" || pointer.role !== ROLES.get(pointer.site)) errors.push("well-known site/role mismatch");
    if (pointer.corrections !== "https://councilof.ai/api/corrections") errors.push("well-known corrections mismatch");
  }

  for (const path of [DISCOVERY_PATH, MANIFEST_PATH]) {
    const types = mediaType(headers ?? "", path);
    if (types.length !== 1 || types[0] !== "application/json; charset=utf-8") {
      errors.push(`${path}: exactly one explicit application/json Content-Type is required`);
    }
    const rows = bundle?.entries?.filter((row) => row.path === path) ?? [];
    const file = bytes?.[path];
    if (rows.length !== 1 || !file || rows[0].sha256 !== createHash("sha256").update(file).digest("hex")) {
      errors.push(`${path}: bundle digest missing or mismatched`);
    }
  }
  return errors;
}

export function checkFiles(root) {
  const errors = [];
  const manifest = jsonFile(root, "governance/manifest.json", errors);
  const pointer = jsonFile(root, ".well-known/csoai-governance.json", errors);
  const bundle = jsonFile(root, "governance/bundle-index.json", errors);
  const committee = jsonFile(root, "governance/committee-registry.json", errors);
  const evidence = [
    ...(committee.value?.external_participation ?? []),
    ...(committee.value?.internal_roles ?? []),
  ];
  if (evidence.some((row) => row.evidence?.includes("/institutional-record/"))) {
    errors.push("committee evidence still points to the missing institutional-record route");
  }
  const seenBundlePaths = new Set();
  for (const row of bundle.value?.entries ?? []) {
    const path = row.path;
    if (typeof path !== "string" || !/^\/(?:governance\/[^/]+|\.well-known\/csoai-governance\.json)$/.test(path) || seenBundlePaths.has(path)) {
      errors.push("bundle has an invalid or duplicate path");
      continue;
    }
    seenBundlePaths.add(path);
    try {
      const actual = createHash("sha256").update(readFileSync(join(root, path.slice(1)))).digest("hex");
      if (actual !== row.sha256) errors.push(`${path}: bundle digest mismatch`);
    } catch (error) {
      errors.push(`${path}: bundle asset missing (${error.message})`);
    }
  }
  for (const name of STATIC_COMPONENTS) {
    const path = new URL(COMPONENTS[name]).pathname.slice(1);
    if (!existsSync(join(root, path))) errors.push(`${name}: linked static asset missing`);
  }
  let headers = "";
  try { headers = readFileSync(join(root, "_headers"), "utf8"); }
  catch (error) { errors.push(`_headers: missing (${error.message})`); }
  errors.push(...validateDiscovery({
    manifest: manifest.value,
    pointer: pointer.value,
    bundle: bundle.value,
    headers,
    bytes: { [MANIFEST_PATH]: manifest.bytes, [DISCOVERY_PATH]: pointer.bytes },
  }));
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = resolve(process.argv[2] ?? join(HERE, "public"));
  const errors = checkFiles(target);
  console.log(JSON.stringify({ valid: errors.length === 0, target, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}
