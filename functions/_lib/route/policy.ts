/**
 * GSPC Route: policy. Cedar is the language of record; this file is its evaluator for the closed set
 * of rule shapes the router emits.
 *
 * Two policy sets, both recorded by sha256 in the route record:
 *   - the GSPC FLOOR: small, fixed, published (policy/floor.cedar);
 *   - the CALLER policy: named presets plus two list rules, rendered to Cedar per request.
 *
 * The harness/openshell-cedar rule, carried over unchanged: nothing not fully understood becomes an
 * allow. An unknown key, an unknown preset or a value of the wrong type makes that element UNCHECKABLE,
 * and an UNCHECKABLE caller policy emits NO permit. Cedar is default-deny, so the cost of anything the
 * router does not understand is access, never containment.
 *
 * Each rule carries its Cedar text and a predicate. The predicate is the edge evaluator (Pages
 * Functions carry no Cedar engine yet: the cedar-wasm bundle size against the Function limit is
 * UNCONFIRMED). services/gspc-router/test_route_service.py runs the SAME rendered Cedar through
 * `cedar authorize` (cedar-policy-cli) over the golden fixtures and requires identical decisions.
 */
import { CANDIDATE_KINDS, DATA_CLASSES, type Candidate, type DataClass, type PolicyVerdict } from "./types";
import { SAFE_TOKEN } from "./candidates";

export const PRESETS = ["read-only", "local-only", "eu-only", "no-unmeasured"] as const;
export type Preset = (typeof PRESETS)[number];

export type PolicyContext = {
  confirm: boolean;
  caller_wallet: boolean;
  data_class: DataClass;
};

/** What the evaluator reads about a candidate, beyond the Candidate itself. */
export type CandidateFacts = { measured_on_axis: boolean };

export type Rule = {
  id: string;
  set: "floor" | "caller";
  effect: "permit" | "forbid";
  cedar: string;
  when: (c: Candidate, f: CandidateFacts, ctx: PolicyContext) => boolean;
};

const HEAD = (effect: "permit" | "forbid") => `${effect} (principal, action == Action::"route", resource)`;
const cedarStr = (s: string) => JSON.stringify(s); // SAFE_TOKEN strings only: no escapes beyond JSON's
const cedarSet = (xs: readonly string[]) => `[${xs.map(cedarStr).join(", ")}]`;

export const CEDAR_SCHEMA = `// GSPC Route policy schema (csoai.route-evidence/0.1). Rendered by functions/_lib/route/policy.ts.
entity Caller;
entity Candidate = {
  "kind": String,
  "provider": String,
  "region": String,
  "is_local": Bool,
  "read_only": Bool,
  "destructive": Bool,
  "paid": Bool,
  "census_effect_binding": String,
  "measured_on_axis": Bool,
  "data_class_allowed": Set<String>,
};
action "route" appliesTo {
  principal: [Caller],
  resource: [Candidate],
  context: {
    "confirm": Bool,
    "caller_wallet": Bool,
    "data_class": String,
  },
};
`;

/** The GSPC floor. Fixed. It only ever forbids. */
export const FLOOR_RULES: Rule[] = [
  {
    id: "floor:effect-binding-divergent",
    set: "floor",
    effect: "forbid",
    cedar: `${HEAD("forbid")}\nwhen { resource.census_effect_binding == "DIVERGENT" };`,
    when: (c) => c.census.effect_binding === "DIVERGENT",
  },
  {
    id: "floor:destructive-needs-confirm",
    set: "floor",
    effect: "forbid",
    cedar: `${HEAD("forbid")}\nwhen { resource.destructive && !context.confirm };`,
    when: (c, _f, ctx) => c.destructive && !ctx.confirm,
  },
  {
    id: "floor:paid-needs-caller-wallet",
    set: "floor",
    effect: "forbid",
    cedar: `${HEAD("forbid")}\nwhen { resource.paid && !context.caller_wallet };`,
    when: (c, _f, ctx) => c.paid && !ctx.caller_wallet,
  },
  {
    id: "floor:data-class-not-declared",
    set: "floor",
    effect: "forbid",
    cedar: `${HEAD("forbid")}\nwhen { context.data_class != "public" && !resource.data_class_allowed.contains(context.data_class) };`,
    when: (c, _f, ctx) => ctx.data_class !== "public" && !c.data_class_allowed.includes(ctx.data_class),
  },
];

const PRESET_RULES: Record<Preset, Rule> = {
  "read-only": {
    id: "caller:preset:read-only",
    set: "caller",
    effect: "forbid",
    cedar: `${HEAD("forbid")}\nwhen { !resource.read_only };`,
    when: (c) => !c.read_only,
  },
  "local-only": {
    id: "caller:preset:local-only",
    set: "caller",
    effect: "forbid",
    cedar: `${HEAD("forbid")}\nwhen { !resource.is_local };`,
    when: (c) => !c.local,
  },
  "eu-only": {
    id: "caller:preset:eu-only",
    set: "caller",
    effect: "forbid",
    // An undeclared region is "" and is forbidden: unknown is not EU.
    cedar: `${HEAD("forbid")}\nwhen { !(resource.region like "eu*") };`,
    when: (c) => !c.region.startsWith("eu"),
  },
  "no-unmeasured": {
    id: "caller:preset:no-unmeasured",
    set: "caller",
    effect: "forbid",
    cedar: `${HEAD("forbid")}\nwhen { !resource.measured_on_axis };`,
    when: (_c, f) => !f.measured_on_axis,
  },
};

const PERMIT_ALL: Rule = {
  id: "caller:permit",
  set: "caller",
  effect: "permit",
  cedar: `${HEAD("permit")};`,
  when: () => true,
};

const POLICY_KEYS = new Set(["presets", "forbid_providers", "allow_kinds", "confirm_destructive", "caller_wallet"]);

export type CallerPolicy = {
  rules: Rule[];
  presets: Preset[];
  /** Elements the router did not understand. Non-empty => no caller permit was emitted. */
  uncheckable: string[];
  confirm: boolean;
  caller_wallet: boolean;
};

/** Parse the caller's policy object. Never throws; every problem is an UNCHECKABLE element. */
export function callerPolicy(raw: unknown): CallerPolicy {
  const why: string[] = [];
  const rules: Rule[] = [];
  const presets: Preset[] = [];
  let confirm = false;
  let caller_wallet = false;
  const o = raw === undefined || raw === null ? {} : raw;
  if (typeof o !== "object" || Array.isArray(o)) {
    return { rules: [], presets: [], uncheckable: ["policy is not an object"], confirm, caller_wallet };
  }
  const p = o as Record<string, unknown>;
  for (const k of Object.keys(p).sort()) if (!POLICY_KEYS.has(k)) why.push(`unknown policy key "${k.slice(0, 40)}"`);
  if (p.presets !== undefined) {
    if (!Array.isArray(p.presets)) why.push("presets must be a list");
    else
      for (const x of p.presets) {
        if ((PRESETS as readonly string[]).includes(String(x))) {
          if (!presets.includes(x as Preset)) presets.push(x as Preset);
        } else why.push(`unknown preset "${String(x).slice(0, 40)}"`);
      }
  }
  const tokenList = (k: string, allowed?: readonly string[]): string[] | null => {
    const v = p[k];
    if (v === undefined) return null;
    if (!Array.isArray(v) || v.length === 0 || v.length > 32) {
      why.push(`${k} must be a non-empty list of at most 32 strings`);
      return null;
    }
    const out: string[] = [];
    for (const x of v) {
      if (typeof x !== "string" || !SAFE_TOKEN.test(x) || (allowed && !allowed.includes(x))) {
        why.push(`${k} entry "${String(x).slice(0, 40)}" is not understood`);
        return null;
      }
      out.push(x);
    }
    return [...new Set(out)].sort();
  };
  const forbidProviders = tokenList("forbid_providers");
  const allowKinds = tokenList("allow_kinds", CANDIDATE_KINDS);
  for (const k of ["confirm_destructive", "caller_wallet"] as const) {
    if (p[k] !== undefined && typeof p[k] !== "boolean") why.push(`${k} must be true or false`);
  }
  confirm = p.confirm_destructive === true;
  caller_wallet = p.caller_wallet === true;

  for (const pr of [...presets].sort()) rules.push(PRESET_RULES[pr]);
  if (forbidProviders)
    rules.push({
      id: "caller:forbid-providers",
      set: "caller",
      effect: "forbid",
      cedar: `${HEAD("forbid")}\nwhen { ${cedarSet(forbidProviders)}.contains(resource.provider) };`,
      when: (c) => forbidProviders.includes(c.provider),
    });
  if (allowKinds)
    rules.push({
      id: "caller:allow-kinds",
      set: "caller",
      effect: "forbid",
      cedar: `${HEAD("forbid")}\nwhen { !${cedarSet(allowKinds)}.contains(resource.kind) };`,
      when: (c) => !allowKinds.includes(c.kind),
    });
  // The rule that matters: a caller policy with ANY element not understood grants nothing.
  if (why.length === 0) rules.unshift(PERMIT_ALL);
  return { rules, presets: [...presets].sort(), uncheckable: why, confirm, caller_wallet };
}

/** Cedar text of a rule list, each rule annotated with its id (what `cedar authorize` reports). */
export function renderCedar(rules: Rule[]): string {
  return rules.map((r) => `@id(${cedarStr(r.id)})\n${r.cedar}\n`).join("\n");
}

export const FLOOR_CEDAR = `// GSPC Route floor policy. Fixed, published, forbid-only. Rendered by functions/_lib/route/policy.ts.\n${renderCedar(FLOOR_RULES)}`;

export function presetCedar(p: Preset): string {
  return `// GSPC Route caller preset "${p}". Rendered by functions/_lib/route/policy.ts.\n${renderCedar([PRESET_RULES[p]])}`;
}

/**
 * Evaluate one candidate. permit iff: the candidate is fully understood, some permit matches, and no
 * forbid matches (forbid beats permit). The verdict names the policy that decided.
 */
export function evaluate(
  c: Candidate,
  facts: CandidateFacts,
  policy: CallerPolicy,
  ctx: PolicyContext,
): PolicyVerdict {
  if (c.uncheckable.length) {
    return { permit: false, forbid_policy: `uncheckable:${c.uncheckable[0]}`, forbids_matched: [] };
  }
  const all = [...FLOOR_RULES, ...policy.rules];
  const forbids = all.filter((r) => r.effect === "forbid" && r.when(c, facts, ctx)).map((r) => r.id);
  const permitted = all.some((r) => r.effect === "permit" && r.when(c, facts, ctx));
  if (forbids.length) return { permit: false, forbid_policy: forbids[0], forbids_matched: forbids };
  if (!permitted)
    return {
      permit: false,
      forbid_policy: policy.uncheckable.length
        ? `no-permit:caller-policy-uncheckable (${policy.uncheckable[0]})`
        : "no-permit:default-deny",
      forbids_matched: [],
    };
  return { permit: true, forbid_policy: null, forbids_matched: [] };
}

/** The Cedar entity a candidate becomes (used by the pod parity test and recorded nowhere else). */
export function cedarEntity(c: Candidate, facts: CandidateFacts) {
  return {
    uid: { type: "Candidate", id: c.id },
    attrs: {
      kind: c.kind,
      provider: c.provider,
      region: c.region,
      is_local: c.local,
      read_only: c.read_only,
      destructive: c.destructive,
      paid: c.paid,
      census_effect_binding: c.census.effect_binding,
      measured_on_axis: facts.measured_on_axis,
      data_class_allowed: [...c.data_class_allowed],
    },
    parents: [],
  };
}

export const KNOWN_DATA_CLASSES: readonly string[] = DATA_CLASSES;
