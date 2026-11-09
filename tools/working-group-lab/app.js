let state, docId, busy=false;
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
function message(text,error=false){$("status").textContent=text;$("status").className=error?"error":"";}
async function refresh(){
  const res=await fetch("/api/state");if(!res.ok)throw Error("Could not load local lab.");
  state=await res.json();docId ||= state.catalog.documents[0].id;
  $("document").replaceChildren(...state.catalog.documents.map(d=>{const opt=node("option",d.id+" · "+d.title);opt.value=d.id;return opt;}));
  $("document").value=docId;render();
}
function events(){return state.events.filter(e=>e.documentId===docId);}
function render(){
  const doc=state.catalog.documents.find(d=>d.id===docId), ev=events();
  $("proposal").replaceChildren(node("h3",doc.title),node("p",doc.summary),node("p","Public status: "+doc.status+" · v"+doc.version+". No review decision."));
  $("history").replaceChildren(...ev.map(e=>node("li","#"+e.seq+" · "+e.kind+" · "+e.at+" · local demo user (unverified)")));
  const hidden=new Map(ev.filter(e=>e.kind==="hide").map(e=>[e.payload.commentId,e.payload.reason]));
  const comments=ev.filter(e=>e.kind==="comment");
  $("comments").replaceChildren(...comments.map(e=>node("li",hidden.has(e.seq)?"#"+e.seq+" hidden in lab: "+hidden.get(e.seq):"#"+e.seq+" · "+e.payload.body)));
  $("comment-id").replaceChildren(node("option","Select a comment"),...comments.filter(e=>!hidden.has(e.seq)).map(e=>{const el=node("option","#"+e.seq);el.value=e.seq;return el;}));
  $("comment-id").options[0].value="";
}
async function save(payload){
  if(busy)return false;busy=true;
  document.querySelectorAll("button").forEach(b=>b.disabled=true);
  try{
    const res=await fetch("/api/events",{method:"POST",headers:{"Content-Type":"application/json","X-Council-Lab":"local-synthetic"},body:JSON.stringify({...payload,documentId:docId,expectedRevision:events().length})});
    const data=await res.json();
    if(!res.ok){await refresh();throw Error(data.error||"Local save failed.");}
    await refresh();message("Saved to the local lab only. No public submission or authority granted.");return true;
  }catch(e){message(e.message,true);return false;}
  finally{busy=false;document.querySelectorAll("button").forEach(b=>b.disabled=false);}
}
$("document").addEventListener("change",()=>{docId=$("document").value;$("body").value="";$("reason").value="";render();});
$("comment-form").addEventListener("submit",async e=>{e.preventDefault();if(await save({kind:"comment",body:$("body").value}))$("body").value="";});
$("hide-form").addEventListener("submit",async e=>{e.preventDefault();if(!$("comment-id").value){message("Select a comment first.",true);return;}if(await save({kind:"hide",commentId:Number($("comment-id").value),reason:$("reason").value}))$("reason").value="";});
$("export").addEventListener("click",()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="council-local-lab-events.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
refresh().then(()=>message("Ready for a synthetic local exercise.")).catch(e=>message(e.message,true));
