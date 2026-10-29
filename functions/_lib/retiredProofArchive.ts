/** Restore exact historical bytes, not proof validity, at the original URL. */
import { objectOrNull } from './jsonShape';
export const RETIRED_ARCHIVE_PATH='/archive/retired-proof-bytes-v1.json';
export const eligibleRetiredUrl = (path:string) => /^\/interop\/[A-Za-z0-9_./-]+\.invalid$/.test(path) && !path.slice(1).split('/').some(p=>p==='.'||p==='..'||p==='');
export async function retiredProofResponse(request:Request, archive:unknown):Promise<Response> {
  const path=new URL(request.url).pathname;
  if(!eligibleRetiredUrl(path))return new Response('Not an archived proof path',{status:404});
  const doc=objectOrNull(archive),members=objectOrNull(doc?.members);
  if(doc?.schema!=='csoai.retired-proof-bytes/0.1'||!members)return new Response('Historical evidence archive unavailable',{status:503});
  if(!Object.hasOwn(members,path))return new Response('Historical evidence not found',{status:404});
  const member=objectOrNull(members[path]);
  try {
    if(!member||typeof member.body_base64!=='string'||member.body_base64.length>90000||typeof member.sha256!=='string'||!/^[a-f0-9]{64}$/.test(member.sha256)||typeof member.bytes!=='number'||!Number.isSafeInteger(member.bytes))throw new Error('Bad member');
    const raw=atob(member.body_base64);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
    if(bytes.length>65536||bytes.length!==member.bytes||btoa(raw)!==member.body_base64)throw new Error('Bad encoding');
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(digest!==member.sha256)throw new Error('Digest mismatch');
    const headers={'content-type':'application/octet-stream','x-content-type-options':'nosniff','content-disposition':`attachment; filename="${path.split('/').at(-1)}"`,'cache-control':'public, max-age=300','etag':`"${digest}"`,'x-csoai-evidence-state':'HISTORICAL_INVALID_NOT_A_VALID_PROOF','x-csoai-content-sha256':digest};
    return new Response(request.method==='HEAD'?null:bytes,{headers});
  }catch{return new Response('Historical evidence failed exact-byte verification',{status:503});}
}
