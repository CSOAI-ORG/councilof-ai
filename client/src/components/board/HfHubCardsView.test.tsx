import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import HfHubCardsView, {
  MAX_HF_HUB_CARDS_BYTES,
  parseHfHubCards,
  readHfHubCardsOnce,
  safeHfHubCardUrl,
} from "./HfHubCardsView";

const allowed = new Set(["affect", "safety"]);
const sha = "a".repeat(64);

function sourcePayload() {
  return {
    schema: "csoai.hub-cards/0.1",
    as_of: "2026-09-05T03:39:26.375Z",
    source: "huggingface.co/datasets/csoai/gspc-hub-cards",
    source_revision: "1".repeat(40),
    source_last_modified: "2026-09-04T06:05:59.000Z",
    population: "third-party models on the Hub — NOT the CSOAI fleet",
    counts: { indexes_read: 4, indexes_total: 4, malformed_rows: 0 },
    indexes: ["INDEX.jsonl", "INDEX-safety.jsonl", "INDEX-art5-affect.jsonl", "INDEX-empty3.jsonl"].map((index) => ({
      index,
      state: "READ",
      http_status: 200,
      rows: 1,
      malformed_rows: 0,
    })),
    cells: [
      {
        model: "Qwen/Qwen3-8B",
        axis: "affect",
        status: "MEASURED",
        accuracy: 0.7333,
        n: 30,
        card_sha256: sha,
        card_url:
          "https://councilof.ai/interop/mill-cards-signed/signed-affect-aaaaaaaaaaaa.json",
        signed: true,
        alg: "Ed25519",
        did: "did:web:csoai.org#board-attestation-1",
        verdict: "VALID",
        indexed: "2026-09-03T13:10:27Z",
        created: null,
        name_published: true,
        unmeasured: [],
        index: "INDEX.jsonl",
      },
      {
        model: "Qwen/Qwen3-8B",
        axis: "affect",
        status: "UNMEASURED",
        accuracy: 0.1,
        n: 30,
        card_sha256: "b".repeat(64),
        card_url:
          "https://councilof.ai/interop/mill-cards-signed/signed-affect-bbbbbbbbbbbb.json",
        signed: true,
        alg: "Ed25519",
        verdict: "VALID",
        created: "2026-09-01T14:14:24Z",
        name_published: true,
        unmeasured: ["signed-pending-verify"],
        index: "INDEX-empty3.jsonl",
      },
    ],
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("Hugging Face Hub card view", () => {
  it("keeps mixed-state publications separate and preserves source dates", () => {
    const parsed = parseHfHubCards(sourcePayload(), allowed);
    expect(parsed.cells).toHaveLength(2);
    expect(parsed.cells.map((cell) => cell.status)).toEqual([
      "MEASURED",
      "UNMEASURED",
    ]);
    expect(parsed.cells[0].indexed).toBe("2026-09-03T13:10:27Z");
    expect(parsed.cells[1].created).toBe("2026-09-01T14:14:24Z");
    expect(parsed.sourceRevision).toBe("1".repeat(40));
    expect(parsed.indexes).toHaveLength(4);
    expect(parsed.droppedRows).toBe(0);
  });

  it("withholds malformed, old-taxonomy, and unsafe-link rows", () => {
    const payload = sourcePayload();
    payload.cells.push(
      {
        ...payload.cells[0],
        model: "old row",
        axis: "gov",
        card_sha256: "c".repeat(64),
      },
      {
        ...payload.cells[0],
        model: "unsafe row",
        card_sha256: "d".repeat(64),
        card_url: "https://attacker.example/card.json",
      },
    );
    const parsed = parseHfHubCards(payload, allowed);
    expect(parsed.cells).toHaveLength(2);
    expect(parsed.droppedRows).toBe(2);
    expect(safeHfHubCardUrl("javascript:alert(1)")).toBeNull();
    expect(
      safeHfHubCardUrl(
        "https://councilof.ai/interop/mill-cards-signed/signed-affect-aaaaaaaaaaaa.json",
      ),
    ).not.toBeNull();
  });

  it("renders source-reported states, never quotes an unmeasured figure, and labels the population boundary", () => {
    const data = parseHfHubCards(sourcePayload(), allowed);
    const html = renderToStaticMarkup(
      <HfHubCardsView
        data={data}
        error={null}
        loading={false}
        observedAt="2026-09-05T03:50:00.000Z"
        onRetry={() => {}}
      />,
    );
    expect(html).toContain("Third-party Hub mill results");
    expect(html).toContain("SOURCE-REPORTED MEASURED");
    expect(html).toContain("SOURCE-REPORTED UNMEASURED");
    expect(html).toContain("73.3%");
    expect(html).toContain("not quotable");
    expect(html).not.toContain("10.0%");
    expect(html).toContain("Rows are not reverified in this browser view");
    expect(html).toContain("Multiple publications for one model-axis stay separate");
  });

  it("marks partial index coverage and withheld source rows explicitly", () => {
    const payload = sourcePayload();
    payload.counts.indexes_read = 3;
    payload.indexes[3].state = "HTTP_ERROR";
    payload.indexes[3].http_status = 502;
    payload.indexes[3].rows = 0;
    payload.cells.push({
      ...payload.cells[0],
      model: "unsafe row",
      card_sha256: "z".repeat(64),
    });
    const data = parseHfHubCards(payload, allowed);
    const html = renderToStaticMarkup(
      <HfHubCardsView
        data={data}
        error={null}
        loading={false}
        observedAt={null}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain("PARTIAL READ");
    expect(html).toContain("1 malformed or out-of-contract rows were withheld");
    expect(html).toContain("absence is not a finding");
    expect(html).toContain("INDEX-empty3.jsonl · HTTP_ERROR");
  });

  it("does not quote low-n or withheld-name figures and treats 0/0 indexes as partial", () => {
    const payload = sourcePayload();
    payload.counts.indexes_read = 0;
    payload.counts.indexes_total = 0;
    payload.indexes = [];
    payload.cells = [
      {
        ...payload.cells[0],
        n: 1,
        name_published: false,
      },
    ];
    const data = parseHfHubCards(payload, allowed);
    const html = renderToStaticMarkup(
      <HfHubCardsView
        data={data}
        error={null}
        loading={false}
        observedAt={null}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain("model name withheld");
    expect(html).toContain("not quotable");
    expect(html).not.toContain("73.3%");
    expect(html).toContain("PARTIAL READ");
  });

  it("keeps the deployed legacy mirror readable without inventing a source revision", () => {
    const payload = sourcePayload();
    delete (payload as Partial<typeof payload>).source_revision;
    delete (payload as Partial<typeof payload>).source_last_modified;
    delete (payload as Partial<typeof payload>).indexes;
    const data = parseHfHubCards(payload, allowed);
    const html = renderToStaticMarkup(
      <HfHubCardsView
        data={data}
        error={null}
        loading={false}
        observedAt={null}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain("Indexes with rows (legacy mirror)");
    expect(html).toContain("HF revision not published by this mirror version");
    expect(html).toContain("73.3%");
  });

  it("performs one bounded fetch and rejects HTTP, oversized, and malformed bodies", async () => {
    const okFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sourcePayload()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", okFetch);
    await expect(readHfHubCardsOnce(allowed)).resolves.toMatchObject({
      cells: expect.any(Array),
    });
    expect(okFetch).toHaveBeenCalledTimes(1);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })),
    );
    await expect(readHfHubCardsOnce(allowed)).rejects.toThrow("HTTP 503");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("{}", {
          status: 200,
          headers: { "content-length": String(MAX_HF_HUB_CARDS_BYTES + 1) },
        }),
      ),
    );
    await expect(readHfHubCardsOnce(allowed)).rejects.toThrow("exceeds");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not json", { status: 200 })),
    );
    await expect(readHfHubCardsOnce(allowed)).rejects.toThrow("not valid JSON");
  });
});
