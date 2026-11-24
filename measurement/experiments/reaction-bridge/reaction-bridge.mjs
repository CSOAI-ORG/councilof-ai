// SPDX-License-Identifier: Apache-2.0
// Research-only, deterministic, side-effect-free adapter. No executor, signer, storage, scheduler or external lookup.
// Pins do not prove source authenticity. "REPORTED" is never a qualified external acceptance.
export function isSha(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}
export function evaluateEpisode(input) {
  const stages = ["request","method","human_approval","executor_authority","executor_response","effect","receiver_verification","retrieval","payment","repeat_use"];
  const required = stages.slice(0,7);
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("unknown experiment schema");
  // Read each reviewed field ONCE into plain values, so validation and classification see the
  // same data: no accessor can answer differently later, and no inherited, non-enumerable or
  // proxy-hidden stage can be counted without being validated (2026-11-24 audit).
  const episode = {schema:input.schema, realm:input.realm, condition:input.condition,
    experiment_id:input.experiment_id, case_id:input.case_id, input_sha256:input.input_sha256,
    method_sha256:input.method_sha256, stages:input.stages};
  if (episode.schema !== "csoai.reaction-experiment/0.1")
    throw new Error("unknown experiment schema");
  if (!["SIMULATED","OBSERVED"].includes(episode.realm) || !["NO_HUMAN","HUMAN_INFORMATION","HUMAN_APPROVAL"].includes(episode.condition))
    throw new Error("invalid realm or human condition");
  for (const id of ["experiment_id","case_id"]) if (typeof episode[id] !== "string" || !/^[a-z0-9][a-z0-9._-]{0,95}$/.test(episode[id])) throw new Error("invalid bounded ID");
  for (const id of ["input_sha256","method_sha256"]) if (!isSha(episode[id])) throw new Error("missing pinned input or method digest");
  if (!episode.stages || typeof episode.stages !== "object" || Array.isArray(episode.stages))
    throw new Error("invalid stages");
  const missing=[], reviewed=Object.create(null);
  for (const [key, raw] of Object.entries(episode.stages)) {
    if (!stages.includes(key) || !raw || typeof raw !== "object" || Array.isArray(raw))
      throw new Error("invalid stage");
    const fields=Object.keys(raw);
    const value={state:raw.state, receipt_sha256:raw.receipt_sha256, source_realm:raw.source_realm};
    if (!["UNKNOWN","REPORTED","FAILED"].includes(value.state))
      throw new Error("invalid stage state");
    if (value.state === "REPORTED" && !isSha(value.receipt_sha256))
      throw new Error("reported stage needs exact receipt digest");
    if (value.state !== "REPORTED" && value.receipt_sha256 !== null && value.receipt_sha256 !== undefined)
      throw new Error("unreported stage cannot carry a receipt digest");
    if (value.source_realm !== episode.realm && value.state === "REPORTED")
      throw new Error("cross-realm evidence laundering");
    if (fields.some(k=>!["state","receipt_sha256","source_realm"].includes(k)))
      throw new Error("unreviewed stage fields");
    reviewed[key]=value;
  }
  for (const key of required) if (reviewed[key]?.state !== "REPORTED") missing.push(key);
  const failures=required.filter(key=>reviewed[key]?.state==="FAILED");
  const status = episode.realm==="SIMULATED" ? "SIMULATION_ONLY" : missing.length ?
    "ACCEPTANCE_INCOMPLETE" : "REPORTED_CHAIN_NEEDS_EXTERNAL_QUALIFICATION";
  return {
    schema:"csoai.reaction-experiment-review/0.1",
    experiment_id:episode.experiment_id, case_id:episode.case_id, realm:episode.realm,
    condition:episode.condition, source_sha256:episode.input_sha256,
    method_sha256:episode.method_sha256, status, missing_stages:missing,
    failed_stages:failures,
    stages:stages.map(key=>({stage:key,state:reviewed[key]?.state??"UNKNOWN",receipt_sha256:reviewed[key]?.receipt_sha256??null})),
    execute_authorized:false, human_identity_qualified:false,
    effect_independently_accepted:false, fresh_gspc_measurement:false,
    explanation:"Receipt digests and reported states are pointers, not authenticated actors, permitted effects, real human approval or independent recipient acceptance."
  };
}
export function compareSyntheticPaired(rows, control="NO_HUMAN", treatment="HUMAN_INFORMATION") {
  const conditions=["NO_HUMAN","HUMAN_INFORMATION","HUMAN_APPROVAL"];
  if (!conditions.includes(control) || !conditions.includes(treatment) || control===treatment) throw new Error("invalid comparison");
  if (!Array.isArray(rows) || rows.length<4 || rows.length>20000) throw new Error("invalid bounded matched sample");
  const cases=new Map(); let experiment=null, bank=null;
  for (const row of rows) {
    if (!row || typeof row!=="object" || Array.isArray(row) ||
      Object.keys(row).sort().join(",")!=="bank_sha256,case_id,condition,experiment_id,input_sha256,realm,success")
      throw new Error("invalid or extra row fields");
    if (row.realm!=="SIMULATED" || !conditions.includes(row.condition) ||
      typeof row.case_id!=="string" || !/^[a-z0-9][a-z0-9._-]{0,95}$/.test(row.case_id) ||
      typeof row.experiment_id!=="string" || !/^[a-z0-9][a-z0-9._-]{0,95}$/.test(row.experiment_id) ||
      !isSha(row.bank_sha256) || !isSha(row.input_sha256) || typeof row.success!=="boolean")
      throw new Error("invalid synthetic row or pin");
    if (![control,treatment].includes(row.condition)) throw new Error("third condition in paired trial");
    if (experiment===null) {experiment=row.experiment_id;bank=row.bank_sha256;}
    if (row.experiment_id!==experiment || row.bank_sha256!==bank) throw new Error("mixed experiment or bank");
    const key=row.case_id;
    if (!cases.has(key)) cases.set(key,{});
    const c=cases.get(key);
    if (c[row.condition]) throw new Error("duplicate case-condition row");
    c[row.condition]=row;
  }
  if (cases.size<2) throw new Error("not enough matched cases");
  let controlWins=0,treatmentWins=0,controlOnly=0,treatmentOnly=0;
  for (const c of cases.values()) {
    if (!c[control] || !c[treatment] || c[control].input_sha256!==c[treatment].input_sha256)
      throw new Error("unmatched or altered task; no imputation");
    const a=c[control].success,b=c[treatment].success;
    controlWins+=Number(a);treatmentWins+=Number(b);
    if (a&&!b) controlOnly++;
    if (!a&&b) treatmentOnly++;
  }
  const n=cases.size;
  return {schema:"csoai.synthetic-paired-comparison/0.1",realm:"SIMULATED",
    experiment_id:experiment,bank_sha256:bank,control,treatment,matched_cases:n,
    control_success:controlWins,treatment_success:treatmentWins,
    paired_difference:(treatmentWins-controlWins)/n,
    control_only:controlOnly,treatment_only:treatmentOnly,
    causal_effect_established:false,real_human_observed:false,qualified_measurement:false,
    note:"Assumed synthetic outcomes only; no real participant, model, intervention, authority, effect or measured improvement."};
}
