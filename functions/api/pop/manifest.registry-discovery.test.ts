import {expect,it,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {findPopulation} from '../_population';
import {onRequestGet as manifestHandler} from '../_population_door';
afterEach(()=>vi.unstubAllGlobals());
import {registryPathsFromIndex} from '../_population';
const make=(urls:string[])=>({schema:'csoai.claim-maintenance.register/0.1',registries:urls.map(url=>({url}))});
it('discovers new registry files without a source edit',()=>expect(registryPathsFromIndex(make(['https://councilof.ai/claims/claimreg-one.json','https://councilof.ai/claims/claimreg-new-2026-09-23.json']))).toHaveLength(2));
it('duplicate URLs do not inflate the file population',()=>expect(registryPathsFromIndex(make(['/claims/claimreg-one.json','/claims/claimreg-one.json']))).toHaveLength(1));
it('external registry URL is rejected before any fetch',()=>expect(()=>registryPathsFromIndex(make(['https://example.invalid/claims/claimreg-one.json']))).toThrow());
it('internal secret path rejected',()=>expect(()=>registryPathsFromIndex(make(['https://councilof.ai/api/private']))).toThrow());
it('query injection rejected',()=>expect(()=>registryPathsFromIndex(make(['/claims/claimreg-one.json?redirect=private']))).toThrow());
it('sidecar is not a registry',()=>expect(()=>registryPathsFromIndex(make(['/claims/claimreg-one.signed.json']))).toThrow());
it('empty discovery fails closed',()=>expect(()=>registryPathsFromIndex(make([]))).toThrow());
it('bounded discovery fails closed',()=>expect(()=>registryPathsFromIndex(make(Array(101).fill('/claims/claimreg-one.json')))).toThrow());
it('wrong schema rejected',()=>expect(()=>registryPathsFromIndex({schema:'fake',registries:[]})).toThrow());

it('current authoritative membership registry is a permitted leaf',()=>expect(registryPathsFromIndex(make(['/claims/osaia-membership-2026-09-23.json']))).toEqual(['/claims/osaia-membership-2026-09-23.json']));
it('same-origin nesting remains forbidden',()=>expect(()=>registryPathsFromIndex(make(['/claims/nested/claimreg-one.json']))).toThrow());
it('encoded traversal remains outside leaf scope',()=>expect(()=>registryPathsFromIndex(make(['/claims/%2e%2e/api/private.json']))).toThrow());
it('fragment remains forbidden',()=>expect(()=>registryPathsFromIndex(make(['/claims/osaia-membership-2026-09-23.json#x']))).toThrow());
it('credential-bearing origin remains forbidden',()=>expect(()=>registryPathsFromIndex(make(['https://user:pass@councilof.ai/claims/osaia-membership-2026-09-23.json']))).toThrow());
it('non-registry declared schema remains forbidden',()=>expect(()=>registryPathsFromIndex({schema:'csoai.claim-maintenance.register/0.1',registries:[{url:'/claims/osaia-membership-2026-09-23.json',schema:'private.secret/1'}]})).toThrow());
it('overlong leaf names remain forbidden',()=>expect(()=>registryPathsFromIndex(make(['/claims/'+('a'.repeat(230))+'.json']))).toThrow());
it('exact current generated register is discoverable without counting twice',()=>{const fs=require('node:fs');const d=JSON.parse(fs.readFileSync('public/spec/claim-maintenance/register.json','utf8'));const paths=registryPathsFromIndex(d);expect(paths.length).toBe(new Set(d.registries.map((x:any)=>new URL(x.url).pathname)).size);expect(paths.length).toBeGreaterThan(0);for(const x of d.registries)expect(paths).toContain(new URL(x.url).pathname);});

const diskIo=()=>({origin:'https://councilof.ai',request:new Request('https://councilof.ai/api/pop/claim-watch'),get:async(path:string)=>{try{const text=readFileSync(resolve('public','.'+path),'utf8');return {ok:true as const,text,json:JSON.parse(text),status:200}}catch{return {ok:false as const,reason:'missing fixture '+path,status:404}}},bytes:async(path:string)=>{try{return {ok:true as const,bytes:new Uint8Array(readFileSync(resolve('public','.'+path)))}}catch{return {ok:false as const,reason:'missing fixture '+path}}}});
// These two named /claims/osaia-membership-2026-09-23.json, a registry no revision of this repository (master or
// the canon archive) has ever contained; they now hold every registry the generated register actually lists.
it('complete real registry read includes every registry the generated register lists, without claiming measurements',async()=>{const io=diskIo();const r=await findPopulation('claim-watch')!.read(io,true);expect(r.state).toBe('INDEXED');const listed=JSON.parse(readFileSync(resolve('public/spec/claim-maintenance/register.json'),'utf8')).registries.map((x:any)=>new URL(x.url).pathname);expect(listed.length).toBeGreaterThan(0);for(const p of listed){expect(r.source).toContain(p);expect((r.head.registries as any[]).some(x=>x.file===p)).toBe(true);}expect(r.n).toBeGreaterThan(0);});
it('free manifest for the actual generated register returns a byte pin without settlement',async()=>{let offsite=0;vi.stubGlobal('fetch',async(input:any)=>{const u=new URL(String(input instanceof Request?input.url:input));if(u.origin!=='https://councilof.ai'){offsite++;return new Response('denied',{status:403})}try{return new Response(readFileSync(resolve('public','.'+u.pathname)),{headers:{'content-type':u.pathname.endsWith('.json')?'application/json':'application/octet-stream'}})}catch{return new Response('absent',{status:404})}});const res=await (manifestHandler as any)({request:new Request('https://councilof.ai/api/pop/claim-watch/manifest'),env:{},params:{population:'claim-watch'}});expect(res.status).toBe(200);const d=await res.json();expect(d.free).toBe(true);expect(d.settlement_attempted).toBe(false);expect(d.evidence.rows_sha256).toBe(d.pinning.value);expect(offsite).toBe(0);});
