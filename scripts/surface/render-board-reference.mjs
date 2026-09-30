/** One exact board response per render. No recorded-count fallback and no second live fetch.
 * This receipt binds the reference to build assets and the completed render report;
 * it does not authenticate the publisher or make the rendered counts fresh forever.
 */
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function boardCounts(raw){
 if(raw.length>2_000_000)throw Error('BOARD_RESPONSE_SIZE_LIMIT');let d;try{d=JSON.parse(raw);}catch{throw Error('BOARD_RESPONSE_NOT_JSON');}
 if(!d||typeof d!=='object'||!Array.isArray(d.axes)||!d.totals||typeof d.totals!=='object')throw Error('BOARD_RESPONSE_SHAPE');
 const ids=new Set();let measured=0;
 for(const row of d.axes){if(!row||typeof row.axis!=='string'||!row.axis||ids.has(row.axis)||typeof row.status!=='string')throw Error('BOARD_AXIS_ID_OR_STATE');ids.add(row.axis);if(row.status==='MEASURED')measured++;}
 const count=d.totals.axes,m=d.totals.measured_axes;
 if(!Number.isSafeInteger(count)||count<1||count!==ids.size||!Number.isSafeInteger(m)||m!==measured||m>count)throw Error('BOARD_TOTALS_ROW_MISMATCH');
 return {axes:count,measured_axes:m,public_count:typeof d.totals.public_count==='string'?d.totals.public_count:null};
}
function assets(dist){
 const dir=path.resolve(dist,'assets');if(!fs.existsSync(dir))throw Error('BUILD_ASSETS_MISSING');const list={};
 for(const name of fs.readdirSync(dir).sort()){if(!/\.(js|css)$/.test(name))continue;const p=path.join(dir,name),st=fs.lstatSync(p);if(st.isSymbolicLink()||!st.isFile())throw Error('UNSAFE_BUILD_ASSET');list['assets/'+name]=sha(fs.readFileSync(p));}
 if(!Object.keys(list).length)throw Error('NO_BUILD_SCRIPT_ASSETS');return list;
}
export function makeBoardReference(raw,dist,sourceUrl){
 const counts=boardCounts(raw),u=new URL(sourceUrl);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/api/gspc'||u.search||u.hash)throw Error('INVALID_BOARD_REFERENCE_ORIGIN');
 const root=path.join(dist,'root.json');return {schema:'csoai.render-board-reference/1',state:'CAPTURED_NOT_RENDERED',observed_at:new Date().toISOString(),source_url:u.href,board_sha256:sha(raw),board_base64:Buffer.from(raw).toString('base64'),counts,build_assets:assets(dist),signed_root_file_sha256:fs.existsSync(root)?sha(fs.readFileSync(root)):null,publisher_authenticated:false,production_verified:false};
}
export async function captureBoardReference(dist,sourceUrl,out,{fetcher=fetch}={}){
 const response=await fetcher(sourceUrl,{headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error('BOARD_REFERENCE_HTTP_OR_CONTENT_TYPE');
 const reader=response.body?.getReader();if(!reader)throw Error('BOARD_REFERENCE_EMPTY');const parts=[];let bytes=0;
 try{while(true){const item=await reader.read();if(item.done)break;bytes+=item.value.length;if(bytes>2_000_000){await reader.cancel();throw Error('BOARD_RESPONSE_SIZE_LIMIT');}parts.push(Buffer.from(item.value));}}finally{reader.releaseLock();}
 const raw=Buffer.concat(parts),doc=makeBoardReference(raw,dist,sourceUrl);fs.writeFileSync(out,JSON.stringify(doc,null,2)+'\n');return raw;
}
/* ── the board of THIS commit, not of whichever deploy is live (28 Sep 2026) ──────────────────
 * captureBoardReference above freezes the LIVE origin's answer. The live origin is the board of
 * whatever deployment is serving production at that moment — the previous deploy, or one pushed
 * from outside the pipeline — so a build could bake a board its own commit does not serve (deploy
 * 44340409: "2 tied, 12 untested" beside an /api/gspc that said 8 TIE · 6 UNTESTED).
 * resolveBoardReference makes the commit the authority. The live bytes are served only when they
 * are the SAME board as the commit's own Function output (compared with the signature envelope
 * removed), because then they carry a real site signature over a board this commit agrees with.
 * Otherwise the commit's own bytes are served, unsigned, and the reference says why. There is no
 * third path: never a remembered board, never a live board that differs. */
const canonical=o=>o===null||typeof o!=='object'?JSON.stringify(o):Array.isArray(o)?'['+o.map(canonical).join(',')+']':'{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';
/** The board with the edge-signature envelope removed: site_attestation, and the living_stamp the
 * signer writes into measured_on only when a key is present. Everything a page renders stays in. */
export function boardBody(raw){let d;try{d=JSON.parse(Buffer.isBuffer(raw)?raw.toString('utf8'):raw);}catch{throw Error('BOARD_RESPONSE_NOT_JSON');}
 if(!d||typeof d!=='object')throw Error('BOARD_RESPONSE_SHAPE');const c={...d};delete c.site_attestation;if(c.measured_on&&typeof c.measured_on==='object'){c.measured_on={...c.measured_on};delete c.measured_on.living_stamp;}return canonical(c);}
export function sameBoard(a,b){return boardBody(a)===boardBody(b);}
/** The separation figures every headline prints, read from totals (the Function's one derivation). */
export function separationCounts(raw){const t=JSON.parse(Buffer.isBuffer(raw)?raw.toString('utf8'):raw).totals||{};const n=v=>Number.isSafeInteger(v)?v:null;
 return {comparison_axes:n(t.comparison_axes),separated_leads:n(t.separated_leads),ties:n(t.ties),untested_separations:n(t.untested_separations),public_leader_count:n(t.public_leader_count),lid:typeof t.lid==='string'?t.lid:null,separation_public_count:typeof t.separation_public_count==='string'?t.separation_public_count:null};}
async function readLive(sourceUrl,fetcher){
 const response=await fetcher(sourceUrl,{headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error(`BOARD_REFERENCE_HTTP_OR_CONTENT_TYPE ${response.status}`);
 const buf=Buffer.from(await response.arrayBuffer());if(buf.length>2_000_000)throw Error('BOARD_RESPONSE_SIZE_LIMIT');boardCounts(buf);return buf;
}
/**
 * commitRaw: the exact body this commit's functions/api/gspc.ts returns (scripts/surface/commit-board.mjs).
 * Returns {raw, served_from, live_relation}; writes the reference file like captureBoardReference.
 */
export async function resolveBoardReference(dist,sourceUrl,out,{commitRaw,fetcher=fetch}={}){
 if(!commitRaw)throw Error('COMMIT_BOARD_REQUIRED');boardCounts(commitRaw);
 let live=null,live_relation;
 try{live=await readLive(sourceUrl,fetcher);live_relation=sameBoard(live,commitRaw)?'SAME_BOARD_AS_COMMIT':'DIFFERS_FROM_COMMIT';}
 catch(e){live_relation='UNREADABLE: '+String(e?.message||e).slice(0,160);}
 const useLive=live_relation==='SAME_BOARD_AS_COMMIT';const raw=useLive?live:commitRaw;
 const doc={...makeBoardReference(raw,dist,sourceUrl),
  served_from:useLive?'LIVE_ORIGIN_SAME_BOARD_AS_COMMIT':'COMMIT_FUNCTION_UNSIGNED',
  served_from_note:useLive?'The live origin answered the same board this commit computes (signature envelope aside); its signed bytes were served.':'The live origin did not answer this commit\'s board, so the commit\'s own functions/api/gspc.ts output was served. No build-time key: no site_attestation.',
  commit_board_sha256:sha(commitRaw),commit_separation:separationCounts(commitRaw),
  live_relation,live_board_sha256:live?sha(live):null,live_separation:live?separationCounts(live):null};
 fs.writeFileSync(out,JSON.stringify(doc,null,2)+'\n');
 return {raw,served_from:doc.served_from,live_relation};
}
export function finishBoardReference(file,reportPath){
 const doc=JSON.parse(fs.readFileSync(file,'utf8'));if(doc.state!=='CAPTURED_NOT_RENDERED')throw Error('BOARD_REFERENCE_WRONG_STATE');const raw=fs.readFileSync(reportPath),report=JSON.parse(raw);
 if(!Array.isArray(report)||!report.length||report.some(r=>r.err||(!r.ok&&!r.clientOnly&&!r.skipped404)))throw Error('BOARD_REFERENCE_RENDER_INCOMPLETE');
 const final={...doc,state:'BOUND_TO_COMPLETED_RENDER',completed_at:new Date().toISOString(),render_report_sha256:sha(raw),render_report_file:path.basename(reportPath)};fs.writeFileSync(file,JSON.stringify(final,null,2)+'\n');return final;
}
export function verifyBoardReference(file,dist){
 const doc=JSON.parse(fs.readFileSync(file,'utf8'));if(doc.schema!=='csoai.render-board-reference/1'||doc.state!=='BOUND_TO_COMPLETED_RENDER'||typeof doc.board_base64!=='string')throw Error('BOARD_REFERENCE_NOT_COMPLETED');
 const raw=Buffer.from(doc.board_base64,'base64');if(raw.toString('base64')!==doc.board_base64||sha(raw)!==doc.board_sha256)throw Error('BOARD_REFERENCE_DIGEST_MISMATCH');const counts=boardCounts(raw);
 if(JSON.stringify(counts)!==JSON.stringify(doc.counts))throw Error('BOARD_REFERENCE_COUNT_TAMPER');
 if(JSON.stringify(assets(dist))!==JSON.stringify(doc.build_assets))throw Error('BOARD_REFERENCE_BUILD_MISMATCH');
 const root=path.join(dist,'root.json');if((fs.existsSync(root)?sha(fs.readFileSync(root)):null)!==doc.signed_root_file_sha256)throw Error('BOARD_REFERENCE_ROOT_MISMATCH');
 if(typeof doc.render_report_file!=='string'||path.basename(doc.render_report_file)!==doc.render_report_file)throw Error('BOARD_REFERENCE_REPORT_PATH');const report=fs.readFileSync(path.join(path.dirname(file),doc.render_report_file));if(sha(report)!==doc.render_report_sha256)throw Error('BOARD_REFERENCE_REPORT_MISMATCH');
 return {counts,source:doc.source_url,board_sha256:doc.board_sha256,observed_at:doc.observed_at,scope:'EXACT_RENDER_REFERENCE_NOT_CURRENT_LIVE_OBSERVATION'};
}
