/** Narrow reader for the seven-member inspection ZIP, not a general archive extractor.
 * No writes, fetches, eval or dependency installs. Uses native bounded deflate streams.
 */
export const PACKET_NAMES=['delivery.json','manifest.json','method.py','observation.json','observer.py','request.json','source.body'] as const;
export function requirePacket(ok:unknown,reason:string):asserts ok {if(!ok)throw new Error(reason);}
export function crc32(bytes:Uint8Array):number {let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
const decoder=new TextDecoder('utf-8',{fatal:true});
async function inflate(bytes:Uint8Array,expected:number):Promise<Uint8Array>{
 requirePacket(typeof DecompressionStream==='function','BROWSER_DECOMPRESSION_UNAVAILABLE');
 const reader=new Blob([new Uint8Array(bytes).buffer]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
 const parts:Uint8Array[]=[];let size=0;
 try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>expected||size>2_000_000){await reader.cancel();throw new Error('DECOMPRESSED_SIZE_LIMIT');}parts.push(chunk.value);}}
 finally{reader.releaseLock();}
 requirePacket(size===expected,'DECOMPRESSED_LENGTH_MISMATCH');const out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;
}
export async function readInspectionZip(input:Uint8Array):Promise<Record<string,Uint8Array>>{
 requirePacket(input.length>=22&&input.length<=4_000_000,'ZIP_SIZE_LIMIT');const v=new DataView(input.buffer,input.byteOffset,input.byteLength);
 const u16=(at:number)=>v.getUint16(at,true),u32=(at:number)=>v.getUint32(at,true);const end=input.length-22;
 // Our deterministic writer has no comments, descriptors, ZIP64, encryption or padding.
 requirePacket(u32(end)===0x06054b50&&u16(end+20)===0,'ZIP_END_RECORD');
 requirePacket(u16(end+4)===0&&u16(end+6)===0&&u16(end+8)===7&&u16(end+10)===7,'ZIP_DISK_OR_MEMBER_COUNT');
 const start=u32(end+16),length=u32(end+12);requirePacket(start+length===end,'ZIP_DIRECTORY_BOUNDARY');
 const output:Record<string,Uint8Array>=Object.create(null);let at=start,previousEnd=0,total=0;
 for(let i=0;i<7;i++){
  requirePacket(at+46<=end&&u32(at)===0x02014b50,'ZIP_CENTRAL_RECORD');
  const flags=u16(at+8),method=u16(at+10),crc=u32(at+16),compressed=u32(at+20),size=u32(at+24),n=u16(at+28),extra=u16(at+30),comment=u16(at+32),local=u32(at+42);
  requirePacket(flags===0&&(method===0||method===8)&&u16(at+34)===0,'UNSUPPORTED_ZIP_FEATURE');
  requirePacket(extra===0&&comment===0&&at+46+n<=end,'UNEXPECTED_ZIP_METADATA');
  requirePacket(((u32(at+38)>>>16)&0xf000)!==0xa000,'ZIP_SYMLINK');
  const name=decoder.decode(input.subarray(at+46,at+46+n));
  requirePacket((PACKET_NAMES as readonly string[]).includes(name)&&!Object.hasOwn(output,name),'ZIP_MEMBER_NAME_OR_DUPLICATE');
  requirePacket(size<=2_000_000&&compressed<=4_000_000&&(total+=size)<=8_000_000,'ZIP_EXPANSION_LIMIT');
  requirePacket(local===previousEnd&&local+30<=start&&u32(local)===0x04034b50,'ZIP_LOCAL_RECORD_OR_OVERLAP');
  requirePacket(u16(local+6)===flags&&u16(local+8)===method&&u32(local+14)===crc&&u32(local+18)===compressed&&u32(local+22)===size,'ZIP_HEADERS_DISAGREE');
  requirePacket(u16(local+26)===n&&u16(local+28)===0&&local+30+n+compressed<=start,'ZIP_LOCAL_BOUNDARY');
  requirePacket(decoder.decode(input.subarray(local+30,local+30+n))===name,'ZIP_NAME_DISAGREEMENT');
  const data=input.subarray(local+30+n,local+30+n+compressed);const bytes=method===0?new Uint8Array(data):await inflate(data,size);
  requirePacket(bytes.length===size&&crc32(bytes)===crc,'ZIP_CONTENT_INTEGRITY');output[name]=bytes;previousEnd=local+30+n+compressed;at+=46+n;
 }
 requirePacket(at===end&&previousEnd===start,'ZIP_UNACCOUNTED_BYTES');return output;
}

/** Parse JSON without accepting duplicate keys, excessive depth or non-finite values. */
export function strictPacketJson(bytes:Uint8Array):unknown {
 requirePacket(bytes.length<=2_000_000,'JSON_SIZE_LIMIT');const s=decoder.decode(bytes);let at=0,tokens=0;
 const ws=()=>{while(/[\x20\x09\x0a\x0d]/.test(s[at]??'!'))at++;};
 const string=():string=>{const start=at;requirePacket(s[at++]==='"','JSON_STRING');while(at<s.length){const c=s[at++];if(c==='"')return JSON.parse(s.slice(start,at));if(c==='\\')at++;}throw new Error('JSON_UNTERMINATED_STRING');};
 const value=(depth:number):unknown=>{
  requirePacket(depth<64&&++tokens<250000,'JSON_COMPLEXITY_LIMIT');ws();const c=s[at];
  if(c==='"')return string();
  if(c==='{'){at++;const obj:Record<string,unknown>=Object.create(null);ws();if(s[at]==='}'){at++;return obj;}while(true){ws();const k=string();requirePacket(!Object.hasOwn(obj,k),'DUPLICATE_JSON_KEY');ws();requirePacket(s[at++]===':','JSON_COLON');obj[k]=value(depth+1);ws();const separator=s[at++];if(separator==='}')return obj;requirePacket(separator===',','JSON_OBJECT_SEPARATOR');}}
  if(c==='['){at++;const arr:unknown[]=[];ws();if(s[at]===']'){at++;return arr;}while(true){arr.push(value(depth+1));ws();const separator=s[at++];if(separator===']')return arr;requirePacket(separator===',','JSON_ARRAY_SEPARATOR');}}
  for(const [word,result] of [['true',true],['false',false],['null',null]] as const){if(s.startsWith(word,at)){at+=word.length;return result;}}
  const match=s.slice(at).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);requirePacket(match,'INVALID_JSON_VALUE');at+=match[0].length;const n=Number(match[0]);requirePacket(Number.isFinite(n),'NONFINITE_JSON');return n;
 };
 const result=value(0);ws();requirePacket(at===s.length,'TRAILING_JSON_BYTES');return result;
}
