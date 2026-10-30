#!/usr/bin/env node
/**
 * Build one deterministic, unsigned audit for every MEOK Hive axis specialist.
 *
 * The 33 axis ids come from the same modules as /api/gspc. The audited rows come
 * from an immutable captured board, not a second hand-maintained axis list. Every
 * specialist has a distinct mission, evidence requirements, controls and proposal
 * queue. Every mutation gate ends at HOLD: this program has no apply operation.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSlots } from "./build-axis-reports.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = join(HERE, "..");
const REGISTRY_PATH = join(REPO, "council-os/axis-specialists/registry.json");
const SNAPSHOT_PATH = join(REPO, "council-os/axis-specialists/board-2026-10-29.snapshot.json");
const MCP_TOOLS_PATH = join(REPO, "functions/mcp/gspc-tools.json");
const OUT = join(REPO, "public/axis-specialists");
const AUDIT_SCHEMA = "csoai.axis-specialist-audit/1.0";
const INDEX_SCHEMA = "csoai.axis-specialist-index/1.0";

export function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}
export const sha256 = (value) => createHash("sha256").update(canonical(value)).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const present = (value) => value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
const check = (id, state, detail, evidence = null) => ({ id, state, detail, ...(evidence === null ? {} : { evidence }) });

export function validateRegistry(registry, sourceSlots, snapshot, mcpTools) {
  const errors = [];
  if (registry?.schema !== "csoai.axis-specialist-registry/1.0") errors.push("registry schema mismatch");
  if (registry?.cluster_model?.isolation !== "LOGICAL_PER_AXIS" || registry?.cluster_model?.shared_write_access !== false) {
    errors.push("cluster isolation contract weakened");
  }
  if (registry?.rsi_contract?.mode !== "RECOMMENDATION_ONLY" || registry?.rsi_contract?.asi_claimed !== false) {
    errors.push("RSI boundary weakened");
  }
  if (registry?.human_gate?.initial_decision !== "HOLD" || registry?.human_gate?.approval_may_be_inferred !== false) {
    errors.push("human gate weakened");
  }
  const specs = Array.isArray(registry?.specialists) ? registry.specialists : [];
  const sourceIds = sourceSlots.map((slot) => slot.axis);
  const snapshotRows = Array.isArray(snapshot?.axes) ? snapshot.axes : [];
  const snapshotIds = snapshotRows.map((row) => row.axis);
  const toolNames = new Set((mcpTools?.tools || []).map((tool) => tool.name));
  for (const [label, ids] of [["source", sourceIds], ["snapshot", snapshotIds], ["registry", specs.map((spec) => spec.axis)]]) {
    if (new Set(ids).size !== ids.length) errors.push(`${label} contains duplicate axis ids`);
  }
  const expected = [...sourceIds].sort().join("\n");
  if ([...snapshotIds].sort().join("\n") !== expected) errors.push("snapshot axis set differs from /api/gspc source modules");
  if (specs.map((spec) => spec.axis).sort().join("\n") !== expected) errors.push("specialist registry does not cover exactly the source axis set");
  const sourceById = Object.fromEntries(sourceSlots.map((slot) => [slot.axis, slot]));
  const clusterIds = new Set();
  const specialistIds = new Set();
  for (const spec of specs) {
    const source = sourceById[spec.axis];
    if (!source) continue;
    const clusterId = `meok-axis-${spec.axis}`;
    const specialistId = `meok-${spec.axis}-specialist`;
    if (clusterIds.has(clusterId)) errors.push(`duplicate cluster ${clusterId}`);
    if (specialistIds.has(specialistId)) errors.push(`duplicate specialist ${specialistId}`);
    clusterIds.add(clusterId);
    specialistIds.add(specialistId);
    for (const field of ["mission", "reviewer_role"]) if (typeof spec[field] !== "string" || spec[field].length < 20) errors.push(`${spec.axis}: weak ${field}`);
    for (const [field, minimum] of [["required_fields", 4], ["audit_focus", 4], ["negative_controls", 2], ["improvements", 2]]) {
      if (!Array.isArray(spec[field]) || spec[field].length < minimum || new Set(spec[field]).size !== spec[field].length) {
        errors.push(`${spec.axis}: ${field} needs at least ${minimum} distinct entries`);
      }
    }
    const mcpTool = `axis_${spec.axis}`;
    if (!toolNames.has(mcpTool)) errors.push(`${spec.axis}: missing MCP tool ${mcpTool}`);
    const snapshotRow = snapshotRows.find((row) => row.axis === spec.axis);
    if (snapshotRow) {
      for (const field of ["family", "kind", "status", "n"]) {
        if (snapshotRow[field] !== source[field]) errors.push(`${spec.axis}: snapshot ${field} differs from source`);
      }
    }
  }
  return errors;
}

export function auditSpecialist(spec, row, registry) {
  const checks = [];
  checks.push(check("AXIS_IDENTITY", spec.axis === row.axis ? "PASS" : "FINDING", `specialist ${spec.axis} audits only the ${spec.axis} row`, row.axis));
  checks.push(check("ISOLATED_CLUSTER", "PASS", `logical cluster meok-axis-${spec.axis}; no shared write access or cross-axis credentials`));
  const missing = (spec.required_fields || []).filter((field) => !present(row[field]));
  checks.push(check("AXIS_SPECIFIC_EVIDENCE", missing.length ? "FINDING" : "PASS", missing.length ? `required evidence missing: ${missing.join(", ")}` : "all specialist-required fields are present", missing));

  if (row.kind === "model-comparison") {
    const validRun = row.status === "MEASURED" && Number.isInteger(row.n) && row.n > 0;
    checks.push(check("MODEL_RUN_STATE", validRun ? "PASS" : "FINDING", validRun ? `measured model-comparison run with n=${row.n}` : "model-comparison row lacks a measured run"));
    checks.push(check("FROZEN_BANK", present(row.dataset_url) ? "PASS" : "FINDING", present(row.dataset_url) ? "frozen bank URL is published" : "frozen bank URL is absent", row.dataset_url ?? null));
    checks.push(check("ROW_LINEAGE", present(row.peritem_file_sha256) ? "PASS" : "FINDING", present(row.peritem_file_sha256) ? "published per-item rows are digest-bound" : "per-item row digest is not published on this row"));
    if (row.leader && row.public_leader_state) checks.push(check("LEADER_STATE", "FINDING", "a named leader and a leader-suppression state cannot both be public"));
    if (!row.leader && row.public_leader_state) checks.push(check("LEADER_STATE", "PASS", `leader withheld: ${row.public_leader_state}`));
    if (row.leader) checks.push(check("LEADER_STATE", present(row.leader_card_url) || present(row.leader_card_state) ? "PASS" : "FINDING", present(row.leader_card_url) || present(row.leader_card_state) ? "leader evidence state is published" : "named leader has no evidence state"));
  } else if (row.kind === "deterministic-facts") {
    const validRun = row.status === "MEASURED" && Number.isInteger(row.n) && row.n > 0;
    checks.push(check("FACT_RUN_STATE", validRun ? "PASS" : "FINDING", validRun ? `deterministic-facts run with n=${row.n} ${row.n_unit || "facts"}` : "deterministic-facts row lacks a measured run"));
    checks.push(check("FACT_LINEAGE", present(row.evidence_url) && present(row.facts_as_of) ? "PASS" : "FINDING", present(row.evidence_url) && present(row.facts_as_of) ? "run artifact and fact timestamp are published" : "run artifact or fact timestamp is absent"));
    checks.push(check("RUN_ATTESTATION", row.run_attestation === "ED25519_SIGNED" ? "PASS" : "FINDING", row.run_attestation === "ED25519_SIGNED" ? "run artifact is declared Ed25519-signed" : `run artifact is ${row.run_attestation || "missing attestation state"}; content identity is not a signature`));
    checks.push(check("NO_MODEL_RANKING", !present(row.leader) && !present(row.accuracy) && !present(row.separation) ? "PASS" : "FINDING", "deterministic facts carry no model leader, accuracy or separation"));
  } else if (row.kind === "declared-slot") {
    const honestGap = row.status === "UNMEASURED" && row.n === 0 && present(row.applies_to);
    checks.push(check("DECLARED_GAP", honestGap ? "PASS" : "FINDING", honestGap ? `UNMEASURED slot for ${row.applies_to}; n=0 is not a score` : "declared slot violates UNMEASURED, n=0 or subject-scope grammar"));
    checks.push(check("NO_FABRICATED_SCORE", !present(row.leader) && !present(row.accuracy) && !present(row.separation) ? "PASS" : "FINDING", "declared slot has no leader, accuracy or separation"));
  } else {
    checks.push(check("MEASUREMENT_KIND", "FINDING", `unknown measurement kind ${row.kind}`));
  }

  const method = String(row.method_status || "");
  if (method.startsWith("legacy:")) checks.push(check("CURRENT_METHOD_RULE", "FINDING", method));
  else if (present(row.method_status)) checks.push(check("CURRENT_METHOD_RULE", "PASS", method));

  const findings = checks.filter((item) => item.state === "FINDING");
  const audit = {
    schema: AUDIT_SCHEMA,
    axis: spec.axis,
    specialist: {
      id: `meok-${spec.axis}-specialist`,
      cluster_id: `meok-axis-${spec.axis}`,
      cluster_state: registry.cluster_model.state,
      mission: spec.mission,
      reviewer_role: spec.reviewer_role,
      isolation: registry.cluster_model.isolation,
      asi_claimed: false,
      rsi_mode: registry.rsi_contract.mode,
    },
    audit_focus: spec.audit_focus,
    source: {
      schema: "csoai.gspc-axes/0.5",
      snapshot: "council-os/axis-specialists/board-2026-10-29.snapshot.json",
      measurement_time: row.measurement_time ?? null,
      axis_row_sha256: sha256(row),
      axis_row: row,
    },
    checks,
    summary: {
      checks: checks.length,
      passed: checks.filter((item) => item.state === "PASS").length,
      findings: findings.length,
      audit_state: row.status === "UNMEASURED" ? "MEASUREMENT_GAP_VISIBLE" : findings.length ? "IMPROVEMENT_REQUIRED" : "HUMAN_REVIEW_READY",
    },
    negative_controls: spec.negative_controls.map((control) => ({ control, state: "SPECIFIED_NOT_RUN" })),
    improvement_proposals: spec.improvements.map((proposal, index) => ({
      id: `${spec.axis}-proposal-${index + 1}`,
      proposal,
      state: "PROPOSED_NOT_APPLIED",
      requires_human_approval: true,
    })),
    interfaces: {
      mcp_read_tool: `axis_${spec.axis}`,
      a2a_skill: "axis-specialist",
      api: `/api/axis-specialists/${spec.axis}`,
      human_gate: "/api/hitl",
    },
    human_gate: {
      policy: registry.policy,
      decision: "HOLD",
      approval_required: true,
      may_apply: false,
      reviewer_role: spec.reviewer_role,
      receipt: null,
      note: "No proposal is approved, applied, signed or deployed by this audit.",
    },
    non_claims: ["not a new measurement", "not certification", "not ASI", "not autonomous self-improvement", "not a provisioned compute cluster"],
  };
  const { audit_sha256: _omitAuditHash, ...auditBody } = audit;
  audit.audit_sha256 = sha256(auditBody);
  return audit;
}

export function buildTree({ registry, sourceSlots, snapshot, mcpTools } = {}) {
  registry ??= readJson(REGISTRY_PATH);
  snapshot ??= readJson(SNAPSHOT_PATH);
  mcpTools ??= readJson(MCP_TOOLS_PATH);
  const errors = validateRegistry(registry, sourceSlots, snapshot, mcpTools);
  if (errors.length) throw new Error(`axis specialist validation failed:\n- ${errors.join("\n- ")}`);
  const rowById = Object.fromEntries(snapshot.axes.map((row) => [row.axis, row]));
  const audits = registry.specialists.map((spec) => auditSpecialist(spec, rowById[spec.axis], registry));
  const files = new Map();
  const indexRows = audits.map((audit) => {
    files.set(`${audit.axis}.json`, audit);
    return {
      axis: audit.axis,
      specialist_id: audit.specialist.id,
      cluster_id: audit.specialist.cluster_id,
      cluster_state: audit.specialist.cluster_state,
      measurement_status: audit.source.axis_row.status,
      family: audit.source.axis_row.family,
      kind: audit.source.axis_row.kind,
      audit_state: audit.summary.audit_state,
      checks: audit.summary.checks,
      findings: audit.summary.findings,
      proposals: audit.improvement_proposals.length,
      human_decision: audit.human_gate.decision,
      may_apply: audit.human_gate.may_apply,
      mcp_read_tool: audit.interfaces.mcp_read_tool,
      a2a_skill: audit.interfaces.a2a_skill,
      api: audit.interfaces.api,
      audit_sha256: audit.audit_sha256,
      path: `/axis-specialists/${audit.axis}.json`,
    };
  });
  const bundle = {
    schema: "csoai.axis-specialist-bundle/1.0",
    policy: registry.policy,
    source_snapshot: "council-os/axis-specialists/board-2026-10-29.snapshot.json",
    specialists: audits,
  };
  const { bundle_sha256: _omitBundleHash, ...bundleBody } = bundle;
  bundle.bundle_sha256 = sha256(bundleBody);
  const index = {
    schema: INDEX_SCHEMA,
    policy: registry.policy,
    source_snapshot: bundle.source_snapshot,
    coverage: {
      specialists: indexRows.length,
      clusters: new Set(indexRows.map((row) => row.cluster_id)).size,
      mcp_connections: indexRows.filter((row) => row.mcp_read_tool).length,
      a2a_connections: indexRows.filter((row) => row.a2a_skill === "axis-specialist").length,
      api_connections: indexRows.filter((row) => row.api).length,
      human_gates: indexRows.filter((row) => row.human_decision === "HOLD" && row.may_apply === false).length,
    },
    findings: indexRows.reduce((sum, row) => sum + row.findings, 0),
    proposals: indexRows.reduce((sum, row) => sum + row.proposals, 0),
    applied_proposals: 0,
    cluster_model: registry.cluster_model,
    rsi_contract: registry.rsi_contract,
    specialists: indexRows,
    bundle_sha256: bundle.bundle_sha256,
    note: "Counts are derived from the specialist array. This is an unsigned deterministic audit and proposal queue, not a new measurement or certification.",
  };
  files.set("index.json", index);
  files.set("bundle.json", bundle);
  return files;
}

export function writeTree(files, out = OUT) {
  mkdirSync(out, { recursive: true });
  const wanted = new Set(files.keys());
  for (const name of readdirSync(out)) {
    if (name.endsWith(".json") && !wanted.has(name)) rmSync(join(out, name));
  }
  for (const [name, value] of files) writeFileSync(join(out, name), `${JSON.stringify(value, null, 2)}\n`);
}

function checkTree(files, out = OUT) {
  const stale = [];
  for (const [name, value] of files) {
    const path = join(out, name);
    const expected = `${JSON.stringify(value, null, 2)}\n`;
    if (!existsSync(path) || readFileSync(path, "utf8") !== expected) stale.push(relative(REPO, path));
  }
  if (existsSync(out)) {
    for (const name of readdirSync(out)) if (name.endsWith(".json") && !files.has(name)) stale.push(relative(REPO, join(out, name)));
  }
  return stale;
}

export async function selftest() {
  const registry = readJson(REGISTRY_PATH);
  const snapshot = readJson(SNAPSHOT_PATH);
  const mcpTools = readJson(MCP_TOOLS_PATH);
  const sourceSlots = await loadSlots(REPO);
  const baseErrors = validateRegistry(registry, sourceSlots, snapshot, mcpTools);
  if (baseErrors.length) throw new Error(baseErrors.join("\n"));
  let requiredFieldControls = 0;
  let identityControls = 0;
  let promotionControls = 0;
  for (const spec of registry.specialists) {
    const row = snapshot.axes.find((item) => item.axis === spec.axis);
    const removed = { ...row };
    delete removed[spec.required_fields[0]];
    if (auditSpecialist(spec, removed, registry).checks.find((item) => item.id === "AXIS_SPECIFIC_EVIDENCE")?.state !== "FINDING") {
      throw new Error(`${spec.axis}: required-field negative control did not fail`);
    }
    requiredFieldControls += 1;
    if (auditSpecialist(spec, { ...row, axis: `not-${spec.axis}` }, registry).checks.find((item) => item.id === "AXIS_IDENTITY")?.state !== "FINDING") {
      throw new Error(`${spec.axis}: identity negative control did not fail`);
    }
    identityControls += 1;
    if (row.kind === "declared-slot") {
      const promoted = { ...row, status: "MEASURED", n: 30 };
      if (auditSpecialist(spec, promoted, registry).checks.find((item) => item.id === "DECLARED_GAP")?.state !== "FINDING") {
        throw new Error(`${spec.axis}: declared-slot promotion control did not fail`);
      }
      promotionControls += 1;
    }
    const audit = auditSpecialist(spec, row, registry);
    if (audit.human_gate.decision !== "HOLD" || audit.human_gate.may_apply !== false || audit.improvement_proposals.some((item) => item.state !== "PROPOSED_NOT_APPLIED")) {
      throw new Error(`${spec.axis}: human gate or proposal boundary failed`);
    }
  }
  const duplicated = { ...registry, specialists: registry.specialists.map((spec) => ({ ...spec })) };
  duplicated.specialists[1] = { ...duplicated.specialists[1], axis: duplicated.specialists[0].axis };
  if (!validateRegistry(duplicated, sourceSlots, snapshot, mcpTools).some((error) => error.includes("registry contains duplicate"))) {
    throw new Error("duplicate-axis registry control did not fail");
  }
  const weakened = { ...registry, rsi_contract: { ...registry.rsi_contract, mode: "AUTONOMOUS_APPLY" } };
  if (!validateRegistry(weakened, sourceSlots, snapshot, mcpTools).some((error) => error.includes("RSI boundary"))) {
    throw new Error("RSI negative control did not fail");
  }
  return {
    state: "PASS",
    specialists: registry.specialists.length,
    required_field_controls: requiredFieldControls,
    identity_controls: identityControls,
    unmeasured_promotion_controls: promotionControls,
    human_gate_controls: registry.specialists.length,
    duplicate_registry_control: "PASS",
    autonomous_apply_control: "PASS",
  };
}

async function main() {
  if (process.argv.includes("--selftest")) {
    console.log(JSON.stringify(await selftest(), null, 2));
    return;
  }
  const sourceSlots = await loadSlots(REPO);
  const files = buildTree({ sourceSlots });
  if (process.argv.includes("--check")) {
    const stale = checkTree(files);
    if (stale.length) {
      console.error(`axis specialist artifacts stale:\n${stale.join("\n")}`);
      process.exitCode = 1;
    } else {
      console.log(`axis specialist artifacts current: ${files.size - 2} specialists, ${files.size} generated files`);
    }
    return;
  }
  writeTree(files);
  const index = files.get("index.json");
  console.log(JSON.stringify({ state: "BUILT_UNSIGNED", coverage: index.coverage, findings: index.findings, proposals: index.proposals, applied_proposals: index.applied_proposals }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}
