/**
 * _population.ts — the registry behind GET /api/pop/{population}: every measured population the
 * estate already publishes, as a read-transform of the artifact that measured it.
 *
 * WHAT A READER IS. A reader opens the artifact(s) that already exist under public/ (or the live
 * function that serves them), and derives at REQUEST TIME: the state, the count `n` and its unit,
 * the artifact's own as_of, and the paths read. Nothing here is typed from memory: a count that
 * cannot be read from bytes is null with a reason, never a number. A reader never adds two
 * frames the artifact itself refuses to add (agent-population publishes overlap instead of a
 * total; the stablecoin corpus counts assets, not supply).
 *
 * STATES, NEVER COLLAPSED.
 *   INDEXED     the artifact catalogues the rows (identity + source cited); nothing was measured
 *               about each row here beyond its presence and whatever the artifact states.
 *   MEASURED    the artifact itself is a deterministic-facts run whose rows carry a verdict
 *               (the reader reports the artifact's own kind and never upgrades an INDEXED set).
 *   UNMEASURED  the artifact could not be read from this deploy (absent, not JSON, or missing
 *               the field the count is derived from) — the reason is named, n is null.
 *   UNCHECKABLE the artifact was read but its own bytes disagree with themselves (e.g. a
 *               published count that does not match its rows); both numbers are reported.
 *
 * `head` is what the free preview and the 402 description carry. `rows` is the metered slice
 * and is read only when `full` is true (a bare GET never pulls a megabyte to say 402).
 */
import { LEDGER } from "./corrections";
import { onRequestGet as xrplReader } from "./xrpl";

export type PopState = "INDEXED" | "MEASURED" | "UNMEASURED" | "UNCHECKABLE";

export type Reading = {
  state: PopState;
  /** The artifact's own count, or null when it cannot be read. Never invented. */
  n: number | null;
  n_unit: string;
  as_of: string | null;
  /** Every path read (site-relative), in the order read. */
  source: string[];
  /** Why n is null or the state is not what the artifact promised. */
  reason: string | null;
  /** Named gaps — the honest complement of what was read. */
  unmeasured: string[];
  /** Extra preview fields: counts by state, identification method, caveats as the artifact states them. */
  head: Record<string, unknown>;
  /** The metered slice. Present only on a full read. */
  rows?: unknown;
  rows_unit?: string;
};

export type Fetched =
  | { ok: true; text: string; json: unknown; status: number }
  | { ok: false; reason: string; status: number | null };

export type Io = {
  origin: string;
  /** Read a site-relative path as text + parsed JSON (JSON parse failure is reported, not thrown). */
  get: (path: string) => Promise<Fetched>;
  /** Read a site-relative path as raw bytes (for .ots proofs). */
  bytes: (path: string) => Promise<{ ok: true; bytes: Uint8Array } | { ok: false; reason: string }>;
  request: Request;
};

export type PopulationEntry = {
  id: string;
  title: string;
  /** One sentence naming what one row IS. No numbers — those are read. */
  population: string;
  /** Tags for the 402 (≤5, ≤32 chars each). */
  tags: string[];
  read: (io: Io, full: boolean) => Promise<Reading>;
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const arr = (v: unknown): unknown[] | null => (Array.isArray(v) ? v : null);

const unread = (source: string[], reason: string, n_unit: string, extra: Partial<Reading> = {}): Reading => ({
  state: "UNMEASURED",
  n: null,
  n_unit,
  as_of: null,
  source,
  reason,
  unmeasured: [reason],
  head: {},
  ...extra,
});

/** Site-relative `fetch` wrapper: absent, non-JSON and empty bodies are reasons, never throws. */
export function makeIo(request: Request): Io {
  const origin = new URL(request.url).origin;
  return {
    origin,
    request,
    get: async (path) => {
      try {
        const r = await fetch(new URL(path, origin).toString(), { headers: { accept: "application/json" } });
        if (!r.ok) return { ok: false, reason: `${path} HTTP ${r.status}`, status: r.status };
        const text = await r.text();
        try {
          return { ok: true, text, json: JSON.parse(text), status: r.status };
        } catch {
          return { ok: false, reason: `${path} is not JSON`, status: r.status };
        }
      } catch (e) {
        return { ok: false, reason: `${path} unreachable: ${(e as Error)?.message || String(e)}`, status: null };
      }
    },
    bytes: async (path) => {
      try {
        const r = await fetch(new URL(path, origin).toString());
        if (!r.ok) return { ok: false, reason: `${path} HTTP ${r.status}` };
        return { ok: true, bytes: new Uint8Array(await r.arrayBuffer()) };
      } catch (e) {
        return { ok: false, reason: `${path} unreachable: ${(e as Error)?.message || String(e)}` };
      }
    },
  };
}

export async function sha256HexOf(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── OpenTimestamps: state from the proof's own bytes ────────────────────────────────────────
// A .ots file is a proof only if it opens with the OTS magic; it is Bitcoin-attested only if it
// carries a BitcoinBlockHeaderAttestation tag, and calendar-pending if it carries only pending
// tags. The same reading scripts/ots_manifest_rebuild.py makes, done here on bytes so a door
// never types "pending" from memory. An .ots is not a proof because of its name.
const OTS_MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];
const TAG_BITCOIN = [0x05, 0x88, 0x96, 0x0d, 0x73, 0xd7, 0x19, 0x01];
const TAG_PENDING = [0x83, 0xdf, 0xe3, 0x0d, 0x2e, 0xf9, 0x0c, 0x8e];

function hasSeq(bytes: Uint8Array, seq: number[], from = 0): boolean {
  outer: for (let i = from; i + seq.length <= bytes.length; i++) {
    for (let j = 0; j < seq.length; j++) if (bytes[i + j] !== seq[j]) continue outer;
    return true;
  }
  return false;
}

export type OtsState = "BITCOIN" | "PENDING" | "NOT_A_PROOF" | "UNCHECKABLE";
export function otsStateFromBytes(bytes: Uint8Array): OtsState {
  for (let i = 0; i < OTS_MAGIC.length; i++) if (bytes[i] !== OTS_MAGIC[i]) return "NOT_A_PROOF";
  if (hasSeq(bytes, TAG_BITCOIN, OTS_MAGIC.length)) return "BITCOIN";
  if (hasSeq(bytes, TAG_PENDING, OTS_MAGIC.length)) return "PENDING";
  return "UNCHECKABLE";
}

// ── Python json.dumps(sort_keys=True, indent=1) [ensure_ascii default], byte for byte ──────
// The claim registry's registry_digest is the sha256 of exactly that serialisation of the file
// minus the digest field. Reproduced here so the door DERIVES "reproducible: true/false" from
// the bytes it serves, instead of typing either answer.
export function pyDumpsSortedIndent1(v: unknown, level = 0): string {
  const pad = (n: number) => " ".repeat(n);
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : JSON.stringify(v);
  if (typeof v === "string") return JSON.stringify(v).replace(/[-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    return "[\n" + v.map((x) => pad(level + 1) + pyDumpsSortedIndent1(x, level + 1)).join(",\n") + "\n" + pad(level) + "]";
  }
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  if (keys.length === 0) return "{}";
  return "{\n" + keys.map((k) => pad(level + 1) + pyDumpsSortedIndent1(k) + ": " + pyDumpsSortedIndent1(o[k], level + 1)).join(",\n") + "\n" + pad(level) + "}";
}

/** v0.3 registry digest: the declared compact UTF-8 integer-only claim serializer. */
export function claimRegistryCompact(value: unknown): string {
  const walk = (v: unknown): string => {
    if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number") {
      if (!Number.isSafeInteger(v)) throw new Error("Registry number is outside the declared integer encoding");
      return String(v);
    }
    if (Array.isArray(v)) return "[" + v.map(walk).join(",") + "]";
    if (v && typeof v === "object") return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + walk((v as Record<string, unknown>)[k])).join(",") + "}";
    throw new Error("Registry contains an unsupported value");
  };
  return walk(value);
}

// ── the populations ─────────────────────────────────────────────────────────────────────────

const STABLECOIN_INDEX = "/interop/stablecoin-corpus-index-2026-09-16.json";
const STABLECOIN_READINESS = "/interop/stablecoin-universe-2026-09/readiness.json";
const STABLECOIN_EVM = "/interop/stablecoin-universe-supply-2026-09-16.json";
const STABLECOIN_SOLANA = "/interop/stablecoin-solana-supply-2026-09-16.json";

const stablecoins: PopulationEntry = {
  id: "stablecoins",
  title: "Stablecoin universe",
  population: "one row per stablecoin asset in the frozen discovery universe, with each reader's per-chain deployment reads and every unmeasured asset's own reason",
  tags: ["population", "stablecoins", "census", "x402"],
  read: async (io, full) => {
    const unit = "assets catalogued in the frozen universe (not supply, not a sum)";
    const idx = await io.get(STABLECOIN_INDEX);
    if (!idx.ok) return unread([STABLECOIN_INDEX], idx.reason, unit);
    const j = isObj(idx.json) ? idx.json : {};
    const n = num(j.universe_asset_count);
    if (n === null) return unread([STABLECOIN_INDEX], `${STABLECOIN_INDEX} carries no universe_asset_count`, unit);
    const reading: Reading = {
      state: "INDEXED",
      n,
      n_unit: unit,
      as_of: str(j.as_of),
      source: [STABLECOIN_INDEX],
      reason: null,
      unmeasured: [],
      head: {
        index_schema: str(j.schema),
        assets_with_at_least_one_measured_deployment: num(j.assets_with_at_least_one_measured_deployment),
        still_unmeasured: num(j.still_unmeasured),
        by_reader: isObj(j.by_reader) ? j.by_reader : null,
        disjointness_checked: isObj(j.disjointness_checked) ? j.disjointness_checked : null,
        not_a_supply_total: str(j.not_a_supply_total),
        identification: "catalogued: presence in the frozen discovery index; a measured deployment is a totalSupply()/getTokenSupply read at a named block by one of the two readers — never a reserve, never backing, never a grade",
      },
    };
    if (!full) return reading;
    const [ready, evm, sol] = await Promise.all([io.get(STABLECOIN_READINESS), io.get(STABLECOIN_EVM), io.get(STABLECOIN_SOLANA)]);
    const rows: Record<string, unknown> = {};
    for (const [name, path, got, pick] of [
      ["catalogue", STABLECOIN_READINESS, ready, (o: Record<string, unknown>) => ({ as_of: str(o.as_of), schema: str(o.schema), coverage: o.coverage ?? null, truth_rules: o.truth_rules ?? null, assets: arr(o.assets) })],
      ["evm_deployments", STABLECOIN_EVM, evm, (o: Record<string, unknown>) => ({ as_of: str(o.as_of), schema: str(o.schema), kind: str(o.kind), chains_read: o.chains_read ?? null, counts: o.counts ?? null, measured_by_chain: o.measured_by_chain ?? null, honesty: str(o.honesty), no_total_is_published: str(o.no_total_is_published), upstream_defects_found: o.upstream_defects_found ?? null, rows: arr(o.rows) })],
      ["solana_deployments", STABLECOIN_SOLANA, sol, (o: Record<string, unknown>) => ({ as_of: str(o.as_of), schema: str(o.schema), kind: str(o.kind), slot: o.slot ?? null, n: num(o.n), counts: o.counts ?? null, honesty: str(o.honesty), rows: arr(o.rows) })],
    ] as const) {
      reading.source.push(path);
      if (got.ok && isObj(got.json)) {
        const picked = pick(got.json) as Record<string, unknown>;
        const list = (picked.assets ?? picked.rows) as unknown[] | null;
        rows[name] = { ...picked, row_count: list ? list.length : null };
      } else {
        rows[name] = { unreadable: got.ok ? `${path} is not an object` : got.reason };
        reading.unmeasured.push(`${name}: ${got.ok ? "not an object" : got.reason}`);
      }
    }
    const cat = rows.catalogue as { row_count?: number | null } | undefined;
    if (cat && typeof cat.row_count === "number" && cat.row_count !== n) {
      reading.state = "UNCHECKABLE";
      reading.reason = `the index says universe_asset_count ${n} but the catalogue carries ${cat.row_count} rows; both are reported, neither is chosen`;
    }
    reading.rows = rows;
    reading.rows_unit = "catalogue rows + per-chain deployment reads, verbatim from the three artifacts";
    return reading;
  },
};

const SWIFT_CENSUS = "/interop/swift-census.json";
const swift: PopulationEntry = {
  id: "swift",
  title: "SWIFT-linked bank census",
  population: "one row per bank named in a dated public notice about the Swift digital-asset MVP, in one of three states (LIVE, COMMITTED, DISCOVERED) — mixed identity by design, never a client list",
  tags: ["population", "swift", "banks", "census", "x402"],
  read: async (io, full) => {
    const unit = "sourced bank rows (three-state; identity = a dated press URL, hashed)";
    const got = await io.get(SWIFT_CENSUS);
    if (!got.ok) return unread([SWIFT_CENSUS], got.reason, unit);
    const j = isObj(got.json) ? got.json : {};
    const rows = arr(j.rows);
    if (!rows) return unread([SWIFT_CENSUS], `${SWIFT_CENSUS} carries no rows[]`, unit);
    const declared = num(j.n);
    const byStatus: Record<string, number> = {};
    for (const r of rows) {
      const s = isObj(r) ? String(r.status ?? r.state ?? "unknown") : "unknown";
      byStatus[s] = (byStatus[s] || 0) + 1;
    }
    const reading: Reading = {
      state: declared !== null && declared !== rows.length ? "UNCHECKABLE" : "INDEXED",
      n: rows.length,
      n_unit: unit,
      as_of: str(j.as_of),
      source: [SWIFT_CENSUS],
      reason: declared !== null && declared !== rows.length ? `the census says n ${declared} but carries ${rows.length} rows` : null,
      unmeasured: [],
      head: {
        schema: str(j.schema),
        kind: str(j.kind),
        supersedes: str(j.supersedes),
        declared_n: declared,
        by_status: byStatus,
        n_measured: num(j.n_measured),
        n_live: num(j.n_live),
        n_committed: num(j.n_committed),
        n_discovered: num(j.n_discovered),
        settlement_still_off_chain: j.settlement_still_off_chain ?? null,
        swift_partnered: j.swift_partnered ?? null,
        cohort_are_clients: j.cohort_are_clients ?? null,
        honest_count_statement: str(j.honest_count_statement),
        universe_note: str(j.universe_note),
        identification: "a bank is on the census only with a real, reachable press URL and a date; state is the notice's own wording; nothing is measured about the bank",
      },
    };
    if (full) {
      reading.rows = { sources: j.sources ?? null, rows };
      reading.rows_unit = "census rows verbatim (name, state, press URL, date, sha256 of the notice where fetched)";
    }
    return reading;
  },
};

const XRPL_REGISTRY = "/interop/xrpl-issuer-registry.json";
const xrpl: PopulationEntry = {
  id: "xrpl",
  title: "XRPL issued-asset set",
  population: "one row per XRPL issued asset whose xrpl.asset.state card sits on the current public root, read by the live /api/xrpl reader; the issuer registry artifact is reported beside it and never merged",
  tags: ["population", "xrpl", "issuers", "census", "x402"],
  read: async (io, full) => {
    const unit = "xrpl.asset.state leaves on the public root (the live reader's n)";
    // The live reader, in-process: it reads /root.json + /cards-bundle.json itself.
    let live: Fetched;
    try {
      const r = await (xrplReader as unknown as (c: { request: Request; env: Record<string, unknown>; params: Record<string, string> }) => Promise<Response>)({
        request: new Request(new URL("/api/xrpl", io.origin).toString()),
        env: {},
        params: {},
      });
      const text = await r.text();
      let json: unknown = null;
      try { json = JSON.parse(text); } catch { /* reported below */ }
      live = r.ok && json !== null ? { ok: true, text, json, status: r.status } : { ok: false, reason: json && isObj(json) && typeof json.reason === "string" ? `/api/xrpl ${r.status}: ${json.reason}` : `/api/xrpl HTTP ${r.status}`, status: r.status };
    } catch (e) {
      live = { ok: false, reason: `/api/xrpl threw: ${(e as Error)?.message || String(e)}`, status: null };
    }
    const reg = await io.get(XRPL_REGISTRY);
    const regJ = reg.ok && isObj(reg.json) ? reg.json : null;
    const issuers = regJ ? arr(regJ.issuers) : null;
    const registry = {
      path: XRPL_REGISTRY,
      as_of: regJ ? str(regJ.as_of) : null,
      schema: regJ ? str(regJ.schema) : null,
      issuer_rows: issuers ? issuers.length : null,
      ...(reg.ok ? {} : { unreadable: reg.reason }),
      note: "a separate artifact (issuer registry, unsigned). Its rows are not the reader's leaves and are not added to n.",
    };
    if (!live.ok) {
      return unread(["/api/xrpl", XRPL_REGISTRY], live.reason, unit, {
        head: {
          reader: "/api/xrpl (live; 404 is its honest state when the root does not carry the locked set)",
          registry,
          identification: "an asset is in the set because a signed xrpl.asset.state card for it is a leaf of the current public root; when the root does not carry the locked set the reader 404s and this door is UNMEASURED, not 0",
        },
        unmeasured: [live.reason, ...(reg.ok ? [] : [reg.reason])],
      });
    }
    const j = isObj(live.json) ? live.json : {};
    const assets = arr(j.assets);
    const n = num(j.n);
    const reading: Reading = {
      state: "INDEXED",
      n: assets ? assets.length : n,
      n_unit: unit,
      as_of: str(j.as_of),
      source: ["/api/xrpl", "/root.json", "/cards-bundle.json", XRPL_REGISTRY],
      reason: null,
      unmeasured: reg.ok ? [] : [reg.reason],
      head: {
        reader_schema: str(j.schema),
        merkle_root: str(j.merkle_root),
        declared_n: n,
        xrpl_asset_count_attempted: num(j.xrpl_asset_count_attempted),
        note: str(j.note),
        registry,
        identification: "an asset is in the set because a signed xrpl.asset.state card for it is a leaf of the current public root; holders/supply carry their own REPORTED_WITH_METHOD / UNMEASURED state per row",
      },
    };
    if (assets && n !== null && assets.length !== n) {
      reading.state = "UNCHECKABLE";
      reading.reason = `the reader says n ${n} but returned ${assets.length} assets`;
    }
    if (full) {
      reading.rows = { reader: j, registry: regJ ? { ...regJ } : { unreadable: reg.ok ? "not an object" : reg.reason } };
      reading.rows_unit = "the live reader's assets[] verbatim, plus the issuer registry artifact verbatim (separate, not merged)";
    }
    return reading;
  },
};

const AGENT_POP = "/interop/agent-population-2026-09-17.json";
const X402_DOOR_CENSUS = "/interop/x402-door-census-2026-09-16.json";
const BAZAAR_DIFF_REASON =
  "the daily x402 Bazaar conformance census (csoai.x402-bazaar-conformance/0.2, per-host probes + day-over-day diff) is produced on the pod under /workspace/lanes/out/x402-bazaar-conformance and is not published in this repository; the diff is UNMEASURED here, not 0";

function frameRow(sources: unknown[] | null, name: string): Record<string, unknown> | null {
  if (!sources) return null;
  const r = sources.find((s) => isObj(s) && s.source === name);
  return isObj(r) ? r : null;
}

const x402Bazaar: PopulationEntry = {
  id: "x402-bazaar",
  title: "x402 Bazaar listings",
  population: "the payable resources catalogued by the two public x402 discovery indexes (Coinbase CDP, PayAI), counted within each frame with the cross-frame overlap published, plus the estate's own doors as its door census read them",
  tags: ["population", "x402", "bazaar", "census"],
  read: async (io, full) => {
    const unit = "listings per index frame (frames overlap; the artifact refuses a total, so n is null — not 0)";
    const [pop, ours] = await Promise.all([io.get(AGENT_POP), io.get(X402_DOOR_CENSUS)]);
    if (!pop.ok) return unread([AGENT_POP, X402_DOOR_CENSUS], pop.reason, unit, { unmeasured: [pop.reason, BAZAAR_DIFF_REASON] });
    const j = isObj(pop.json) ? pop.json : {};
    const totals = isObj(j.totals) ? j.totals : null;
    const cdp = totals ? num(totals["x402-cdp-bazaar"]) : null;
    const payai = totals ? num(totals["x402-payai-bazaar"]) : null;
    if (cdp === null || payai === null) return unread([AGENT_POP, X402_DOOR_CENSUS], `${AGENT_POP} carries no totals for the two bazaar frames`, unit, { unmeasured: [BAZAAR_DIFF_REASON] });
    const overlap = isObj(j.pairwise_overlap) ? num(j.pairwise_overlap["x402-cdp-bazaar ∩ x402-payai-bazaar"]) : null;
    const sources = arr(j.sources);
    const oursJ = ours.ok && isObj(ours.json) ? ours.json : null;
    const ourRows = oursJ ? arr(oursJ.rows) : null;
    const reading: Reading = {
      state: "INDEXED",
      n: null,
      n_unit: unit,
      as_of: str(j.as_of),
      source: [AGENT_POP, X402_DOOR_CENSUS],
      reason: null,
      unmeasured: [BAZAAR_DIFF_REASON, ...(ours.ok ? [] : [ours.reason])],
      head: {
        n_by_frame: { "x402-cdp-bazaar": cdp, "x402-payai-bazaar": payai },
        overlap_cdp_payai: overlap,
        frames: { "x402-cdp-bazaar": frameRow(sources, "x402-cdp-bazaar"), "x402-payai-bazaar": frameRow(sources, "x402-payai-bazaar") },
        what_this_is_not: j.what_this_is_not ?? null,
        our_doors: oursJ
          ? { path: X402_DOOR_CENSUS, as_of: str(oursJ.as_of), n: ourRows ? ourRows.length : num(oursJ.n), counts: oursJ.counts ?? null, honesty: str(oursJ.honesty) }
          : { path: X402_DOOR_CENSUS, unreadable: ours.ok ? "not an object" : ours.reason },
        diff: { state: "UNMEASURED", reason: BAZAAR_DIFF_REASON },
        identification: "a listing is a row the index returned on an unauthenticated full walk (pages and distinct keys per frame are in `frames`); appearing in an index says nothing about whether the door delivers",
      },
    };
    if (full) {
      reading.rows = { agent_population: j, our_doors: oursJ ?? { unreadable: ours.ok ? "not an object" : ours.reason } };
      reading.rows_unit = "the census artifact verbatim (it carries frame totals and overlap, not per-listing rows) plus the estate's own door census rows";
    }
    return reading;
  },
};

const MCP_SELF = "/interop/mcp-registry-self-listings-2026-09-22.json";
const EB_PROBE = "/interop/effect-binding-server-probe-2026-09-22.json";
const mcpRegistry: PopulationEntry = {
  id: "mcp-registry",
  title: "MCP registry listings",
  population: "one row per server name the estate publishes in the official MCP registry, classified on its latest version (remote alive / package resolvable), with the registry's full-walk census reported beside it",
  tags: ["population", "mcp", "registry", "census", "x402"],
  read: async (io, full) => {
    const unit = "own server names in the official MCP registry (one row per name, classified on isLatest=true)";
    const [self, pop] = await Promise.all([io.get(MCP_SELF), io.get(AGENT_POP)]);
    if (!self.ok) return unread([MCP_SELF, AGENT_POP], self.reason, unit);
    const j = isObj(self.json) ? self.json : {};
    const rows = arr(j.rows);
    if (!rows) return unread([MCP_SELF, AGENT_POP], `${MCP_SELF} carries no rows[]`, unit);
    const population = isObj(j.population) ? j.population : {};
    const declared = num(j.denominator);
    const popJ = pop.ok && isObj(pop.json) ? pop.json : null;
    const registryFrame = popJ ? frameRow(arr(popJ.sources), "mcp-official-registry") : null;
    const reading: Reading = {
      state: declared !== null && declared !== rows.length ? "UNCHECKABLE" : "INDEXED",
      n: rows.length,
      n_unit: unit,
      as_of: str(j.generated_at) || str(j.as_of),
      source: [MCP_SELF, AGENT_POP],
      reason: declared !== null && declared !== rows.length ? `the artifact says denominator ${declared} but carries ${rows.length} rows` : null,
      unmeasured: pop.ok ? [] : [pop.reason],
      head: {
        schema: str(j.schema),
        kind: str(j.kind),
        signed: j.signed ?? null,
        declared_denominator: declared,
        versions_total: num(population.versions_total),
        names_total: num(population.names_total),
        namespaces_seen: population.namespaces_seen ?? null,
        totals_by_state: isObj(j.totals_by_state) ? j.totals_by_state : null,
        redactions: isObj(j.redactions) ? j.redactions : null,
        honesty: str(j.honesty),
        whole_registry: registryFrame
          ? { path: AGENT_POP, as_of: str(popJ!.as_of), frame: "mcp-official-registry", distinct_keys: num(registryFrame.distinct_keys), by_status: registryFrame.by_status ?? null, state: str(registryFrame.state) }
          : { path: AGENT_POP, unreadable: pop.ok ? "no mcp-official-registry frame" : pop.reason },
        identification: "a row is a distinct server name under the estate's namespace in the registry's own search walk (page hashes in the artifact); state is what the remote and package resolved to on that day — not a grade",
      },
    };
    if (full) {
      // Effect-binding server probe: COUNTS ONLY. Its servers[] carry third-party names verbatim
      // and this door must not become a second public copy of them.
      const eb = await io.get(EB_PROBE);
      reading.source.push(EB_PROBE);
      let ebBlock: Record<string, unknown>;
      if (eb.ok && isObj(eb.json)) {
        const e = eb.json;
        const tp = isObj(e.third_party) ? e.third_party : {};
        const se = isObj(e.self) ? e.self : {};
        ebBlock = { path: EB_PROBE, as_of: str(e.as_of), axis: str(e.axis), n: num(e.n), n_unit: str(e.n_unit), n_note: str(e.n_note), signed: e.signed ?? null, third_party_counts: tp.counts ?? null, self_counts: se.counts ?? null, honesty: str(e.honesty), names: "withheld — counts only on this door; the artifact itself serves them" };
      } else {
        ebBlock = { path: EB_PROBE, unreadable: eb.ok ? "not an object" : eb.reason };
        reading.unmeasured.push(eb.ok ? `${EB_PROBE} not an object` : eb.reason);
      }
      reading.rows = { self_listings: { ...j }, effect_binding_server_probe: ebBlock };
      reading.rows_unit = "the self-listings artifact verbatim (already redacted per its redactions rule) plus the effect-binding server probe's counts";
    }
    return reading;
  },
};

const A2A_DIRS = "/interop/a2a-directories.json";
const a2a: PopulationEntry = {
  id: "a2a",
  title: "A2A agent registry population",
  population: "the agents enumerable without a credential from the public A2A registry frame, counted within that frame, with the estate's own A2A directory-listing state reported beside it",
  tags: ["population", "a2a", "agents", "census", "x402"],
  read: async (io, full) => {
    const unit = "distinct agents in the a2aregistry-org frame (one frame; not a global count)";
    const [pop, dirs] = await Promise.all([io.get(AGENT_POP), io.get(A2A_DIRS)]);
    if (!pop.ok) return unread([AGENT_POP, A2A_DIRS], pop.reason, unit);
    const j = isObj(pop.json) ? pop.json : {};
    const frame = frameRow(arr(j.sources), "a2aregistry-org");
    const n = frame ? num(frame.distinct_keys) : null;
    if (n === null) return unread([AGENT_POP, A2A_DIRS], `${AGENT_POP} carries no a2aregistry-org frame with distinct_keys`, unit);
    const dJ = dirs.ok && isObj(dirs.json) ? dirs.json : null;
    const reading: Reading = {
      state: "INDEXED",
      n,
      n_unit: unit,
      as_of: str(j.as_of),
      source: [AGENT_POP, A2A_DIRS],
      reason: null,
      unmeasured: [
        "per-agent rows: the census artifact publishes frame counts, page hashes and overlap, not a row per agent",
        ...(dirs.ok ? [] : [dirs.reason]),
      ],
      head: {
        frame: frame,
        totals: isObj(j.totals) ? j.totals : null,
        on_the_figure_750000: str(j.on_the_figure_750000),
        what_this_is_not: j.what_this_is_not ?? null,
        our_listing_state: dJ ? { path: A2A_DIRS, as_of: str(dJ.as_of), directories: (arr(dJ.directories) || []).length, totals: dJ.totals ?? null } : { path: A2A_DIRS, unreadable: dirs.ok ? "not an object" : dirs.reason },
        identification: "an agent is counted because the registry returned it on an unauthenticated full walk; nothing is measured about the agent",
      },
    };
    if (full) {
      reading.rows = { agent_population: j, a2a_directories: dJ ?? { unreadable: dirs.ok ? "not an object" : dirs.reason } };
      reading.rows_unit = "the census artifact verbatim plus the estate's A2A directory-listing state verbatim";
    }
    return reading;
  },
};

const OTS_MANIFEST = "/interop/ots/manifest.json";
const otsProofs: PopulationEntry = {
  id: "ots-proofs",
  title: "OpenTimestamps proof manifest",
  population: "one row per published .ots proof of an estate artifact, with the state its bytes were read into (Bitcoin-attested, calendar-pending, subject absent) on the manifest's last rebuild",
  tags: ["population", "ots", "proofs", "anchoring", "x402"],
  read: async (io, full) => {
    const unit = "published .ots proofs that parse as proofs";
    const got = await io.get(OTS_MANIFEST);
    if (!got.ok) return unread([OTS_MANIFEST], got.reason, unit);
    const j = isObj(got.json) ? got.json : {};
    const proofs = arr(j.proofs);
    if (!proofs) return unread([OTS_MANIFEST], `${OTS_MANIFEST} carries no proofs[]`, unit);
    const byState: Record<string, number> = {};
    let subjectAbsent = 0;
    for (const p of proofs) {
      if (!isObj(p)) continue;
      const s = String(p.state ?? "unknown");
      byState[s] = (byState[s] || 0) + 1;
      if (p.subject_present === false) subjectAbsent += 1;
    }
    const declared = isObj(j.counts) ? j.counts : null;
    const declaredProofs = declared ? num(declared.proofs) : null;
    const agree = declaredProofs === null || declaredProofs === proofs.length;
    const reading: Reading = {
      state: agree ? "MEASURED" : "UNCHECKABLE",
      n: proofs.length,
      n_unit: unit,
      as_of: str(j.as_of),
      source: [OTS_MANIFEST],
      reason: agree ? null : `the manifest says counts.proofs ${declaredProofs} but carries ${proofs.length} proof rows`,
      unmeasured: [],
      head: {
        schema: str(j.schema),
        by_state_from_rows: byState,
        subject_absent_from_rows: subjectAbsent,
        declared_counts: declared,
        bitcoin_attested_means: str(j.bitcoin_attested_means),
        pending_is_not_anchored: str(j.pending_is_not_anchored),
        subject_absent_means: str(j.subject_absent_means),
        how_this_was_built: str(j.how_this_was_built),
        identification: "a row is a .ots file under the scanned dirs that parsed as an OpenTimestamps proof; its state is read from its bytes (Bitcoin attestation present or only calendar-pending). A pending proof is not anchored.",
      },
    };
    if (full) {
      reading.rows = { dirs_scanned: j.dirs_scanned ?? null, supersedes: j.supersedes ?? null, proofs };
      reading.rows_unit = "proof rows verbatim (file, subject, state, sha256 of the proof bytes, subject_present)";
    }
    return reading;
  },
};

const LAYER0 = "/interop/layer0-ceremony-2026-09-03.json";
const layer0: PopulationEntry = {
  id: "layer0",
  title: "Layer-0 machine-surface ceremony",
  population: "one row per protocol rail and per probe of the estate's own machine surface, with the HTTP status each returned at the ceremony's as_of, and the state of the ceremony artifact's own .ots proof",
  tags: ["population", "layer0", "rails", "ceremony", "x402"],
  read: async (io, full) => {
    const unit = "live probes of the estate's machine surface in the ceremony";
    const [got, ots] = await Promise.all([io.get(LAYER0), io.get(OTS_MANIFEST)]);
    if (!got.ok) return unread([LAYER0, OTS_MANIFEST], got.reason, unit);
    const j = isObj(got.json) ? got.json : {};
    const probes = arr(j.probes);
    const rails = arr(j.rails);
    if (!probes) return unread([LAYER0, OTS_MANIFEST], `${LAYER0} carries no probes[]`, unit);
    const byStatus: Record<string, number> = {};
    for (const p of probes) {
      const s = isObj(p) ? String(p.http ?? p.status ?? "unknown") : "unknown";
      byStatus[s] = (byStatus[s] || 0) + 1;
    }
    let otsRow: Record<string, unknown> = { path: OTS_MANIFEST, state: "UNMEASURED", reason: ots.ok ? "no manifest row for this artifact" : ots.reason };
    if (ots.ok && isObj(ots.json)) {
      const row = (arr(ots.json.proofs) || []).find((p) => isObj(p) && p.subject === LAYER0);
      if (isObj(row)) otsRow = { path: OTS_MANIFEST, manifest_as_of: str(ots.json.as_of), proof: str(row.path), state: str(row.state), subject_present: row.subject_present ?? null, sha256_of_proof: str(row.sha256_of_proof) };
    }
    const declaredRails = num(j.rails_total);
    const railsAgree = declaredRails === null || rails === null || declaredRails === rails.length;
    const reading: Reading = {
      state: railsAgree ? "MEASURED" : "UNCHECKABLE",
      n: probes.length,
      n_unit: unit,
      as_of: str(j.as_of),
      source: [LAYER0, OTS_MANIFEST],
      reason: railsAgree ? null : `the ceremony says rails_total ${declaredRails} but carries ${rails!.length} rails`,
      unmeasured: [
        ...(otsRow.state === "UNMEASURED" ? [String(otsRow.reason)] : []),
        "reliability over time: this artifact is one dated ceremony, not a series; the hourly reliability slice is not published in this repository",
      ],
      head: {
        schema: str(j.schema),
        kind: str(j.kind),
        rails: rails ? rails.length : null,
        rails_serving: num(j.rails_serving),
        rails_total: declaredRails,
        probes_by_http_status: byStatus,
        digest_covers: str(j.digest_covers),
        sha256: str(j.sha256),
        what_this_does_not_claim: j.what_this_does_not_claim ?? null,
        ots: otsRow,
        identification: "a probe is one HTTP request the ceremony made to a named surface of this estate at as_of, recorded with its status; a rail is a protocol surface the ceremony names. Self-attestation: the estate probing itself.",
      },
    };
    if (full) {
      reading.rows = { ceremony: j };
      reading.rows_unit = "the ceremony artifact verbatim (probes[], rails[], surface, machine, witness, seal)";
    }
    return reading;
  },
};

const corrections: PopulationEntry = {
  id: "corrections",
  title: "Corrections ledger, full history",
  population: "one row per published correction in the estate's own ledger — what was wrong, how it was caught, the fix, dated — the same source object the free GET /api/corrections serves",
  tags: ["population", "corrections", "ledger", "x402"],
  read: async (_io, full) => {
    const unit = "correction entries in the source-maintained ledger";
    const entries = Array.isArray((LEDGER as { corrections?: unknown }).corrections) ? ((LEDGER as { corrections: unknown[] }).corrections) : null;
    if (!entries) return unread(["functions/api/corrections.ts#LEDGER"], "LEDGER.corrections is not an array", unit);
    const dates = entries.map((e) => (isObj(e) ? str(e.date) : null)).filter((d): d is string => !!d).sort();
    const reachedPublic = entries.filter((e) => isObj(e) && e.reached_the_public === true).length;
    const withDetected = entries.filter((e) => isObj(e) && typeof e.detected_at === "string").length;
    const reading: Reading = {
      state: "INDEXED",
      n: entries.length,
      n_unit: unit,
      as_of: dates.length ? dates[dates.length - 1] : null,
      source: ["functions/api/corrections.ts#LEDGER", "/api/corrections"],
      reason: null,
      unmeasured: [
        "append-only storage proof: none is claimed by the ledger",
        `correction latency: computable only for the ${withDetected} entries carrying detected_at; never inferred from prose`,
      ],
      head: {
        schema: str((LEDGER as { schema?: unknown }).schema),
        policy: str((LEDGER as { policy?: unknown }).policy),
        license: str((LEDGER as { license?: unknown }).license),
        first_date: dates[0] ?? null,
        last_date: dates.length ? dates[dates.length - 1] : null,
        reached_the_public_true: reachedPublic,
        entries_with_detected_at: withDetected,
        free_endpoint: "/api/corrections serves the whole ledger free and stays free; this door meters the assembled full-history slice with per-entry content digests",
        identification: "an entry is a fact about the estate's own history, never a claim about anyone else; ids are the ledger's own",
      },
    };
    if (full) {
      const enc = new TextEncoder();
      const rows = await Promise.all(
        entries.map(async (e) => {
          const canon = JSON.stringify(e, Object.keys(isObj(e) ? e : {}).sort());
          return { ...(isObj(e) ? e : { value: e }), entry_sha256: await sha256HexOf(enc.encode(canon)) };
        }),
      );
      reading.rows = { entries: rows };
      reading.rows_unit = "every ledger entry verbatim, each with entry_sha256 over its sorted-key JSON (computed at request time)";
    }
    return reading;
  },
};

// Newest last. A superseding registry is a NEW file: the prior bytes are never edited, stay
// served at their own URL and stay covered by their own .ots, so both rows are read and the
// `supersedes` chain is reported from the bytes rather than asserted here.
const CLAIM_REGISTER = "/spec/claim-maintenance/register.json";
/** Bounded same-site registry discovery; never fetch arbitrary URLs from registry content. */
export function registryPathsFromIndex(value: unknown): string[] {
  if (!isObj(value) || value.schema !== "csoai.claim-maintenance.register/0.1" || !Array.isArray(value.registries) || value.registries.length === 0 || value.registries.length > 100)
    throw new Error("The generated claim register is absent, malformed, empty or over its budget");
  const paths = new Set<string>();
  for (const item of value.registries) {
    if (!isObj(item) || typeof item.url !== "string") throw new Error("Registry URL is missing");
    if (item.schema !== undefined && !["csoai.claim-registry/0.1", "csoai.claim-registry/0.2", "csoai.claim-registry/0.3"].includes(String(item.schema))) throw new Error("Unsupported registry schema");
    const u = new URL(item.url, "https://councilof.ai");
    if (u.origin !== "https://councilof.ai" || u.username || u.password || u.search || u.hash || u.pathname.length > 220 || !/^\/claims\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(u.pathname))
      throw new Error("Registry URL is outside the public claim-registry scope");
    paths.add(u.pathname);
  }
  return [...paths].sort();
}
const claimWatch: PopulationEntry = {
  id: "claim-watch",
  title: "Claim-maintenance registries",
  population: "one row per published claim registry (a vendor's public claims captured, hashed, source-cited, each with a measurement plan), with the file's digest, its digest-reproducibility and its .ots state read from bytes",
  tags: ["population", "claims", "watch", "registry", "x402"],
  read: async (io, full) => {
    const unit = "claims captured across the published registries";
    const rows: Record<string, unknown>[] = [];
    const source: string[] = [];
    const unmeasured: string[] = [];
    const registries: Record<string, unknown>[] = [];
    let latest: string | null = null;
    const enc = new TextEncoder();
    const catalogue = await io.get(CLAIM_REGISTER);
    if (!catalogue.ok) return unread([CLAIM_REGISTER], catalogue.reason, unit);
    let registryPaths: string[];
    try { registryPaths = registryPathsFromIndex(catalogue.json); }
    catch (e) { return unread([CLAIM_REGISTER], (e as Error).message, unit); }
    source.push(CLAIM_REGISTER);
    for (const path of registryPaths) {
      source.push(path);
      const got = await io.get(path);
      if (!got.ok) { unmeasured.push(got.reason); continue; }
      const j = isObj(got.json) ? got.json : {};
      const fileSha = await sha256HexOf(enc.encode(got.text));
      const subjects = isObj(j.subjects) ? j.subjects : {};
      let claims = 0;
      const states: Record<string, number> = {};
      const perSubject: Record<string, number> = {};
      const flatClaims = j.schema === "csoai.claim-registry/0.3" ? arr(j.claims) : null;
      if (flatClaims) {
        for (const claim of flatClaims) {
          claims += 1;
          const item = isObj(claim) ? claim : {};
          const subject = isObj(item.subject) ? item.subject : {};
          const identity = str(subject.identifier) || str(subject.name) || "unknown-subject";
          perSubject[identity] = (perSubject[identity] || 0) + 1;
          const state = String(item.state ?? "unknown");
          states[state] = (states[state] || 0) + 1;
        }
      } else {
        for (const [name, s] of Object.entries(subjects)) {
          const list = isObj(s) ? arr(s.claims) : null;
          perSubject[name] = list ? list.length : 0;
          for (const c of list || []) {
            claims += 1;
            const st = isObj(c) ? String(c.state ?? "unknown") : "unknown";
            states[st] = (states[st] || 0) + 1;
          }
        }
      }
      // registry_digest: derived, not typed. The file's own digest is the sha256 of Python
      // json.dumps(sort_keys=True, indent=1) [ensure_ascii default] over the file minus the field.
      const { registry_digest, ...rest } = j as Record<string, unknown> & { registry_digest?: unknown };
      const compactRule = j.schema === "csoai.claim-registry/0.3";
      let recomputed: string | null = null;
      try { recomputed = await sha256HexOf(enc.encode(compactRule ? claimRegistryCompact(rest) : pyDumpsSortedIndent1(rest))); }
      catch { /* Invalid declared encoding stays unreproduced; never change source bytes. */ }
      const reproducible = typeof registry_digest === "string" && registry_digest === recomputed;
      const otsPath = `${path}.ots`;
      const ots = await io.bytes(otsPath);
      source.push(otsPath);
      const otsRow = ots.ok
        ? { path: otsPath, state: otsStateFromBytes(ots.bytes), bytes: ots.bytes.byteLength, sha256: await sha256HexOf(ots.bytes) }
        : { path: otsPath, state: "UNMEASURED", reason: ots.reason };
      if (!ots.ok) unmeasured.push(ots.reason);
      const created = str(j.created_utc);
      if (created && (!latest || created > latest)) latest = created;
      const sup = isObj(j.supersedes) ? j.supersedes : null;
      const mrk = isObj(j.merkle) ? j.merkle : null;
      const row: Record<string, unknown> = {
        registry_id: str(j.registry_id),
        schema: str(j.schema),
        created_utc: created,
        supersedes: sup ? { registry_id: str(sup.registry_id), file: str(sup.file), sha256: str(sup.sha256) } : null,
        merkle: mrk ? { algorithm: str(mrk.algorithm), root: str(mrk.root), n_leaves: mrk.n_leaves ?? null } : null,
        file: path,
        file_sha256: fileSha,
        registry_digest: typeof registry_digest === "string" ? registry_digest : null,
        registry_digest_reproducible: reproducible,
        registry_digest_rule: compactRule
          ? "sha256 over compact sorted-key UTF-8 integer-only canonical JSON, omitting registry_digest; v0.3 rule, recomputed from served bytes"
          : "sha256 over Python sorted-indent-1 ASCII JSON omitting registry_digest; legacy rule, recomputed from served bytes",
        ...(reproducible ? {} : { registry_digest_recomputed: recomputed }),
        subjects: Object.keys(perSubject),
        claims_per_subject: perSubject,
        claims: claims,
        states,
        signature_state: str(j.signature_state),
        ots: otsRow,
        maintainer: str(j.maintainer),
        notes: str(j.notes),
      };
      registries.push(row);
      rows.push({ ...row, registry: j });
    }
    const n = registries.reduce((a, r) => a + (r.claims as number), 0);
    if (registries.length === 0) return unread(source, unmeasured.join("; ") || "no registry readable", unit, { unmeasured });
    // Counted from the served bytes, never typed here: a number in this file goes stale the day
    // a registry is republished, and the door would then be the last place anyone looked.
    const stateTotals: Record<string, number> = {};
    for (const r of registries) {
      for (const [k, v] of Object.entries((r.states as Record<string, number>) || {})) {
        stateTotals[k] = (stateTotals[k] || 0) + v;
      }
    }
    const superseded = new Set(
      registries.map((r) => (isObj(r.supersedes) ? str((r.supersedes as Record<string, unknown>).registry_id) : null))
        .filter((x): x is string => !!x),
    );
    const measured = stateTotals["CLAIM_MEASURED"] || 0;
    const stillCaptured = stateTotals["CLAIM_CAPTURED"] || 0;
    const notMeasured = (stateTotals["UNMEASURED"] || 0) + (stateTotals["UNCHECKABLE"] || 0);
    const reading: Reading = {
      state: "INDEXED",
      n,
      n_unit: unit,
      as_of: latest,
      source,
      reason: null,
      unmeasured: [
        ...unmeasured,
        `${measured} of ${n} claim rows across the published registries are CLAIM_MEASURED, ${stillCaptured} remain CLAIM_CAPTURED and ${notMeasured} are UNMEASURED or UNCHECKABLE — counted from the served bytes at request time, not typed here. A measured claim carries its method, window, denominator and sources. No claim of falsity is made about any entry.`,
      ],
      head: {
        registries,
        claim_states_across_registries: stateTotals,
        superseded_registry_ids: [...superseded],
        supersession_rule: "a superseding registry is a new file; the prior bytes are never edited and both remain served",
        identification: "a claim is a sentence captured verbatim from the vendor's public page or API at the registry's created_utc, typed by kind, with the plan by which it could be measured; the file bytes are served unchanged and never edited",
      },
    };
    if (full) {
      reading.rows = { registries: rows };
      reading.rows_unit = "each registry file parsed verbatim (the exact bytes are at `file`, sha256 in file_sha256) with its derived row";
    }
    return reading;
  },
};

export const POPULATIONS: readonly PopulationEntry[] = [stablecoins, swift, xrpl, x402Bazaar, mcpRegistry, a2a, otsProofs, layer0, corrections, claimWatch];
export const POPULATION_IDS: readonly string[] = POPULATIONS.map((p) => p.id);
export const findPopulation = (id: string): PopulationEntry | undefined => POPULATIONS.find((p) => p.id === id);

/** The preview shape: everything but the metered rows. */
export function toPreview(r: Reading): Omit<Reading, "rows" | "rows_unit"> {
  const { rows: _rows, rows_unit: _u, ...head } = r;
  return head;
}
