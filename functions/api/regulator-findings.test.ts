import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequestGet } from "./regulator-findings";

const CARD = "a".repeat(64);
const OTHER_CARD = "b".repeat(64);

const regulation = {
  penalty_tiers_eu_ai_act: {
    prohibited_practices: "statutory maximum A",
    most_obligations_incl_art50_and_gpai: "statutory maximum B",
  },
};

const signedIndex = {
  as_of: "2026-08-19T09:24:39.000Z",
  findings: [
    {
      model: "example/model@revision",
      axis: "gspc-governance",
      measurement: {
        accuracy: 0.42,
        card: CARD,
        card_url: `/signed/cards/${CARD}.json`,
        signed: true,
        alg: "Ed25519",
        pubkey: "public-key",
        measured_on: "2026-08-19T09:24:39.000Z",
      },
    },
    {
      model: "example/model@revision",
      axis: "gspc-safety",
      measurement: {
        accuracy: 0.73,
        card: OTHER_CARD,
        card_url: `/signed/cards/${OTHER_CARD}.json`,
        signed: true,
        alg: "Ed25519",
        pubkey: "public-key",
        measured_on: "2026-08-19T09:24:40.000Z",
      },
    },
  ],
};

function stubAssets(index: unknown = signedIndex) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      );
      calls.push(url.pathname);
      if (url.pathname === "/api/regulation") return Response.json(regulation);
      if (url.pathname === "/signed/findings_index.json") {
        return index === null
          ? new Response("unavailable", { status: 503 })
          : Response.json(index);
      }
      // A regression to the old implementation would try to borrow fleet-leader scores here.
      if (url.pathname === "/api/gspc") {
        return Response.json({
          axes: [
            { axis: "governance", accuracy: 0.99, leader: "someone-else" },
          ],
        });
      }
      return new Response("not found", { status: 404 });
    }),
  );
  return calls;
}

async function get(path: string) {
  const response = await onRequestGet({
    request: new Request(`https://example.test${path}`),
  });
  return { response, body: await response.json() };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/regulator-findings evidence boundary", () => {
  it("never attaches a fleet-leader score to an arbitrary deployment description", async () => {
    const calls = stubAssets();
    const { response, body } = await get(
      "/api/regulator-findings?deployment=high-risk%20resume-screening",
    );

    expect(response.status).toBe(200);
    expect(calls).toEqual(
      expect.arrayContaining([
        "/api/regulation",
        "/signed/findings_index.json",
      ]),
    );
    expect(calls).not.toContain("/api/gspc");
    expect(body.source_evidence_state).toBe("UNMEASURED");
    expect(body.derived_findings_state).toBe("UNMEASURED");
    expect(body.deployment_binding_state).toBe("UNMEASURED");
    expect(body.writes_board).toBe(false);
    expect(body.limitations.join(" ")).toMatch(
      /deployment.*descriptive context/i,
    );
    expect(body.limitations.join(" ")).toMatch(/No exact `subject` or `card`/);
    expect(
      body.findings.every((finding: any) => finding.measured === null),
    ).toBe(true);
    expect(
      body.findings.every((finding: any) => finding.grade === "UNMEASURED"),
    ).toBe(true);
    expect(
      body.findings.every((finding: any) => finding.writes_board === false),
    ).toBe(true);
    expect(JSON.stringify(body)).not.toContain('"leader"');
    expect(JSON.stringify(body)).not.toContain("0.99");
  });

  it("exposes a score only for an exact subject with a matching signed card", async () => {
    stubAssets();
    const { body } = await get(
      "/api/regulator-findings?deployment=screening%20service&subject=example%2Fmodel%40revision",
    );

    expect(body.source_evidence_state).toBe("SIGNED");
    expect(body.derived_findings_state).toBe("CANDIDATE_FINDING");
    expect(body.deployment_binding_state).toBe("UNCHECKABLE");
    expect(body.measured_subject).toEqual({
      kind: "model",
      id: "example/model@revision",
      digest: null,
    });
    expect(body.evidence_source.matched_signed_cards).toBe(2);

    const governance = body.findings.find(
      (finding: any) => finding.axis === "governance",
    );
    expect(governance).toMatchObject({
      measured: 0.42,
      n: null,
      grade: "CANDIDATE_FINDING",
      measurement_state: "SIGNED",
      finding_state: "CANDIDATE_FINDING",
      writes_board: false,
      no_fine_asserted_owed: true,
    });
    expect(governance.evidence_ref).toMatchObject({
      card: CARD,
      card_url: `/signed/cards/${CARD}.json`,
      instrument_version: null,
    });

    const provenance = body.findings.find(
      (finding: any) => finding.axis === "provenance",
    );
    expect(provenance.measured).toBeNull();
    expect(provenance.measurement_state).toBe("UNMEASURED");
  });

  it("fails closed for an unsigned row, a malformed card reference, or a non-matching subject", async () => {
    stubAssets({
      as_of: signedIndex.as_of,
      findings: [
        {
          ...signedIndex.findings[0],
          measurement: {
            ...signedIndex.findings[0].measurement,
            signed: false,
          },
        },
        {
          ...signedIndex.findings[1],
          measurement: {
            ...signedIndex.findings[1].measurement,
            card_url: "/signed/cards/not-the-card.json",
          },
        },
      ],
    });
    const { body } = await get(
      "/api/regulator-findings?subject=example%2Fmodel%40revision",
    );

    expect(body.source_evidence_state).toBe("UNMEASURED");
    expect(body.evidence_source.matched_signed_cards).toBe(0);
    expect(
      body.findings.every((finding: any) => finding.measured === null),
    ).toBe(true);
    expect(body.limitations.join(" ")).toMatch(
      /No signed measurement card exactly matched/,
    );
  });

  it("does not use a case-insensitive or fuzzy subject join", async () => {
    stubAssets();
    const { body } = await get(
      "/api/regulator-findings?subject=Example%2FModel%40Revision",
    );

    expect(body.source_evidence_state).toBe("UNMEASURED");
    expect(body.measured_subject).toBeNull();
    expect(
      body.findings.every((finding: any) => finding.measured === null),
    ).toBe(true);
  });

  it("does not call a crosswalk candidate when matched signed cards map to no usable axis", async () => {
    stubAssets({
      as_of: signedIndex.as_of,
      findings: [
        {
          ...signedIndex.findings[0],
          axis: "care-refusal-help",
        },
      ],
    });
    const { body } = await get(
      "/api/regulator-findings?subject=example%2Fmodel%40revision",
    );

    expect(body.source_evidence_state).toBe("SIGNED");
    expect(body.derived_findings_state).toBe("UNMEASURED");
    expect(body.evidence_source.matched_signed_cards).toBe(1);
    expect(
      body.findings.every(
        (finding: any) => finding.finding_state === "UNMEASURED",
      ),
    ).toBe(true);
    expect(body.limitations.join(" ")).toMatch(/none resolved.*axis/i);
  });

  it("does not manufacture an article-level worst score from signed axis cards", async () => {
    stubAssets();
    const { body } = await get(
      "/api/regulator-findings?by=article&subject=example%2Fmodel%40revision&deployment=screening",
    );

    const articleSix = body.articles.find(
      (article: any) => article.article === "Article 6",
    );
    expect(articleSix.worst_measured).toBeNull();
    expect(articleSix.aggregation_state).toBe("UNMEASURED");
    expect(articleSix.grade).toBe("CANDIDATE_FINDING");
    expect(articleSix.axis_evidence.governance).toMatchObject({
      measurement_state: "SIGNED",
      measured: 0.42,
    });
    expect(articleSix.axis_evidence.conformance).toMatchObject({
      measurement_state: "UNMEASURED",
      measured: null,
    });
    expect(articleSix.legal_review_required).toBe(true);
    expect(articleSix.writes_board).toBe(false);
    expect(articleSix.note).toMatch(/no signed article-level procedure/i);
  });

  it("keeps every row UNMEASURED when the signed index is unavailable", async () => {
    stubAssets(null);
    const { body } = await get(`/api/regulator-findings?card=${CARD}`);

    expect(body.source_evidence_state).toBe("UNMEASURED");
    expect(
      body.findings.every((finding: any) => finding.measured === null),
    ).toBe(true);
    expect(body.limitations[0]).toMatch(/index was unavailable/i);
    expect(body.writes_board).toBe(false);
  });
});
