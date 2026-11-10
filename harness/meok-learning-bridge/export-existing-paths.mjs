// Offline execution of the pinned existing pure path/module builders only.
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const board=JSON.parse(fs.readFileSync('source/board.json','utf8'));
const publicModules=JSON.parse(fs.readFileSync('source/hitl-modules.json','utf8'));
const pathRaw=fs.readFileSync('source/learning-paths.ts','utf8');
const importLine='import BOARD_SNAPSHOT from "../../../public/signed/gspc-board.2026-09-29.signed.json";';
if(pathRaw.split(importLine).length!==2)throw Error('Unknown path-builder import contract');
// Only the snapshot-loading boundary is adapted; the functions are unchanged.
const pathSource=pathRaw.replace(importLine,'const BOARD_SNAPSHOT='+JSON.stringify(board)+';');
const importTS=async s=>import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(s)).toString('base64'));
const pathsModule=await importTS(pathSource);
const hitlRaw=fs.readFileSync('source/hitl-logic.ts','utf8');
const pattern=/import \{\s*BOARD_ATTESTATION_DID,\s*canonicalBytes,\s*sha256Hex,\s*signPayload,\s*verifyLeaf,\s*\} from "\.\.\/_lib\/cardSign";/;
if(!pattern.test(hitlRaw))throw Error('Unknown signing import boundary');
const blocked='const BOARD_ATTESTATION_DID="UNUSED_OFFLINE"; const forbidden=()=>{throw Error("SIGNING_NOT_PERMITTED_IN_LEARNING_EXPORT")}; const canonicalBytes=forbidden,sha256Hex=forbidden,signPayload=forbidden,verifyLeaf=forbidden;';
const hitl=await importTS(hitlRaw.replace(pattern,blocked));
const paths=pathsModule.buildLearningPaths(board);
const modules=hitl.deriveModules(board);
if(paths.length!==34||modules.length!==34||publicModules.count!==34)throw Error('Roster drift: retain report and review before updating expected count');
let answerChecks=0,progressChecks=0;
for(const m of modules){
 const shown=publicModules.modules.find(x=>x.axis===m.axis);if(!shown)throw Error('Missing public module');
 const projected=hitl.publicModule(m); const {completed:ignored,...publicWithoutProgress}=shown;
 const {completed:defaultCompleted,...expectedWithoutProgress}=projected;
 if(JSON.stringify(publicWithoutProgress)!==JSON.stringify(expectedWithoutProgress))throw Error('Public/source module mismatch: '+m.axis);
 for(const option of m.options){const result=hitl.checkAnswer(board,m.id,option.id);if(result.correct!==(option.id===m.correct_option))throw Error('Answer mismatch');answerChecks++;}
 const valid=pathsModule.deriveLearningProgress(m.axis,['learn','play'],paths);
 const bad=pathsModule.deriveLearningProgress(m.axis,['human-review'],paths);
 if(!valid.valid||bad.valid||valid.evidence.candidateFindingCreated||bad.evidence.signedRecordCreated)throw Error('Progress boundary mismatch');progressChecks+=2;
}
fs.mkdirSync('learning_assets',{recursive:true});
fs.writeFileSync('learning_assets/source-paths.json',JSON.stringify(paths,null,2)+'\n');
fs.writeFileSync('learning_assets/source-reading-checks.json',JSON.stringify(modules,null,2)+'\n');
const report={state:'EXISTING_PURE_BUILDERS_REPRODUCED',source_repository:'CSOAI-ORG/councilof-ai',source_revision:'ca5ff304cf1766ee73d84c49fc684631deaae113',path_source_sha256:hash(pathRaw),hitl_source_sha256:hash(hitlRaw),board_bytes_sha256:hash(fs.readFileSync('source/board.json')),axes:paths.length,stages:paths.reduce((n,p)=>n+p.stages.length,0),answer_checks:answerChecks,progress_checks:progressChecks,public_module_equivalence:true,legacy_completed_flags_ignored:true,network_calls_from_builders:0,signing_calls:0,public_hitl_posts:0,adaptation:'Existing executable function bodies retained; snapshot import replaced with held board; signing imports replaced by throwing sentinels; TS types stripped by Node.'};
fs.writeFileSync('learning_assets/source-builder-proof.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
