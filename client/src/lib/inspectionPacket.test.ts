import {describe,it,expect} from 'vitest';import {deflateRawSync} from 'node:zlib';
import fixture from './__fixtures__/inspection-packet-fixture.json';
import {verifyInspectionPacket,inspectPacketMembers,packetDigest} from './inspectionPacket';
import {readInspectionZip,strictPacketJson,crc32} from './inspectionPacketZip';
const source=new Uint8Array(Buffer.from(fixture.zip_base64,'base64'));
const enc=(x:unknown)=>new TextEncoder().encode(JSON.stringify(x));
const decode=(b:Uint8Array)=>JSON.parse(new TextDecoder().decode(b));
async function members(){return await readInspectionZip(source);}
async function resignManifest(m:Record<string,Uint8Array>){const manifest=decode(m['manifest.json']);for(const n of Object.keys(manifest.files))manifest.files[n]={bytes:m[n].length,sha256:await packetDigest(m[n])};m['manifest.json']=enc(manifest);return m;}
async function deliveryMutation(key:string,value:unknown,measurement=false){const m=await members(),d=decode(m['delivery.json']);if(measurement)d.measurement[key]=value;else d[key]=value;m['delivery.json']=enc(d);return await resignManifest(m);}
function zip(entries:[string,Uint8Array][]):Uint8Array {
 const locals:Buffer[]=[],centrals:Buffer[]=[];let offset=0;
 for(const [name,data] of entries){const nb=Buffer.from(name),compressed=deflateRawSync(data),crc=crc32(data);const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(nb.length,26);locals.push(local,nb,compressed);
 const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(nb.length,28);central.writeUInt32LE(offset,42);centrals.push(central,nb);offset+=30+nb.length+compressed.length;}
 const directory=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return new Uint8Array(Buffer.concat([...locals,directory,end]));
}
describe('offline inspection exact format',()=>{
 it('replays the independently encoded Python fixture',async()=>{const r=await verifyInspectionPacket(source,fixture.request_id,fixture.packet_sha256);expect(r.records).toBe(2);expect(r.states).toEqual({MEASURED:1,UNMEASURED:1});expect(r.publisherAuthenticated).toBe(false);expect(r.expectedDigestMatched).toBe(true);expect(r.newMeasurements).toBe(0);});
 it('labels absence of independent expected identifiers',async()=>{const r=await verifyInspectionPacket(source);expect(r.expectedDigestMatched).toBe(false);expect(r.expectedRequestMatched).toBe(false);expect(r.freshness).toBe('HISTORICAL_NOT_REVALIDATED');});
 it('rejects wrong expected request',async()=>expect(verifyInspectionPacket(source,'0'.repeat(64))).rejects.toThrow('EXPECTED_REQUEST'));
 it('rejects wrong expected packet',async()=>expect(verifyInspectionPacket(source,undefined,'0'.repeat(64))).rejects.toThrow('EXPECTED_PACKET'));
 it.each(['attempts','temperature','model_version'])('rejects undeclared config %s even with rewritten manifest',async key=>{const m=await members(),q=decode(m['request.json']);q[key]=2;m['request.json']=enc(q);await expect(inspectPacketMembers(await resignManifest(m))).rejects.toThrow('REQUEST_CONFIGURATION');});
 it.each([['paid',true],['public',true],['root_state','ROOTED'],['signature','fake']])('rejects authentication or payment claim %s',async(key,value)=>expect(inspectPacketMembers(await deliveryMutation(key as string,value))).rejects.toThrow('OVERCLAIM'));
 it.each([['record_count',100],['source_as_of','2099-01-01'],['recorded_state_counts',{MEASURED:2}],['model_performance','PASS'],['organisation_compliance','COMPLIANT'],['signatures_verified',true]])('rejects altered finding %s',async(key,value)=>expect(inspectPacketMembers(await deliveryMutation(key as string,value,true))).rejects.toThrow());
 it('rejects changed authority',async()=>{const m=await members(),q=decode(m['request.json']);q.authority='OWNER_APPROVED_PUBLIC';m['request.json']=enc(q);await expect(inspectPacketMembers(await resignManifest(m))).rejects.toThrow('AUTHORITY');});
 it('rejects changed budget',async()=>{const m=await members(),q=decode(m['request.json']);q.budget.inference=1;m['request.json']=enc(q);await expect(inspectPacketMembers(await resignManifest(m))).rejects.toThrow('BUDGET');});
 it.each(['source.body','method.py','observer.py','observation.json'])('rejects substituted bound file %s even if manifest is rewritten',async name=>{const m=await members();m[name]=enc({substitute:true});await expect(inspectPacketMembers(await resignManifest(m))).rejects.toThrow();});
 it('preserves structured per-axis dates instead of inventing a scalar timestamp',async()=>{const m=await members(),q=decode(m['request.json']),d=decode(m['delivery.json']),o=decode(m['observation.json']);const dating={care:'2026-09-01',safety:'2026-09-02'};q.source_as_of=dating;o.sources[0].source_as_of=dating;m['observation.json']=enc(o);q.observer_receipt_sha256=await packetDigest(m['observation.json']);d.observer_receipt_sha256=q.observer_receipt_sha256;d.measurement.source_as_of=dating;m['request.json']=enc(q);m['delivery.json']=enc(d);const r=await inspectPacketMembers(await resignManifest(m));expect(r.sourceAsOf).toEqual(dating);});
 it('does not execute a bundled source file',async()=>{const m=await members();expect(new TextDecoder().decode(m['method.py'])).toContain('never execute');expect((await inspectPacketMembers(m)).newMeasurements).toBe(0);});
});
describe('strict file and JSON boundaries',()=>{
 it('accepts independently built deflate ZIP',async()=>{const m=await members();expect((await verifyInspectionPacket(zip(Object.entries(m).sort()))).records).toBe(2);});
 it('rejects unexpected extra archive file',async()=>{const m=await members();await expect(readInspectionZip(zip([...Object.entries(m),['../escaped',enc('bad')]]))).rejects.toThrow();});
 it('rejects duplicate file replacing expected member',async()=>{const m=await members(),entries=Object.entries(m);entries[1]=entries[0];await expect(readInspectionZip(zip(entries))).rejects.toThrow();});
 it('rejects changed local name',async()=>{const changed=source.slice();changed[30]^=1;await expect(readInspectionZip(changed)).rejects.toThrow('NAME_DISAGREEMENT');});
 it('rejects appended data',async()=>{const changed=new Uint8Array(source.length+1);changed.set(source);await expect(readInspectionZip(changed)).rejects.toThrow('END_RECORD');});
 it('rejects encryption and descriptors',async()=>{const changed=source.slice();const view=new DataView(changed.buffer),end=changed.length-22,central=view.getUint32(end+16,true);view.setUint16(central+8,1,true);await expect(readInspectionZip(changed)).rejects.toThrow('UNSUPPORTED');});
 it('checks bounded expansion before decompression',async()=>{const changed=source.slice(),v=new DataView(changed.buffer),central=v.getUint32(changed.length-6,true);v.setUint32(central+24,3_000_000,true);await expect(readInspectionZip(changed)).rejects.toThrow('EXPANSION');});
 it('rejects unsafe total size',async()=>expect(readInspectionZip(new Uint8Array(4_000_001))).rejects.toThrow('SIZE_LIMIT'));
 it('rejects duplicate JSON keys',()=>expect(()=>strictPacketJson(new TextEncoder().encode('{"a":1,"a":2}'))).toThrow('DUPLICATE'));
 it('rejects duplicate escaped JSON keys',()=>expect(()=>strictPacketJson(new TextEncoder().encode('{"a":1,"\\u0061":2}'))).toThrow('DUPLICATE'));
 it.each(['{"x":NaN}','{"x":1e999}','{"x":1}junk','[1,]','{"x":01}'])('rejects malformed JSON %s',s=>expect(()=>strictPacketJson(new TextEncoder().encode(s))).toThrow());
 it('limits nesting',()=>expect(()=>strictPacketJson(new TextEncoder().encode('['.repeat(65)+'0'+']'.repeat(65)))).toThrow('COMPLEXITY'));
 it('accepts unicode keys without prototype mutation',()=>{const r=strictPacketJson(enc({'é':'😀','constructor':'safe'})) as Record<string,string>;expect(r['é']).toBe('😀');expect(Object.getPrototypeOf(r)).toBeNull();});
 it('preserves null and boolean distinction in JSON',()=>expect(strictPacketJson(enc([null,false,0]))).toEqual([null,false,0]));
});
