import {afterEach,describe,expect,it,vi} from "vitest";
import {onRequestGet} from "./evidence-bundle";

const ORIGIN="https://councilof.ai";
const run=(query:string)=>onRequestGet({request:new Request(ORIGIN+"/api/evidence-bundle?"+query),env:{}} as never);
const corpus=(withMissing=false)=>{
  const cards=Object.fromEntries(Array.from({length:54},(_,i)=>{
    const sha=(i+1).toString(16).padStart(64,"0");
    return [sha,{card:{sha256:sha,sig_ed25519:"TEST_ONLY_SIGNATURE",
      subject:"model provider fixture",surface:"gpai.model",tags:["gpai"],
      as_of:withMissing&&i===42?undefined:i===53?"2026-11-22T10:00:00Z":"2026-11-01T00:00:00Z"},proof:[]}];
  }));
  return {as_of:"2026-11-22T23:00:00Z",merkle_root:"0".repeat(64),cards};
};

afterEach(()=>vi.unstubAllGlobals());

describe("free evidence-bundle full-set timestamps, not SHA-first preview dates",()=>{
  it("returns exact latest source-declared card from 54 selected while transmitting only 40",async()=>{
    const reads=vi.fn(async()=>Response.json(corpus()));
    vi.stubGlobal("fetch",reads);
    const res=await run("obligation=article-53&preview=true");
    expect(res.status).toBe(200);
    const d=await res.json();
    expect(d.relevant_signed_cards).toBe(54);
    expect(d.cards.length).toBe(40);
    expect(d.cards.every((x:any)=>x.as_of==="2026-11-01T00:00:00Z")).toBe(true);
    expect(d.freshness).toEqual({
      scope:"ALL_RELEVANT_SIGNED_CARDS",
      source_state:"SOURCE_DECLARED_NOT_INDEPENDENTLY_VERIFIED",
      relevant_card_count:54,
      returned_card_count:40,
      card_list_truncated:true,
      dated_card_count:54,
      timing_coverage:"COMPLETE",
      newest_relevant_card_as_of:"2026-11-22T10:00:00Z",
      newest_relevant_card_sha256:(54).toString(16).padStart(64,"0"),
    });
    expect(reads).toHaveBeenCalledOnce();
  });

  it("never reports complete timestamp coverage for an undated selected card",async()=>{
    vi.stubGlobal("fetch",vi.fn(async()=>Response.json(corpus(true))));
    const res=await run("obligation=article-53");
    const d=await res.json();
    expect(d.freshness).toMatchObject({
      relevant_card_count:54,dated_card_count:53,timing_coverage:"PARTIAL",
      newest_relevant_card_as_of:"2026-11-22T10:00:00Z",
    });
  });

  it("true empty selection stays EMPTY without a synthetic recency timestamp",async()=>{
    vi.stubGlobal("fetch",vi.fn(async()=>Response.json(corpus())));
    const res=await run("obligation=article-53&subject=does-not-exist");
    const d=await res.json();
    expect(d.relevant_signed_cards).toBe(0);
    expect(d.cards).toEqual([]);
    expect(d.freshness).toMatchObject({
      relevant_card_count:0,returned_card_count:0,
      timing_coverage:"EMPTY",newest_relevant_card_as_of:null,
      newest_relevant_card_sha256:null,
    });
  });
});
