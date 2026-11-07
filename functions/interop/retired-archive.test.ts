import {describe,it,expect,vi,afterEach} from 'vitest';
import {createHash} from 'node:crypto';
import {retiredProofResponse,eligibleRetiredUrl} from '../_lib/retiredProofArchive';
import {onRequest} from './[[path]]';
const path='/interop/ots/old.ots.invalid';const raw=Buffer.from([0,255,1,2]);
const fixture=()=>({schema:'csoai.retired-proof-bytes/0.1',members:{[path]:{sha256:createHash('sha256').update(raw).digest('hex'),bytes:raw.length,body_base64:raw.toString('base64')}}});
afterEach(()=>vi.unstubAllGlobals());
describe('retired proof byte restoration',()=>{
 it('returns exactly archived bytes, not a proof-validity verdict',async()=>{const r=await retiredProofResponse(new Request('https://example.invalid'+path),fixture());expect(Buffer.from(await r.arrayBuffer())).toEqual(raw);expect(r.headers.get('x-csoai-evidence-state')).toContain('NOT_A_VALID_PROOF');expect(r.headers.get('x-content-type-options')).toBe('nosniff');});
 it('supports HEAD without returning bytes',async()=>{const r=await retiredProofResponse(new Request('https://example.invalid'+path,{method:'HEAD'}),fixture());expect(await r.text()).toBe('');expect(r.status).toBe(200);});
 it('tampered bytes fail',async()=>{const f=fixture();f.members[path].body_base64='AAAAAA==';expect((await retiredProofResponse(new Request('https://example.invalid'+path),f)).status).toBe(503);});
 it('unknown retired path is not fabricated',async()=>expect((await retiredProofResponse(new Request('https://example.invalid/interop/notfound.invalid'),fixture())).status).toBe(404));
 it('bad archive shape fails closed',async()=>expect((await retiredProofResponse(new Request('https://example.invalid'+path),[])).status).toBe(503));
 it.each(['/interop/../private.invalid','/api/thing.invalid','/interop//thing.invalid','/interop/current.ots'])('rejects scope %s',p=>expect(eligibleRetiredUrl(p)).toBe(false));
 it('unrelated interop path continues to existing handler/static asset',async()=>{const next=vi.fn(async()=>new Response('original'));const r=await onRequest({request:new Request('https://example.invalid/interop/current.json'),next} as never);expect(await r.text()).toBe('original');expect(next).toHaveBeenCalledOnce();});
 it('archive source failure visible at original URL',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response('missing',{status:404})));const r=await onRequest({request:new Request('https://example.invalid'+path)} as never);expect(r.status).toBe(503);});
});
