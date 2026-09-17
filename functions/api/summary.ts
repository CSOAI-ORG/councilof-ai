/**
 * GET /api/summary — one-shot media-briefing payload.
 *
 * Why this exists: journalists, partners, and regulators frequently ask
 * for the live numbers in a single fetch. They want:
 *
 *   - The current public truth (root.json card_count, board measured_axes)
 *   - The current substrate measurements (mcp_fleet, x402_fleet)
 *   - One canonical artifact per domain (no competing sources)
 *   - The CSOAI registered entity (so the copy can pass fact-checking)
 *
 * This endpoint is intentionally small — it is a one-call dossier, not a
 * dashboard. /api/state remains the truth floor; /api/observability
 * remains the freshness view; this is the human-friendly briefing payload
 * for journalists and partners who land here from the media pack or one
 * of the reply emails.
 *
 * Doctrine holds: every value is fetched at request time; no number is
 * typed; nothing here is computed; nothing here is guessed.
 */

type Env = { RUNPOD_WORKER_HEALTH_URL?: string; WORKER_STATE_KV?: KVNamespace };

async function fetchJson(path: string, base: string): Promise<unknown | null> {
  try {
    const r = await fetch(`${base}${path}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function fact(value: unknown | null, source: string, as_of: string | null = null, as_of_field: string = "as_of"): { value: unknown | null; source: string; as_of: string | null; as_of_field: string; state: string } {
  return {
    value,
    source,
    as_of,
    as_of_field,
    state: value === null || value === undefined ? "UNCHECKABLE" : "PROBED",
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const base = new URL(request.url).origin;

  const [root, board, mcp, x402, coverage] = await Promise.all([
    fetchJson("/root.json", base),
    fetchJson("/api/gspc", base),
    fetchJson("/interop/mcp-trust/latest.json", base),
    fetchJson("/interop/x402-trust/latest.json", base),
    fetchJson("/api/coverage-truth", base),
  ]);

  const rootObj = root as Record<string, unknown> | null;
  const boardObj = board as Record<string, unknown> | null;
  const mcpObj = mcp as Record<string, unknown> | null;
  const x402Obj = x402 as Record<string, unknown> | null;
  const coverageObj = coverage as Record<string, unknown> | null;

  const facts = {
    schema: "csoai.media-summary/0.1",
    title: "CSOAI measurement estate — one-shot briefing",
    as_of: new Date().toISOString(),
    contract: "Every value fetched at request time. None typed. No computation. Single fetch per source — same endpoints a journalist can curl themselves.",

    entity: {
      name: "CSOAI Ltd",
      jurisdiction: "United Kingdom",
      registration: "Companies House 16939677",
      site: "https://councilof.ai",
      president: "Nicholas Templeman",
      contact: "press@councilof.ai",
      aidisclosure: "Drafting assistance disclosed per CSOAI ethics: all publicity text authored with Claude (Anthropic). Numbers and URLs verified programmatically before publication.",
    },

    headline: {
      // NOT signed measurement cards. root.json's card_sha256 leaves are timestamp
      // notices over third-party bytes plus ledger-state records -- zero measurement
      // cards, and zero identifier overlap with the signed card index. Renamed so the
      // number cannot be read as "we have signed 305 measurements".
      public_root_leaves: fact(num(rootObj?.card_count), "/root.json", String(rootObj?.as_of ?? "")),
      // measured_axes MUST come from totals.measured_axes, never from parsing
      // totals.public_count. That string is "23 axis \u00b7 22 measured"; splitting on
      // the first space took 23 -- the SLOT count -- and published it as the MEASURED
      // count. The board's own count_grammar field exists to forbid exactly this, and
      // /api/summary was doing it while citing /api/gspc as the source.
      measured_axes: fact(
        num((boardObj as { totals?: { measured_axes?: number } } | undefined)?.totals?.measured_axes),
        "/api/gspc"
      ),
      declared_axes: fact(
        num((boardObj as { totals?: { axes?: number } } | undefined)?.totals?.axes),
        "/api/gspc"
      ),
      unmeasured_axes: fact(
        num((boardObj as { totals?: { unmeasured_axes?: number } } | undefined)?.totals?.unmeasured_axes),
        "/api/gspc"
      ),
      mcp_servers_probed: fact(num((mcpObj as { counts?: { total?: number } })?.counts?.total), "/interop/mcp-trust/latest.json", String(mcpObj?.as_of ?? "")),
      mcp_auth_challenged: fact(num((mcpObj as { counts?: { auth_challenged_401_403?: number } })?.counts?.auth_challenged_401_403), "/interop/mcp-trust/latest.json", String(mcpObj?.as_of ?? "")),
      x402_payment_doors: fact(num((x402Obj as { counts?: { total?: number } })?.counts?.total), "/interop/x402-trust/latest.json", String(x402Obj?.as_of ?? "")),
    },

    canonical_artifacts: {
      board: "https://councilof.ai/api/gspc",
      root: "https://councilof.ai/root.json",
      mcp_trust: "https://councilof.ai/interop/mcp-trust/latest.json",
      x402_trust: "https://councilof.ai/interop/x402-trust/latest.json",
      corrections_ledger: "https://councilof.ai/refutation-ledger",
      verification_cli: "python3 tools/verify/csoai_verify.py <card-url>",
      free_verify_endpoint: "https://councilof.ai/gspc-verify",
      coverage_truth: "https://councilof.ai/api/coverage-truth",
      distribution_ledger: "https://councilof.ai/api/distribution-ledger",
      observability: "https://councilof.ai/api/observability",
      state_truth: "https://councilof.ai/api/state",
    },

    doctrine: {
      certification: "Never. CSOAI measures, never certifies.",
      grades: "Never sold.",
      verification: "Free, loginless, public key pinned at did:web:csoai.org#board-attestation-1.",
      corrections: "Append-only. First entry is our own error. https://councilof.ai/refutation-ledger",
    },

    contact_for_reply: {
      press: "press@councilof.ai",
      disputes: "disputes@councilof.ai",
      partnership: "nicholas@csoai.org",
      approval_review: "PRIORITY-GATED — owner approval required for outbound.",
    },
  };

  return new Response(JSON.stringify(facts, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
};
