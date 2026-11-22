import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildSync, transformSync } from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const approved=JSON.parse(read('client/src/data/blog-published.json')).published;
function loadPublication(){
 const output=buildSync({entryPoints:[path.join(root,'client/src/lib/publicationState.ts')],bundle:true,write:false,format:'cjs',platform:'node',alias:{'@':path.join(root,'client/src')}}).outputFiles[0].text;
 const module={exports:{}};vm.runInNewContext(output,{module,exports:module.exports});return module.exports;
}
const state=loadPublication();
test('every approved article overrides only the generic archived family',()=>{
 assert(approved.length>0);for(const row of approved){for(const suffix of ['','/','/?source=review','#source'])assert.equal(state.isWithdrawnPath('/blog/'+row.slug+suffix),false,row.slug+suffix);}
});
test('index and unknown or withdrawn articles stay withdrawn',()=>{
 for(const p of ['/blog','/blog/','/blog/proof-of-ai','/blog/not-an-approved-post'])assert.equal(state.isWithdrawnPath(p),true,p);
});
test('prefix aliases do not acquire a publication decision',()=>{
 const slug=approved[0].slug;for(const p of ['/blog/'+slug+'-unapproved','/blog/%2e%2e','/blog/'+encodeURIComponent(slug+'/other')])assert.equal(state.isWithdrawnPath(p),true,p);
});
test('each approved slug has an exact real route before the generic notice',()=>{
 const app=read('client/src/App.tsx');const fallback=app.indexOf('<Route path="/blog/:slug"');assert(fallback>=0);
 for(const row of approved){const start=app.indexOf('<Route path="/blog/'+row.slug+'"');assert(start>=0&&start<fallback,row.slug);assert(app.slice(start,app.indexOf('</Route>',start)).includes('<BlogPost '),row.slug);}
});
test('approved metadata has no missing record and does not require full article corpus',()=>{
 const rows=JSON.parse(read('client/src/data/blog-index.json')).posts;
 for(const row of approved)assert(rows.some(x=>x.slug===row.slug&&x.headline&&x.description),row.slug);
 assert(!read('client/src/lib/reviewedBlog.ts').includes('blog-content'));
});
test('the existing shared head uses the exception before withdrawal and allows page refinement',()=>{
 const s=read('client/src/lib/seoHead.ts');assert(s.indexOf('const reviewedPost = reviewedBlogRecord(p)')<s.indexOf('if (isWithdrawnPath(p))'));
 assert(s.includes('fitDescription(reviewedPost.description), "family"'));assert(s.includes('if (h.source === "family" || h.source === "derived") return () => {};'));
});
test('changed TypeScript modules parse without source mutation',()=>{
 for(const p of ['client/src/lib/seoHead.ts','client/src/lib/publicationState.ts','client/src/lib/reviewedBlog.ts'])assert(transformSync(read(p),{loader:'ts',format:'esm'}).code.length>0);
});
