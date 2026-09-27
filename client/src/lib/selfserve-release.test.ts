import { describe, it, expect } from 'vitest';
import manifest from './__fixtures__/x402-manifest-2026-09-26-readback.json';
import { buildCatalogue, groupFor } from './servicesCatalogue';
import { previewFields, resolvePreview } from './previewTemplate';
const wrapped='https://councilof.ai/api/wrapper?id=<wrapped-symbol:chain>&preview=1';
describe('captured public catalogue, 26 September 2026',()=>{
 it('shows every captured service as a complete card, with no ungrouped remainder',()=>{
  const result=buildCatalogue(manifest); const cards=result.groups.flatMap(g=>g.cards);
  expect(result.ungrouped).toEqual([]); expect(cards).toHaveLength(manifest.resources.length);
  expect(cards.map(c=>c.url).sort()).toEqual(manifest.resources.map(r=>r.url).sort());
 });
 it('does not classify a lookalike prefix as the registered route',()=>{
  expect(groupFor('https://councilof.ai/api/wrapper-malicious')).toBeNull();
  expect(groupFor('https://councilof.ai/api/pop/stablecoins-other')).toBeNull();
 });
 it('requests wrapped token and chain before making a preview link',()=>{
  expect(previewFields(wrapped)).toEqual([{key:'id',hint:'wrapped-symbol:chain'}]);
  expect(resolvePreview(wrapped,{})).toBeNull();
  expect(new URL(resolvePreview(wrapped,{id:'usdc.e:arbitrum'})!).searchParams.get('id')).toBe('usdc.e:arbitrum');
 });
 it('resolves every captured preview without leaking template placeholders',()=>{
  for(const resource of manifest.resources) {
   const t=(resource as {free_preview?:string}).free_preview; if(!t) continue;
   const values:Record<string,string>={asset:'RLUSD',id:'usdc.e:arbitrum'};
   const link=resolvePreview(t,values); expect(link,t).not.toBeNull();
   expect(decodeURIComponent(link!)).not.toMatch(/[<>]/);
  }
 });
});
describe('preview boundary controls',()=>{
 for(const template of [
  'javascript:alert(1)','data:text/html,test','https://untrusted.example/api/free',
  'https://councilof.ai.evil.example/api/free','https://user@councilof.ai/api/free',
  'https://councilof.ai/api/wrapper?id=prefix<symbol>&preview=1',
  'https://councilof.ai/api/<subject>?preview=1',
  'https://councilof.ai/api/wrapper?id=<symbol>&id=fixed&preview=1',
  'https://councilof.ai/api/wrapper?id=<symbol>&preview=1#fragment',
 ]) it('rejects unsafe or unsupported preview '+template,()=>{
  expect(resolvePreview(template,{id:'USDC'})).toBeNull();
 });
 it('does not permit entered content to replace the preview flag',()=>{
  const url=new URL(resolvePreview(wrapped,{id:'usdc.e:arbitrum&preview=0'})!);
  expect(url.searchParams.get('preview')).toBe('1');
  expect(url.searchParams.get('id')).toBe('usdc.e:arbitrum&preview=0');
 });
});
