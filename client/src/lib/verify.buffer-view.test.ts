import {describe,it,expect} from 'vitest';import {verifyEd25519Detached} from './verify';
const sha=async(bytes:Uint8Array<ArrayBuffer>)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
describe('existing detached verifier accepts both exact byte representations',()=>{
 it('ArrayBuffer and Uint8Array produce the same digest without a signature success',async()=>{const bytes=new TextEncoder().encode('synthetic exact-byte fixture');const expected=await sha(bytes);const a=await verifyEd25519Detached(bytes.buffer,'','',expected);const b=await verifyEd25519Detached(bytes,'','',expected);expect(a.sha256).toBe(expected);expect(b.sha256).toBe(expected);expect(a.ok).toBe(false);expect(b.ok).toBe(false);});
 it('a subarray includes only its selected bytes, not the surrounding buffer',async()=>{const input=new TextEncoder().encode('XXretained bytesYY');const view=input.subarray(2,input.length-2);const result=await verifyEd25519Detached(view,'','',await sha(view));expect(result.sha256_matches).toBe(true);expect(result.sha256).not.toBe(await sha(input));expect(result.ok).toBe(false);});
});
