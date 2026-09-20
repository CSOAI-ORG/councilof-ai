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
