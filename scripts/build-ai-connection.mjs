// Generated public MEOK client and the extension-native client share one source.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {build} from "esbuild";
const source=readFileSync("client/src/lib/modelConnection.mjs","utf8");
const native=source.replace('../../../extensions/chrome-gspc-verify/lib/ai-runtime.mjs','./ai-runtime.mjs');
const check=process.argv.includes("--check");
async function emit(path,content){if(check){if(readFileSync(path,"utf8")!==content)throw Error("Regenerate "+path);}else writeFileSync(path,content);}
await emit("extensions/chrome-gspc-verify/lib/ai-client.mjs",native);
const result=await build({stdin:{contents:source+"\nexport const version='0.2.0';",resolveDir:process.cwd()+"/client/src/lib",sourcefile:"modelConnection.mjs"},bundle:true,format:"iife",globalName:"MEOKAI",write:false,minify:true,target:"es2022",legalComments:"none"});
mkdirSync("public/downloads",{recursive:true});
await emit("public/downloads/meok-ai-connection.js",result.outputFiles[0].text);
