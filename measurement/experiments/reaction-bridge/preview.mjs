// SPDX-License-Identifier: Apache-2.0
// Browser preview runs entirely locally; no network access, storage, upload or execution.
import { summarizeReactionCases, renderOperatingView } from "./operating-view.mjs";
const byId=(id)=>document.getElementById(id);
const source=byId("cases"),output=byId("result");
const H="a".repeat(64),M="b".repeat(64);
const example=[{schema:"csoai.reaction-experiment/0.1",realm:"SIMULATED",
  condition:"NO_HUMAN",experiment_id:"synthetic-example",case_id:"case-1",
  input_sha256:H,method_sha256:M,stages:{}}];
byId("review").addEventListener("click",()=>{
  try {
    if (source.value.length>262144) throw new Error("example input exceeds 256 KiB");
    const parsed=JSON.parse(source.value);
    output.textContent=renderOperatingView(summarizeReactionCases(parsed));
  } catch(error) {
    output.textContent="REVIEW REFUSED: "+(error instanceof Error?error.message:"invalid input")+
      "\nNo acceptance, execution, signature or external verification was performed.";
  }
});
byId("sample").addEventListener("click",()=>{
  source.value=JSON.stringify(example,null,2);
  output.textContent="Synthetic example loaded. Select Review supplied pointers to see the explicit missing stages.";
});
byId("clear").addEventListener("click",()=>{
  source.value=""; output.textContent="Cleared. No analysis run.";
});