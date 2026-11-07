import {checkTransferMetadata} from './transfer-metadata-gate.mjs';
import {checkOutreachDrafts} from './outreach-draft-gate.mjs';
/** Pages Functions compile from the project root, not the public asset directory.
 * https://developers.cloudflare.com/pages/functions/get-started/#create-a-function
 */
import {existsSync} from 'node:fs';import {resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';
export function checkServingBoundary(dist){
 const root=resolve(dist);
 if(!existsSync(join(root,'index.html')))throw new Error('Built index missing');
 if(existsSync(join(root,'functions')))throw new Error('FUNCTION_SOURCE_IN_STATIC_ASSETS: compile project-root functions; do not publish the source-copy directory as static files');
 const metadata=checkTransferMetadata(root);
 const outreach=checkOutreachDrafts(root);
 return {state:'PASS',static_root:root,function_source_assets:0,outreach_draft_check:outreach.state,metadata_check:metadata.state,platform_compiler_still_required:true};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(checkServingBoundary(process.argv[2]??'dist/client')));
