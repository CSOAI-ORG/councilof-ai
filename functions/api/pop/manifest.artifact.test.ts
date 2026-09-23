import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { findPopulation, type Io } from '../_population';
import { makeDeliveryManifest, rowCommitment, deliveryReadFailure } from '../_population_manifest';
import { canonicalBytes } from '../../_lib/cardSign';
const PUBLIC=resolve(__dirname,'../../../public');
const io:Io={origin:'https://councilof.ai',request:new Request('https://councilof.ai/api/pop/stablecoins'),get:async(p)=>{
 try{const text=readFileSync(resolve(PUBLIC,'.'+p),'utf8');return {ok:true,status:200,text,json:JSON.parse(text)};}catch{return {ok:false,status:404,reason:'fixture source missing'};}
},bytes:async()=>({ok:false,reason:'not used by this fixture'})};
beforeEach(()=>vi.stubGlobal('crypto',webcrypto));afterEach(()=>vi.unstubAllGlobals());
it('actual current stablecoin rows and current source timestamp bind to free manifest',async()=>{
 const entry=findPopulation('stablecoins')!;const r=await entry.read(io,true);const index=JSON.parse(readFileSync(PUBLIC+'/interop/stablecoin-corpus-index-2026-09-16.json','utf8'));
 const m=await makeDeliveryManifest(entry,r,io.origin);expect(m.coverage.record_count).toBe(index.universe_asset_count);expect(m.freshness.as_of).toBe(index.as_of);expect(m.evidence.rows_sha256).toBe(createHash('sha256').update(canonicalBytes(r.rows)).digest('hex'));
});
it('reader mutation causing count contradiction cannot build a delivery manifest',async()=>{
 const bad:Io={...io,get:async(p)=>{const d=await io.get(p);if(d.ok&&p.includes('corpus-index'))return {...d,json:{...(d.json as any),universe_asset_count:999999}};return d;}};
 const entry=findPopulation('stablecoins')!;const r=await entry.read(bad,true);expect(r.state).toBe('UNCHECKABLE');expect(deliveryReadFailure(r)).toBeTruthy();await expect(makeDeliveryManifest(entry,r,io.origin)).rejects.toThrow();
});
it('same unchanged artifact bytes reproduce the same commitment',async()=>{
 const entry=findPopulation('stablecoins')!;expect(await rowCommitment(await entry.read(io,true))).toEqual(await rowCommitment(await entry.read(io,true)));
});
it('altering one actual catalogue row breaks the expected commitment',async()=>{
 const entry=findPopulation('stablecoins')!;const r=await entry.read(io,true);const old=await rowCommitment(r);const modified=structuredClone(r);(modified.rows as any).catalogue.assets[0].name='synthetic tamper control';expect((await rowCommitment(modified)).rows_sha256).not.toBe(old.rows_sha256);
});
