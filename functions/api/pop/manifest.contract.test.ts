import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, webcrypto } from "node:crypto";
const hooks = vi.hoisted(() => ({ reading: {} as any, reads: vi.fn(), settlement: vi.fn(), signing: vi.fn() }));
vi.mock("../_population", () => ({
  POPULATIONS: [], POPULATION_IDS: ["stablecoins"],
  findPopulation: (id: string) => id === "stablecoins" ? { id, title: "Stablecoin universe", population: "dated source rows", tags: ["stablecoins"], read: async (_: unknown, full: boolean) => { hooks.reads(full); return structuredClone(hooks.reading); } } : undefined,
  makeIo: () => ({}), toPreview: (r: any) => { const { rows, ...rest } = r; return rest; },
}));
vi.mock("../_x402", () => ({
  verifyX402Payment: (...args: any[]) => hooks.settlement(...args),
  x402Accepts: () => [{ scheme: "exact" }],
  buildPaymentRequiredV2: (x: unknown) => x,
  declareBazaarHttpGet: (x: unknown) => x,
  paymentRequiredResponseSigned: (x: unknown) => new Response(JSON.stringify(x), { status: 402 }),
  hasPaymentHeader: (r: Request) => r.headers.has("x-payment"),
  CSOAI_LID: "test fixture, not public measurement",
}));
vi.mock("../_x402_config", () => ({ railMode: () => ({ mode: "fixture" }) }));
vi.mock("../../_lib/cardSign", async (original) => {
  const real: any = await original();
  return { ...real, signPayload: (...args: any[]) => hooks.signing(...args) };
});
import { onRequestGet as handler } from "../_population_door";
import { canonicalBytes } from "../../_lib/cardSign";
import { deliveryReadFailure, expectedDigest, makeDeliveryManifest } from "../_population_manifest";
const hash = (x: unknown) => createHash("sha256").update(canonicalBytes(x)).digest("hex");
const ctx = (path: string, headers: Record<string,string> = {}) => ({request:new Request('https://councilof.ai'+path,{headers}),env:{},params:{population:'stablecoins'}}) as never;
const call = (path: string, headers: Record<string,string> = {}) => (handler as any)(ctx(path,headers)) as Promise<Response>;
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  hooks.reading = {state:'INDEXED',n:2,n_unit:'assets',as_of:'2026-09-16T12:06:54Z',source:['/fixed.json'],reason:null,unmeasured:[],head:{},rows:{assets:[{id:'a',value:'1.00'},{id:'b',value:'2.00'}]},rows_unit:'source rows'};
  hooks.reads.mockClear();hooks.settlement.mockReset();hooks.signing.mockReset();
  hooks.settlement.mockResolvedValue({ok:true,reason:'fixture only',settlement:{transaction:null}});
  hooks.signing.mockImplementation(async () => ({sha256:'a'.repeat(64),sig_ed25519:null,unsigned_reason:'fixture; no key'}));
});
afterEach(()=>vi.unstubAllGlobals());
describe('free manifest contract',()=>{
 it('serves the exact assembled rows digest without payment or signing',async()=>{const r=await call('/api/pop/stablecoins/manifest');const m:any=await r.json();expect(r.status).toBe(200);expect(m.evidence.rows_sha256).toBe(hash(hooks.reading.rows));expect(m.evidence.rows_bytes).toBe(canonicalBytes(hooks.reading.rows).length);expect(hooks.reads).toHaveBeenCalledWith(true);expect(hooks.settlement).not.toHaveBeenCalled();expect(hooks.signing).not.toHaveBeenCalled();});
 it('preserves source date instead of manufacturing freshness',async()=>{const m:any=await (await call('/api/pop/stablecoins/manifest')).json();expect(m.freshness.as_of).toBe(hooks.reading.as_of);expect(m.freshness.max_age_hours).toBeNull();expect(m.coverage.record_count).toBe(2);});
 it('does not assert a foreign capture root or Bitcoin verification',async()=>{const m:any=await (await call('/api/pop/stablecoins/manifest')).json();expect(m.evidence.merkle_root).toBeNull();expect(m.evidence.bitcoin_chain_verified).toBe(false);expect(m.evidence.signature.state).toBe('NOT_CREATED_BY_MANIFEST');});
 it('supports manifest query for legacy routers',async()=>{expect((await call('/api/pop/stablecoins?manifest=1')).status).toBe(200);});
 it('trailing slash is the same contract',async()=>{expect((await call('/api/pop/stablecoins/manifest/')).status).toBe(200);});
 it('manifest ignores a payment without settling',async()=>{expect((await call('/api/pop/stablecoins/manifest',{'x-payment':'fixture'})).status).toBe(200);expect(hooks.settlement).not.toHaveBeenCalled();});
 it('unknown population never pays',async()=>{expect((await call('/api/pop/no-such-pop/manifest',{'x-payment':'fixture'})).status).toBe(404);expect(hooks.settlement).not.toHaveBeenCalled();});
 for(const state of ['UNMEASURED','UNCHECKABLE'])it(`unavailable ${state} manifest is503`,async()=>{hooks.reading.state=state;expect((await call('/api/pop/stablecoins/manifest')).status).toBe(503);expect(hooks.settlement).not.toHaveBeenCalled();});
 it('missing rows does not become an empty delivered dataset',async()=>{delete hooks.reading.rows;expect((await call('/api/pop/stablecoins/manifest')).status).toBe(503);});
 it('no free data rows leak through metadata',async()=>{const m:any=await (await call('/api/pop/stablecoins/manifest')).json();expect(m).not.toHaveProperty('rows');expect(m.claim_boundary.does_not_prove.length).toBeGreaterThan(0);});
 it('identical input yields identical manifest bytes',async()=>{const a=await (await call('/api/pop/stablecoins/manifest')).text();const b=await (await call('/api/pop/stablecoins/manifest')).text();expect(a).toBe(b);});
});
describe('settlement protections',()=>{
 it('contradictory read with rows blocks before facilitator',async()=>{hooks.reading.state='UNCHECKABLE';hooks.reading.reason='counts disagree';expect((await call('/api/pop/stablecoins',{'x-payment':'fixture'})).status).toBe(402);expect(hooks.settlement).not.toHaveBeenCalled();expect(hooks.signing).not.toHaveBeenCalled();});
 it('unmeasured read blocks',async()=>{hooks.reading.state='UNMEASURED';expect((await call('/api/pop/stablecoins',{'x-payment':'fixture'})).status).toBe(402);expect(hooks.settlement).not.toHaveBeenCalled();});
 it('mismatched digest rejects before signing or payment',async()=>{const r=await call('/api/pop/stablecoins',{'x-payment':'fixture','x-csoai-expected-rows-sha256':'0'.repeat(64)});expect(r.status).toBe(409);expect(hooks.signing).not.toHaveBeenCalled();expect(hooks.settlement).not.toHaveBeenCalled();expect((await r.json() as any).settled).toBe(false);});
 it('matching digest returns exact same manifest as the free endpoint',async()=>{const before:any=await (await call('/api/pop/stablecoins/manifest')).json();const r=await call('/api/pop/stablecoins',{'x-payment':'fixture','x-csoai-expected-rows-sha256':before.evidence.rows_sha256});expect(r.status).toBe(200);const b:any=await r.json();expect(b.delivery_manifest).toEqual(before);expect(hash(b.rows)).toBe(before.evidence.rows_sha256);expect(hooks.settlement).toHaveBeenCalledOnce();});
 for(const v of ['','a'.repeat(63),'A'.repeat(64),'https://evil.invalid'])it('invalid expected digest rejected: '+v.slice(0,8),async()=>{expect((await call('/api/pop/stablecoins',{'x-payment':'fixture','x-csoai-expected-rows-sha256':v})).status).toBe(400);expect(hooks.settlement).not.toHaveBeenCalled();});
 it('unchanged legacy clients still receive a manifest with delivered rows',async()=>{const r=await call('/api/pop/stablecoins',{'x-payment':'fixture'});expect(r.status).toBe(200);const d:any=await r.json();expect(d.delivery_manifest.evidence.rows_sha256).toBe(hash(d.rows));});
 it('preview stays free and links the manifest',async()=>{const r=await call('/api/pop/stablecoins?preview=1',{'x-payment':'fixture'});expect(r.status).toBe(200);expect((await r.json() as any).manifest).toMatch(/\/manifest$/);expect(hooks.settlement).not.toHaveBeenCalled();expect(hooks.reads).toHaveBeenCalledWith(false);});
 it('row tampering changes the commitment',()=>{const old=hash(hooks.reading.rows);hooks.reading.rows.assets[0].value='forged';expect(hash(hooks.reading.rows)).not.toBe(old);});
});
