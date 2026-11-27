/** Bounded private desk configuration, not a new staff identity or execution permission.
 * Reuses the Council signed-session and current account-incarnation contract.
 * Never lists legacy caller-owned records. No arbitrary persona or private memory is accepted.
 */
import { currentAccountGeneration, RESERVED_EMAILS, userKey, verifyToken, type AuthEnv } from "./_authCrypto";
import { DESK_IDS, DESKS, type DeskId } from "./_chatDesks";

export interface ProfileStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}
export interface ProfileEnv extends AuthEnv { PAL_MEMORY_KV?: ProfileStore }
const IDS = new Set<string>(DESK_IDS);
const scopeHash = async (sub: string, generation: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(["csoai.pal.owner-scope/1", sub, generation]))))].map(x => x.toString(16).padStart(2,"0")).join("");

export function privateDesk(id: string): DeskId | null {
  const desk = id.startsWith("private-") ? id.slice(8) : "";
  return IDS.has(desk) ? desk as DeskId : null;
}
type Result = {status:number; body:Record<string,unknown>};
const result = (status:number, body:Record<string,unknown>):Result => ({status,body});
async function owner(env:ProfileEnv, request:Request):Promise<{scope:string}|Result> {
  const header=request.headers.get("authorization")||"";
  if (!header.startsWith("Bearer ") || header.length>8192) return result(401,{error:"Current Council account sign-in required"});
  const identity=await verifyToken(env,header.slice(7));
  if (!identity?.account_generation || RESERVED_EMAILS.has(identity.sub)) return result(401,{error:"Current Council account sign-in required"});
  if (!env.SOV_ARENA_STATE) return result(503,{error:"Account store unavailable"});
  try {
    const raw=await env.SOV_ARENA_STATE.get(userKey(identity.sub));
    if (!raw) return result(401,{error:"Account no longer available"});
    const actual=await currentAccountGeneration(JSON.parse(raw),identity.sub);
    if (!actual) return result(503,{error:"Account lifecycle could not be qualified"});
    if(actual!==identity.account_generation)return result(401,{error:"Account lifecycle changed; sign in again"});
    return {scope:await scopeHash(identity.sub,actual)};
  } catch {return result(503,{error:"Account state could not be checked"});}
}
function record(desk:DeskId, scope:string) {
  return {schema:"csoai.pal-private-profile/1",id:"private-"+desk,desk,owner_scope:scope,state:"CONFIGURED_PROFILE_ONLY"};
}
function response(desk:DeskId) {
  return {schema:"csoai.pal-private-profile/1",id:"private-"+desk,desk,name:DESKS[desk].name,
    scope:DESKS[desk].role,state:"CONFIGURED_PROFILE_ONLY",visibility:"private",signed:false,
    memory_ready:false,execution_authority:false,chat_ready:false,disclosure:"This is an AI desk configuration, not a person or an appointed employee."};
}
export async function privateProfile(env:ProfileEnv,request:Request,desk:DeskId,mode:"read"|"create"):Promise<Result> {
  const auth=await owner(env,request);
  if ("status" in auth)return auth;
  const store=env.PAL_MEMORY_KV;
  if(!store)return result(503,{error:"Private staff profile store not bound"});
  const key="pal:private-profile:v1:"+auth.scope+":"+desk;
  const expected=JSON.stringify(record(desk,auth.scope));
  try {
    const raw=await store.get(key);
    if(raw!==null && raw!==expected)return result(409,{error:"Existing profile differs; review required"});
    if(raw===expected)return result(200,{...response(desk),readback_verified:true,created:false});
    if(mode==="read")return result(404,{error:"Private profile not found"});
  } catch {return result(503,{error:"Profile read unavailable; no write attempted"});}
  // One fixed record per account incarnation and canonical desk. Concurrent writes use
  // identical bytes; KV is not a CAS and this is not a global uniqueness guarantee.
  try {
    await store.put(key,expected);
    if(await store.get(key)!==expected)return result(503,{error:"Profile write unconfirmed; read before retrying",outcome:"UNKNOWN"});
  } catch {return result(503,{error:"Profile write unconfirmed; read before retrying",outcome:"UNKNOWN"});}
  return result(201,{...response(desk),readback_verified:true,created:true});
}
export function requestedPrivateDesk(value:unknown):DeskId|null {
  if(!value || typeof value!=="object" || Array.isArray(value))return null;
  const obj=value as Record<string,unknown>;
  return Object.keys(obj).length===1 && typeof obj.desk==="string" && IDS.has(obj.desk) ? obj.desk as DeskId : null;
}
