import { afterEach, describe, expect, it, vi } from "vitest";
import { FEED_SOURCE, FEED_RAW_API, validEATCommonsForTest, freshnessForTest, projectForTest, onRequestGet, onRequestHead } from "./research-commons";

const CLOCK = Date.parse("2026-11-24T03:00:00Z");
const SHA = "a".repeat(64);
const HEAD = "b".repeat(40);
const DIGEST = "c".repeat(64);

function fixture(): Record<string, any> {
  const base = {
    schema: "csoai.auto-eat.research-commons/0.1",
    observed_at: "2026-11-24T02:58:55Z",
    publication_state: "RESEARCH_DISCOVERY_ONLY_UNSIGNED",
    catalog_scope: "FIXED_ALLOWLIST_SOURCE_METADATA_ONLY",
    registry_sha256: SHA,
    repositories: [
      {
        repository: "ai-openshell/openshell",
        source: "github_public_api",
        project_role: "sandbox_runtime",
        candidate_experiment: "DENY_ALLOW_POLICY_OBSERVATION",
        status: "SOURCE_METADATA_OBSERVED",
        head_sha: HEAD,
        repository_id: 1234,
        repository_metadata_canonical_sha256: DIGEST,
        commit_metadata_canonical_sha256: DIGEST,
        source_link: "https://github.com/ai-openshell/openshell",
        license_spdx_source_declared: "Apache-2.0",
        license_review: "REQUIRED_FOR_CODE_DATA_MODEL_WEIGHTS_AND_DEPENDENCIES",
        human_review: "UNASSIGNED",
        independent_verification: "NOT_PERFORMED",
        ras_measurement_permission: "NOT_GRANTED",
        secret_unwanted: "SECRETS_MUST_NOT_BE_EXPORTED"
      },
      {
        repository: "NVIDIA-NeMo/Guardrails",
        source: "github_public_api",
        project_role: "runtime_guardrail",
        candidate_experiment: "REFUSAL_FALSE_POSITIVE_CONTROLS",
        status: "SOURCE_UNCHECKABLE",
        reason: "SOURCE_HTTP_429",
        human_review: "UNASSIGNED",
        independent_verification: "NOT_PERFORMED",
        ras_measurement_permission: "NOT_GRANTED"
      }
    ],
    repositories_checked: 2,
    repositories_observed: 1,
    repositories_uncheckable: 1,
    crossref_topics: [
      {
        topic: "AI agent evaluation reproducibility",
        status: "SOURCE_METADATA_OBSERVED",
        source_response_canonical_sha256: DIGEST,
        candidate_selection: "TWO_PART_TITLE_KEYWORD_HEURISTIC_REVIEW_REQUIRED",
        recently_indexed_not_necessarily_newly_published: true,
        papers: [
          {
            doi: "10.1234/agentpaper",
            doi_url: "https://doi.org/10.1234/agentpaper",
            title_metadata: "Reproducible evaluation of AI agents",
            crossref_published_date_parts: [2024, 1, 1],
            full_text_copied: false,
            full_text_rights: "NOT_ESTABLISHED",
            reproducibility_status: "NOT_TESTED",
            human_review: "UNASSIGNED",
            title_relevance: "HEURISTIC_KEYWORD_MATCH_NOT_SCIENTIFIC_JUDGEMENT",
            raw_abstract: "COPYRIGHTED_TEXT_MUST_NOT_APPEAR"
          }
        ]
      },
      {
        topic: "AI safety benchmark calibration",
        status: "SOURCE_METADATA_OBSERVED",
        source_response_canonical_sha256: DIGEST,
        candidate_selection: "TWO_PART_TITLE_KEYWORD_HEURISTIC_REVIEW_REQUIRED",
        recently_indexed_not_necessarily_newly_published: true,
        papers: []
      },
      {
        topic: "autonomous agent runtime authorization",
        status: "SOURCE_UNCHECKABLE",
        reason: "SOURCE_HTTP_429",
        recently_indexed_not_necessarily_newly_published: true,
        papers: []
      }
    ],
    crossref_topics_checked: 3,
    crossref_topics_observed: 2,
    crossref_candidate_metadata_rows: 1,
    paper_full_text_copied: false,
    third_party_code_copied: false,
    model_weights_copied: false,
    incident_records_copied: false,
    machine_training_from_sources_performed: false,
    gspc_measurement_or_board_written: false,
    human_authority_issued: false,
    external_executor_invoked: false,
    receiving_party_effect_verified: false,
    ras_paid_request_executed: false,
  };
  return structuredClone(base);
}

function mockFeed(payload: unknown, status = 200) {
  const calls: Array<{ url: string; method?: string; redirect?: string }> = [];
  const stub = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, method: init?.method, redirect: init?.redirect });
    if (status !== 200) return new Response("upstream unavailable", { status });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", stub);
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("H.I.M. read-only AUTO-EAT research commons", () => {
  it("accepts a bounded valid source metadata feed without confusing it with measurement", () => {
    const data = fixture();
    expect(validEATCommonsForTest(data)).toBe(true);
    const out = projectForTest(data, "2026-11-24T03:00:00Z", DIGEST, CLOCK)!;
    expect(out.state).toBe("FREE_DISCOVERY_ONLY");
    expect(out.repositories).toHaveLength(2);
    expect(out.coverage).toMatchObject({ repositories_observed: 1, repositories_uncheckable: 1, crossref_topics_observed: 2 });
    expect(out.pathways).toMatchObject({
      read_measured_gspc_axes: "/api/research-plan",
      read_existing_watchdog_sources: "/api/watchdog-sources",
      request_attention: "EXISTING_RAS_HUMAN_SCOPED_INTAKE_ONLY_NOT_INVOKED",
      fee_for_this_read: 0,
      independent_human_approval_issued: false,
      model_or_tool_execution_performed: false,
      endorsement_or_certification: false,
    });
    const text = JSON.stringify(out);
    expect(text).not.toContain("SECRETS_MUST_NOT_BE_EXPORTED");
    expect(text).not.toContain("COPYRIGHTED_TEXT_MUST_NOT_APPEAR");
    expect(text).not.toContain("raw_abstract");
  });

  it("freshness labels clock skew, old data, and a fresh source separately", () => {
    expect(freshnessForTest("2026-11-24T02:58:55Z", CLOCK)).toBe("FRESH");
    expect(freshnessForTest("2026-11-21T02:58:55Z", CLOCK)).toBe("STALE");
    expect(freshnessForTest("2026-11-25T02:58:55Z", CLOCK)).toBe("CLOCK_SKEW");
  });

  it("rejects untrusted source claim that a service was paid, actioned or measured", () => {
    for (const key of [
      "paper_full_text_copied", "third_party_code_copied",
      "model_weights_copied", "incident_records_copied",
      "machine_training_from_sources_performed",
      "gspc_measurement_or_board_written", "human_authority_issued",
      "external_executor_invoked", "receiving_party_effect_verified",
      "ras_paid_request_executed"
    ]) {
      const d = fixture();
      d[key] = true;
      expect(validEATCommonsForTest(d), key).toBe(false);
    }
  });

  it("rejects forged independent review, human approval, or paid RAS permissions", () => {
    for (const [key, value] of [
      ["independent_verification", "VERIFIED_BY_OURSELVES"],
      ["human_review", "APPROVED"],
      ["ras_measurement_permission", "GRANTED"]
    ]) {
      const d = fixture();
      d.repositories[0][key] = value;
      expect(validEATCommonsForTest(d), key).toBe(false);
    }
  });

  it("rejects altered provider identity, SHA, licence, and project url", () => {
    for (const [key, value] of [
      ["repository", "../private"],
      ["head_sha", "not-a-real-sha"],
      ["license_review", "CLEAR_TO_TRAIN"],
      ["source_link", "https://evil.example/secret"],
      ["repository_metadata_canonical_sha256", "bad"]
    ]) {
      const d = fixture();
      d.repositories[0][key] = value;
      expect(validEATCommonsForTest(d), key).toBe(false);
    }
  });

  it("does not treat source-uncheckable as a valid commit or a licensing conclusion", () => {
    const d = fixture();
    d.repositories[1].head_sha = HEAD;
    expect(validEATCommonsForTest(d)).toBe(false);
    delete d.repositories[1].head_sha;
    expect(validEATCommonsForTest(d)).toBe(true);
  });

  it("refuses a malicious or hidden scholarly source payload", () => {
    for (const [key, value] of [
      ["doi_url", "javascript:alert(1)"],
      ["title_metadata", "<script>"],
      ["full_text_copied", true],
      ["full_text_rights", "GRANTED"],
      ["reproducibility_status", "REPRODUCED"]
    ]) {
      const d = fixture();
      d.crossref_topics[0].papers[0][key] = value;
      expect(validEATCommonsForTest(d), key).toBe(false);
    }
  });

  it("source observed count and paper count must match literal rows", () => {
    const d = fixture();
    d.repositories_observed = 2;
    expect(validEATCommonsForTest(d)).toBe(false);
    d.repositories_observed = 1;
    d.crossref_candidate_metadata_rows = 3;
    expect(validEATCommonsForTest(d)).toBe(false);
  });

  it("fetches only the fixed feed URL and projects the same-origin free endpoint", async () => {
    vi.useFakeTimers().setSystemTime(CLOCK);
    const calls = mockFeed(fixture());
    const req = new Request("https://councilof.ai/api/research-commons");
    const res = await onRequestGet({ request: req });
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(FEED_SOURCE);
    expect(calls[0].redirect).toBe("manual");
    const json = await res.json() as any;
    expect(json.state).toBe("FREE_DISCOVERY_ONLY");
    expect(json.source.source_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(json.source.signature_verification).toBe("NOT_PERFORMED");
    expect(json.pathways.fee_for_this_read).toBe(0);
  });

  it("does not follow arbitrary caller-provided URLs", async () => {
    const calls = mockFeed(fixture());
    const req = new Request("https://councilof.ai/api/research-commons?url=https://127.0.0.1/secret");
    const res = await onRequestGet({ request: req });
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("refuses upstream unavailability rather than inventing cached fresh records", async () => {
    const calls = mockFeed(null, 404);
    const res = await onRequestGet({ request: new Request("https://councilof.ai/api/research-commons") });
    expect(res.status).toBe(503);
    expect(calls).toHaveLength(1);
    expect((await res.json() as any).repositories).toEqual([]);
  });

  it("does not show stale public source as fresh", async () => {
    vi.useFakeTimers().setSystemTime(Date.parse("2026-12-01T03:00:00Z"));
    mockFeed(fixture());
    const res = await onRequestGet({ request: new Request("https://councilof.ai/api/research-commons") });
    expect(res.status).toBe(503);
    const json = await res.json() as any;
    expect(json.state).toBe("HELD_SOURCE_STALE");
    expect(json.repositories).toEqual([]);
  });

  it("refuses a malformed or fraudulent raw feed", async () => {
    const data = fixture();
    data.crossref_topics[0].papers[0].title_metadata = "<script>attack</script>";
    mockFeed(data);
    const res = await onRequestGet({ request: new Request("https://councilof.ai/api/research-commons") });
    expect(res.status).toBe(503);
    expect((await res.json() as any).state).toBe("UNCHECKABLE");
  });

  it("rejects a too-large public source body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x".repeat(90000), {
      headers: { "content-length": "90000" }
    })));
    const res = await onRequestGet({ request: new Request("https://councilof.ai/api/research-commons") });
    expect(res.status).toBe(503);
    expect((await res.json() as any).reason).toMatch(/OVERSIZE/);
  });

  it("HEAD is a read-only probe with no body and never produces payment", async () => {
    vi.useFakeTimers().setSystemTime(CLOCK);
    mockFeed(fixture());
    const res = await onRequestHead({
      request: new Request("https://councilof.ai/api/research-commons", {
        method: "HEAD",
        headers: { "x-payment": "must-be-ignored" },
      })
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
    expect(res.headers.get("payment-required")).toBeNull();
  });
  it("uses only the fixed raw API alternate after primary transport rejection", async () => {
    vi.useFakeTimers().setSystemTime(CLOCK);
    const calls: Array<{url: string; init: RequestInit}> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      calls.push({url, init});
      if (url === FEED_SOURCE) throw Error("transport unavailable");
      return new Response(JSON.stringify(fixture()));
    }));
    const r = await onRequestGet({request:new Request("https://councilof.ai/api/research-commons")});
    expect(r.status).toBe(200);
    expect(calls.map(x=>x.url)).toEqual([FEED_SOURCE, FEED_RAW_API]);
    expect(calls.every(x=>x.init.redirect==="manual")).toBe(true);
    expect(new Headers(calls[1].init.headers).get("accept")).toBe("application/vnd.github.raw+json");
    const data = await r.json() as any;
    expect(data.source.url).toBe(FEED_SOURCE);
    expect(data.source.retrieval_url).toBe(FEED_RAW_API);
    expect(data.source.signature_verification).toBe("NOT_PERFORMED");
  });

  it("holds both transport failures without a stale fallback", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {calls.push(url);throw Error("unavailable");}));
    const r = await onRequestGet({request:new Request("https://councilof.ai/api/research-commons")});
    expect(r.status).toBe(503);
    expect(calls).toEqual([FEED_SOURCE, FEED_RAW_API]);
    expect((await r.json() as any).reason).toBe("EAT_FEED_TRANSPORT_UNAVAILABLE");
  });

  it("does not try another transport after invalid JSON or a redirect response", async () => {
    for (const response of [new Response("{bad"),new Response(null,{status:302,headers:{location:"https://example.invalid"}})]) {
      const stub=vi.fn(async()=>response);
      vi.stubGlobal("fetch",stub);
      const r=await onRequestGet({request:new Request("https://councilof.ai/api/research-commons")});
      expect(r.status).toBe(503);
      expect(stub).toHaveBeenCalledTimes(1);
    }
  });

  it("bounds a chunked body before fully buffering it and does not retry oversize content", async () => {
    let pulls = 0; let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        controller.enqueue(new Uint8Array(16000));
        if (pulls === 12) controller.close();
      },
      cancel() { cancelled = true; },
    });
    const stub = vi.fn(async () => new Response(stream, {headers:{"content-length":"1"}}));
    vi.stubGlobal("fetch",stub);
    const r = await onRequestGet({request:new Request("https://councilof.ai/api/research-commons")});
    expect(r.status).toBe(503);
    expect((await r.json() as any).reason).toBe("EAT_FEED_OVERSIZE");
    expect(stub).toHaveBeenCalledTimes(1);
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThan(12);
  });

  it("returns from a stalled transport even if the transport ignores abort", async () => {
    vi.useFakeTimers().setSystemTime(CLOCK);
    const calls: string[]=[];
    vi.stubGlobal("fetch",vi.fn((url:string)=>{
      calls.push(url);
      return url===FEED_SOURCE ? new Promise<Response>(()=>{}) : Promise.resolve(new Response(JSON.stringify(fixture())));
    }));
    const task = onRequestGet({request:new Request("https://councilof.ai/api/research-commons")});
    await vi.advanceTimersByTimeAsync(4001);
    // Let pending native digest work settle; the alternate must already have started.
    expect(calls).toEqual([FEED_SOURCE,FEED_RAW_API]);
    expect((await task).status).toBe(200);
  });

  it("does not wait for a stalled body or cancellation promise", async () => {
    vi.useFakeTimers().setSystemTime(CLOCK);
    const calls: string[]=[];let cancelled=false;
    const stream=new ReadableStream<Uint8Array>({
      start(controller){controller.enqueue(new TextEncoder().encode("{"));},
      cancel(){cancelled=true;return new Promise<void>(()=>{});}
    });
    vi.stubGlobal("fetch",vi.fn(async(url:string)=>{
      calls.push(url);
      return url===FEED_SOURCE?new Response(stream):new Response(JSON.stringify(fixture()));
    }));
    const task=onRequestGet({request:new Request("https://councilof.ai/api/research-commons")});
    await vi.advanceTimersByTimeAsync(4001);
    expect(calls).toEqual([FEED_SOURCE,FEED_RAW_API]);
    expect(cancelled).toBe(true);
    expect((await task).status).toBe(200);
  });

  it("both stalled transports stop after the two bounded attempts", async () => {
    vi.useFakeTimers().setSystemTime(CLOCK);
    const calls:string[]=[];
    vi.stubGlobal("fetch",vi.fn((url:string)=>{calls.push(url);return new Promise<Response>(()=>{});}));
    const task=onRequestGet({request:new Request("https://councilof.ai/api/research-commons")});
    await vi.advanceTimersByTimeAsync(8001);
    const r=await task;
    expect(r.status).toBe(503);
    expect(calls).toEqual([FEED_SOURCE,FEED_RAW_API]);
    expect((await r.json() as any).reason).toBe("EAT_FEED_TRANSPORT_UNAVAILABLE");
  });

  it("a late primary response cannot replace the accepted alternate", async () => {
    vi.useFakeTimers().setSystemTime(CLOCK);
    let deliver: (r:Response)=>void=()=>{};
    let cancelled=false;
    const late=new Response(new ReadableStream<Uint8Array>({cancel(){cancelled=true;}}));
    vi.stubGlobal("fetch",vi.fn((url:string)=>url===FEED_SOURCE?new Promise<Response>(r=>{deliver=r;}):Promise.resolve(new Response(JSON.stringify(fixture())))));
    const task=onRequestGet({request:new Request("https://councilof.ai/api/research-commons")});
    await vi.advanceTimersByTimeAsync(4001);
    const accepted=await task;expect(accepted.status).toBe(200);
    expect((await accepted.json() as any).source.retrieval_url).toBe(FEED_RAW_API);
    deliver(late);await Promise.resolve();await Promise.resolve();
    expect(cancelled).toBe(true);
  });

});

// Boundary controls only: these constructed records are NOT empirical evidence.
describe("expanded source contract bounds", () => {
  it("accepts 25 repositories and seven topics, but refuses 26 or case aliases", () => {
    const d = fixture();
    const template = d.repositories[0];
    d.repositories = Array.from({length:25}, (_,i)=>({...template,repository:"example/repo"+i,source_link:"https://github.com/example/repo"+i,repository_id:i+1}));
    d.repositories_checked=25; d.repositories_observed=25; d.repositories_uncheckable=0;
    const t=d.crossref_topics[0];
    d.crossref_topics=Array.from({length:7}, (_,i)=>({...t,topic:"test topic "+i,papers:[]}));
    d.crossref_topics_checked=7; d.crossref_topics_observed=7; d.crossref_candidate_metadata_rows=0;
    expect(validEATCommonsForTest(d)).toBe(true);
    d.repositories[24]={...d.repositories[0],repository:"EXAMPLE/REPO0",source_link:"https://github.com/EXAMPLE/REPO0"};
    expect(validEATCommonsForTest(d)).toBe(false);
    d.repositories[24]={...template,repository:"example/repo24",source_link:"https://github.com/example/repo24",repository_id:25};
    d.repositories.push({...template,repository:"example/repo25",source_link:"https://github.com/example/repo25",repository_id:26});
    d.repositories_checked=26;d.repositories_observed=26;
    expect(validEATCommonsForTest(d)).toBe(false);
  });
});
