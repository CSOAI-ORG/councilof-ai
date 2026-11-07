import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'packages/council-panel');
const vendor=path.join(source,'vendor/mcp-apps-2.0.4.mjs');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
if(digest(fs.readFileSync(vendor))!=='d24b6ae50dbc989539db8287e217f41f0833f2b0a81ac4c6dbde444715ef5cd0')throw new Error('Pinned MCP Apps SDK bytes changed.');
const result=await build({entryPoints:[path.join(source,'app.ts')],bundle:true,write:false,minify:true,format:'esm',target:'es2022',legalComments:'inline'});
const js=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const template=fs.readFileSync(path.join(source,'panel.html'),'utf8');
if(template.split('/* PANEL_SCRIPT */').length!==2)throw new Error('Expected one inline script slot.');
const html=template.replace('/* PANEL_SCRIPT */',()=>js);
const resource={uri:'ui://council/live-panel/2',mimeType:'text/html;profile=mcp-app',version:'0.2.0',sha256:digest(html),text:html};
const outputs=new Map([['public/native-panel/index.html',html],['public/native-panel/resource.json',JSON.stringify(resource)+'\n']]);
if(process.argv.includes('--check')){
 for(const [relative,text]of outputs)if(!fs.existsSync(path.join(root,relative))||fs.readFileSync(path.join(root,relative),'utf8')!==text)throw new Error('Native panel artifact drift: '+relative);
}else{
 for(const [relative,text]of outputs){fs.mkdirSync(path.dirname(path.join(root,relative)),{recursive:true});fs.writeFileSync(path.join(root,relative),text);}
}
console.log(JSON.stringify({state:process.argv.includes('--check')?'MATCH':'GENERATED',html_sha256:resource.sha256,html_bytes:Buffer.byteLength(html),external_scripts:0,sdk:'@modelcontextprotocol/ext-apps@2.0.4'}));
