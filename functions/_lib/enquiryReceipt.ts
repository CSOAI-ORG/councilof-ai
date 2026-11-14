/** Confirm inbound enquiries, not email delivery, paid work, or global KV consistency.
 * Uses the existing LEADS binding. No outbound network, enrichment, signing or payment.
 */
import {canonicalBytes,sha256Hex} from './cardSign';
export type EnquiryKind='contact'|'lead';
type Store=Pick<KVNamespace,'get'|'put'>;
type Fields=Record<string,string>;
const MAX_BYTES=24_576;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SCHEMA='csoai.enquiry-record/2';
export const ENQUIRY_LIMITS='Storage readback is an observation, not global durability or exactly-once delivery. This records an enquiry only; no email, human review, booking, payment or model evaluation has occurred.';
function reply(body:Record<string,unknown>,status=200){return Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});}
function unavailable(state:string,submissionId:string|null,receiptId:string|null,status=503,stored:boolean|null=null){return reply({ok:false,stored,state,submission_id:submissionId,receipt_id:receiptId,email_sent:false,reviewed:false,reason:'Receipt storage could not be confirmed. Keep your message and use the same submission details when retrying.',fallback:'Email nicholas@csoai.org directly.',limits:ENQUIRY_LIMITS},status);}
async function readBody(request:Request):Promise<Record<string,unknown>>{
 const type=(request.headers.get('content-type')??'').split(';')[0].trim().toLowerCase();if(type!=='application/json')throw Error('JSON_CONTENT_TYPE_REQUIRED');
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw Error('CROSS_ORIGIN_NOT_ALLOWED');
 const size=request.headers.get('content-length');if(size!==null&&(!/^\d+$/.test(size)||Number(size)>MAX_BYTES))throw Error('BODY_TOO_LARGE');
 const reader=request.body?.getReader();if(!reader)throw Error('JSON_OBJECT_REQUIRED');let length=0;const chunks:Uint8Array[]=[];
 try{while(true){const r=await reader.read();if(r.done)break;length+=r.value.length;if(length>MAX_BYTES){void reader.cancel();throw Error('BODY_TOO_LARGE');}chunks.push(r.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let at=0;for(const p of chunks){bytes.set(p,at);at+=p.length;}let body;
 try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('JSON_OBJECT_REQUIRED');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('JSON_OBJECT_REQUIRED');return body;
}
function fieldsFor(body:Record<string,unknown>,kind:EnquiryKind):Fields{
 const limits:Record<string,number>=kind==='contact'?{email:254,name:200,subject:300,message:5000}:{email:254,name:200,report_id:200,result_id:200,tier:100,wants:200,screening_state:200,explanation:5000};
 for(const key of Object.keys(body))if(key!=='submission_id'&&!Object.hasOwn(limits,key))throw Error('UNSUPPORTED_ENQUIRY_FIELD');
 const out:Fields={};for(const [key,max] of Object.entries(limits)){const v=body[key]??'';if(typeof v!=='string'||v.length>max||v.includes('\u0000'))throw Error('INVALID_ENQUIRY_FIELD');out[key]=v;}
 out.email=out.email.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))throw Error('EMAIL_REQUIRED');
 if(kind==='contact'&&!out.message.trim())throw Error('MESSAGE_REQUIRED');
 if(kind==='lead'){
  if(out.report_id&&out.result_id&&out.report_id!==out.result_id)throw Error('REPORT_REFERENCE_CONFLICT');
  out.report_id=out.report_id||out.result_id;delete out.result_id;
 }
 return out;
}
export async function receiveEnquiry(request:Request,store:Store|undefined,kind:EnquiryKind):Promise<Response>{
 let body:Record<string,unknown>,fields:Fields,submissionId:string;
 try{body=await readBody(request);fields=fieldsFor(body,kind);const id=body.submission_id;if(id!==undefined&&(typeof id!=='string'||!UUID.test(id)))throw Error('INVALID_SUBMISSION_ID');submissionId=typeof id==='string'?id.toLowerCase():crypto.randomUUID();}
 catch(error){const code=error instanceof Error?error.message:'INVALID_REQUEST';return reply({ok:false,stored:false,state:code,email_sent:false},code==='BODY_TOO_LARGE'?413:code==='CROSS_ORIGIN_NOT_ALLOWED'?403:400);}
 if(!store||typeof store.get!=='function'||typeof store.put!=='function')return unavailable('STORE_UNAVAILABLE',submissionId,null,503,false);
 const payloadSha=await sha256Hex(canonicalBytes({schema:SCHEMA,kind,...fields}));
 const receiptId=await sha256Hex(canonicalBytes({schema:SCHEMA,submission_id:submissionId,payload_sha256:payloadSha}));
 const key=`${kind}:v2:${receiptId}`;
 const record={schema:SCHEMA,kind,...fields,submission_id:submissionId,payload_sha256:payloadSha,receipt_id:receiptId,at:new Date().toISOString()};
 const same=(value:unknown):value is typeof record=>{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;const old=value as Record<string,unknown>;
  return Object.keys(old).length===Object.keys(record).length&&Object.entries(record).every(([k,v])=>k==='at'?typeof old.at==='string'&&Number.isFinite(Date.parse(old.at)):old[k]===v);
 };
 const success=(receivedAt:string,reused:boolean)=>reply({ok:true,stored:true,state:'STORED_READBACK_CONFIRMED',receipt_id:receiptId,submission_id:submissionId,received_at:receivedAt,reused,email_sent:false,reviewed:false,work_started:false,limits:ENQUIRY_LIMITS},reused?200:201);
 let prior:string|null;
 try{prior=await store.get(key);}catch{return unavailable('STORE_READ_UNCONFIRMED',submissionId,receiptId);}
 if(prior!==null){let old;try{old=JSON.parse(prior);}catch{return unavailable('RECEIPT_CONFLICT',submissionId,receiptId,409);}
  if(!same(old))return unavailable('RECEIPT_CONFLICT',submissionId,receiptId,409);return success(old.at,true);
 }
 const encoded=JSON.stringify(record);
 try{await store.put(key,encoded);}catch{return unavailable('STORE_WRITE_UNCONFIRMED',submissionId,receiptId);}
 try{const observed=await store.get(key);if(observed!==encoded)return unavailable('STORE_READBACK_UNCONFIRMED',submissionId,receiptId);}catch{return unavailable('STORE_READBACK_UNCONFIRMED',submissionId,receiptId);}
 return success(record.at,false);
}
