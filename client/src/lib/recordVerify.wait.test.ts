import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { verifyRecord } from "./recordVerify";
const read=(path:string)=>JSON.parse(readFileSync(new URL(`../../../${path}`,import.meta.url),"utf8"));
const index=read("public/signed/card_index.json");
const card=read(`public/signed/cards/${index.cards[0].card}.json`);
const did=read("public/.well-known/did.json");
const raw=JSON.stringify(card);
beforeEach(()=>vi.useFakeTimers());
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});

describe("optional public-key cross-check cannot strand local verification",()=>{
 it("returns the pinned-key verdict when a fetch never resolves",async()=>{
   let signal:AbortSignal|undefined;
   vi.stubGlobal("fetch",(_url:unknown,options:RequestInit)=>{signal=options.signal as AbortSignal;return new Promise(()=>{});});
   const pending=verifyRecord(raw);await vi.advanceTimersByTimeAsync(3001);
   const result=await pending;expect(result.state).toBe("VALID");expect(signal?.aborted).toBe(true);expect(vi.getTimerCount()).toBe(0);
 });
 it("bounds an unending JSON body after headers arrive",async()=>{
   vi.stubGlobal("fetch",async()=>({ok:true,json:()=>new Promise(()=>{})}));
   const pending=verifyRecord(raw);await vi.advanceTimersByTimeAsync(3001);
   expect((await pending).state).toBe("VALID");expect(vi.getTimerCount()).toBe(0);
 });
 it("does not parse an unsuccessful response as trusted cross-check metadata",async()=>{
   const body=vi.fn(async()=>did);vi.stubGlobal("fetch",async()=>({ok:false,json:body}));
   expect((await verifyRecord(raw)).state).toBe("VALID");expect(body).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
 it("preserves the ordinary public-key cross-check",async()=>{
   vi.stubGlobal("fetch",async()=>({ok:true,json:async()=>did}));
   const result=await verifyRecord(raw);expect(result.state).toBe("VALID");expect(result.lines.some(line=>line.code==="signature_valid")).toBe(true);expect(vi.getTimerCount()).toBe(0);
 });
 it("does not perform the optional fetch for malformed input",async()=>{
   const fetch=vi.fn();vi.stubGlobal("fetch",fetch);const result=await verifyRecord("{broken");
   expect(result.state).toBe("UNCHECKABLE");expect(fetch).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
 it("does not convert an altered card to valid when the cross-check is offline",async()=>{
   vi.stubGlobal("fetch",async()=>{throw new Error("synthetic offline");});
   const result=await verifyRecord(JSON.stringify({...card,body:{...card.body,accuracy:0.4242}}));
   expect(result.state).toBe("INVALID");expect(vi.getTimerCount()).toBe(0);
 });
});
