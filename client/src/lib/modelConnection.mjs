import {PROVIDERS, selection, createAIExecutor} from "../../../extensions/chrome-gspc-verify/lib/ai-runtime.mjs";
// One protocol for the native offline workspace, MEOK and Council. No secrets in this client.
export const DEFAULT_MODEL = null;
export function bridge(action, payload = {}, {signal, onDelta = () => {}, timeout = 120000} = {}) {
  return new Promise((resolve,reject) => {
    const id=crypto.randomUUID(), native=globalThis.location?.protocol === "chrome-extension:";
    let port, done=false;
    const finish=(error,value) => { if(done)return; done=true; clearTimeout(timer); signal?.removeEventListener("abort",abort); if(native)port?.disconnect();else window.removeEventListener("message",receive); error?reject(error):resolve(value); };
    const send=msg => native ? port.postMessage(msg) : window.postMessage({channel:"meok-ai-request-v1",...msg},location.origin);
    const abort=() => {try{send({id,action:"cancel"});}catch{} finish(Error("Reading stopped. Provider cancellation is unconfirmed."));};
    const accept=msg => {if(done||msg?.id!==id)return; if(msg.error)finish(Error(String(msg.error).slice(0,240)));else if("result" in msg)finish(null,msg.result);else if(typeof msg.delta==="string")onDelta(msg.delta);};
    const receive=event => {if(event.source===window&&event.origin===location.origin&&event.data?.channel==="meok-ai-response-v1")accept(event.data);};
    const timer=setTimeout(() => {try{send({id,action:"cancel"});}catch{}finish(Error("AI connection timed out. No fallback was tried. Open the extension AI workspace."));},timeout);
    try {
      if(native){port=chrome.runtime.connect({name:"meok-ai-v1"});port.onMessage.addListener(accept);port.onDisconnect.addListener(() => finish(Error("AI connection ended. No fallback was tried.")));}
      else window.addEventListener("message",receive);
      signal?.addEventListener("abort",abort,{once:true});
      if(signal?.aborted)return abort();
      send({...payload,id,action});
    }catch{finish(Error("The AI connection is unavailable."));}
  });
}
export async function askModel(choice, question, {history=[],signal,onDelta=()=>{},maxTokens=384} = {}) {
  const chosen=selection({...choice});
  if(chosen.transport==="extension")return bridge("chat",{selection:chosen,question,history,maxTokens},{signal,onDelta});
  // Direct web transport is an explicit keyless MEOK cloud preset, never a fallback.
  const status=await bridge("status",{},{timeout:700}).catch(()=>null);
  if(status?.offline)throw Error("Offline AI is locked in the extension. Open its AI workspace to enable cloud access.");
  return createAIExecutor().chat({choice:chosen,question,history,signal,onDelta,maxTokens});
}
export function mountAIControls(root,{onChange=()=>{},tools=true}={}) {
  root.innerHTML='<details><summary>AI connection · local, cloud &amp; offline</summary><fieldset><legend>AI connection</legend><label>Where work runs <select data-ai="mode"></select></label> <label>AI provider <select data-ai="provider"></select></label> <label>Model <input data-ai="model" maxlength="200" autocomplete="off" placeholder="Choose an installed or provider model"></label> <label>Connection <select data-ai="transport"><option value="web">Website · MEOK cloud only</option><option value="extension">Installed connection</option></select></label> <label><input type="checkbox" data-ai="context"> Include recent conversation</label> <button type="button" data-ai="models">Find models</button> <button type="button" data-ai="settings">Connection settings</button> <a href="https://councilof.ai/downloads/gspc-verify-0.2.0.zip">Get the local connection</a><p data-ai="status" role="status"></p><p>Local AI uses an already installed Ollama chat model. Offline AI blocks cloud model requests in this connection; it does not disconnect other apps or this website. The extension AI workspace opens without the websites. Provider accounts may incur their own charges. Model text cannot execute tools or approve work.</p></fieldset></details>';
  const get=name=>root.querySelector('[data-ai="'+name+'"]'), mode=get("mode"),provider=get("provider"),model=get("model"),transport=get("transport"),note=get("status"),context=get("context");
  const option=(select,id,label)=>{const el=document.createElement("option");el.value=id;el.textContent=label;select.appendChild(el);};
  if(tools)option(mode,"tools","Published Council tools");
  option(mode,"cloud","Cloud AI"); option(mode,"local","Local AI");option(mode,"offline","Offline AI");
  let locked=false, disposed=false, selected=null, chosenModels={}, modelList;
  function providers(){
    provider.replaceChildren();
    for(const [id,c] of Object.entries(PROVIDERS))if(c.local===(mode.value==="local"||mode.value==="offline"))option(provider,id,c.label);
    provider.value=mode.value==="cloud"?"meok-cloud":"ollama";
    model.value=chosenModels[provider.value]||(provider.value==="meok-cloud"?"default":"");
    transport.value=provider.value==="meok-cloud"?"web":"extension";
  }
  function changed(){
    const isTools=mode.value==="tools";
    for(const el of [provider,model,transport,context,get("models")])el.disabled=isTools;
    if(!isTools){if(provider.value!=="meok-cloud")transport.value="extension";if(mode.value==="offline")transport.value="extension";}
    selected=isTools?null:{provider:provider.value,model:model.value.trim(),offline:mode.value==="offline",includeContext:context.checked,transport:transport.value};
    note.textContent=isTools?"Public Council tools use their existing request and approval path.":locked&&mode.value==="cloud"?"Cloud AI is locked. Enable online AI in connection settings.":(mode.value==="offline"?"Offline AI · installed local model required.":"Chosen provider only · no automatic fallback.");
    onChange(selected?{...selected}:null);
  }
  const refresh=()=>{providers();changed();};
  mode.addEventListener("change",refresh);provider.addEventListener("change",()=>{model.value=chosenModels[provider.value]||(provider.value==="meok-cloud"?"default":"");transport.value=provider.value==="meok-cloud"?"web":"extension";changed();});
  for(const el of [model,transport,context])el.addEventListener("change",()=>{chosenModels[provider.value]=model.value;changed();});
  model.addEventListener("input",changed);
  get("settings").onclick=()=>bridge("settings",{},{timeout:3000}).then(()=>{note.textContent="Opened the extension AI workspace. Grant provider access there, then return.";}).catch(()=>{note.textContent="Install or load the local connection, then open its AI workspace from the extension popup.";});
  get("models").onclick=async()=>{get("models").disabled=true;try{
    const rows=selected?.transport==="web"?[{id:"default",label:"MEOK cloud overlay"}]:await bridge("models",{provider:provider.value},{timeout:30000});
    if(disposed)return;modelList?.remove();modelList=document.createElement("select");modelList.setAttribute("aria-label","Available models");option(modelList,"","Choose a model");
    for(const row of rows)option(modelList,row.id,row.label||row.id);
    model.after(modelList);modelList.onchange=()=>{model.value=modelList.value;chosenModels[provider.value]=model.value;changed();};note.textContent=rows.length+" models available. Choose one before asking.";
  }catch(e){if(!disposed)note.textContent=e.message;}finally{if(!disposed)get("models").disabled=false;}};
  refresh();
  const refreshStatus=()=>bridge("status",{},{timeout:700}).then(status=>{if(disposed)return;locked=status.offline;if(locked){mode.value="offline";providers();changed();}else note.textContent=status.allowed?"Installed connection ready.":"Allow this site in connection settings before using local or account providers.";}).catch(()=>{});
  refreshStatus();window.addEventListener("focus",refreshStatus);
  return {getSelection:()=>selected?{...selected}:null,setDisabled:value=>{get("mode").disabled=value;for(const el of root.querySelectorAll("input,select,button"))el.disabled=value; if(!value)changed();},destroy:()=>{disposed=true;window.removeEventListener("focus",refreshStatus);root.replaceChildren();}};
}
