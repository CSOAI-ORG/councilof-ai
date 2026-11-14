/** Retained prototype drafts are not approved outbound messages or public measured evidence. */
import {readFileSync,existsSync,readdirSync} from 'node:fs';import {join,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
export function unsafeDraft(doc){return doc&&typeof doc==='object'&&(typeof doc.draft_body==='string'||doc.kind==='outreach-send-staged'||doc.schema==='csoai.outreach-send/0.1');}
export function checkOutreachDrafts(publicRoot){
 const dir=join(resolve(publicRoot),'interop/three-loops'),bad=[];
 if(existsSync(dir))for(const file of readdirSync(dir)){if(!file.endsWith('.json'))continue;const doc=JSON.parse(readFileSync(join(dir,file),'utf8'));if(unsafeDraft(doc))bad.push(file);}
 if(bad.length)throw new Error('UNAPPROVED_DRAFT_IN_SERVED_TREE: '+bad.join(', '));
 return {state:'PASS',scope:'No raw outreach staging draft under served three-loops artifacts',outreach_authorised:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(checkOutreachDrafts(process.argv[2]??'public')));
