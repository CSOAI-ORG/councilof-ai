import {PROVIDERS} from "./lib/ai-runtime.mjs";
import {bridge,askModel,mountAIControls} from "./lib/ai-client.mjs";
const get=id=>document.getElementById(id),note=get("connection-note"),account=get("account-provider");
for(const [id,p] of Object.entries(PROVIDERS)){const o=document.createElement("option");o.value=id;o.textContent=p.label;account.append(o);}
const saved=await chrome.storage.local.get(["ai.offline","ai.sites"]);get("offline").checked=saved["ai.offline"]!==false;
for(const el of document.querySelectorAll('[name="site"]'))el.checked=saved["ai.sites"]?.includes(el.value)===true;
get("settings").onsubmit=async e=>{e.preventDefault();try{await bridge("configure",{offline:get("offline").checked,sites:[...document.querySelectorAll('[name="site"]:checked')].map(el=>el.value)});note.textContent="Saved. Return to a connected site or choose your model below.";window.dispatchEvent(new Event("focus"));}catch(e){note.textContent=e.message;}};
get("grant").onclick=async()=>{const p=PROVIDERS[account.value];try{if(!p.local&&get("offline").checked)throw Error("Save online AI settings before granting a cloud connection.");const allowed=await chrome.permissions.request({origins:[p.permission]});note.textContent=allowed?"Provider connection granted. Choose its model below.":"Provider connection was not granted.";}catch(e){note.textContent=e.message;}};
get("save-key").onclick=async()=>{try{await bridge("key",{provider:account.value,key:get("key").value});get("key").value="";note.textContent="Key saved in extension session memory.";}catch(e){note.textContent=e.message;}};
get("clear-key").onclick=async()=>{try{await bridge("key",{provider:account.value,key:""});get("key").value="";note.textContent="Key forgotten.";}catch(e){note.textContent=e.message;}};
const controls=mountAIControls(get("controls"),{tools:false});
let controller=null,history=[];
get("ask").onclick=async()=>{
  if(controller)return;const question=get("question").value.trim();if(!question)return;
  controller=new AbortController();const current=controller,choice=controls.getSelection();choice.transport="extension";
  controls.setDisabled(true);get("ask").disabled=true;get("answer").textContent="";get("provenance").textContent="Asking the selected model…";
  try{const result=await askModel(choice,question,{history:history.slice(-10),signal:current.signal,onDelta:text=>{if(controller===current&&!current.signal.aborted)get("answer").textContent+=text;}});
    if(current.signal.aborted)return;
    get("answer").textContent=result.content;get("provenance").textContent=result.provider+" · "+result.modelLabel+" · "+(result.offline?"offline AI":"online AI")+" · AI generated, not a GSPC measurement or signed evidence.";
    history.push({role:"user",content:question},{role:"assistant",content:result.content});history=history.slice(-10);
  }catch(e){get("provenance").textContent=e.message;}finally{if(controller===current)controller=null;controls.setDisabled(false);get("ask").disabled=false;}
};
get("stop").onclick=()=>controller?.abort();
get("clear").onclick=()=>{controller?.abort();history=[];get("question").value="";get("answer").textContent="";get("provenance").textContent="Conversation cleared. Nothing is stored.";};
