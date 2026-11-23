// Read-only public display. Do not infer legal applicability or reviewer staffing from reads.
(() => {
  "use strict";
  const q = id => document.getElementById(id);
  const text = (id, value) => { if (q(id)) q(id).textContent = String(value); };
  const read = async path => {
    const response = await fetch(path, {credentials:"omit",cache:"no-store",headers:{accept:"application/json"}});
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  };
  const checked = async (task, fallback) => { try { await task(); } catch { fallback(); } };
  const add = (node, tag, value, cls) => {
    const child=document.createElement(tag); child.textContent=String(value ?? "");
    if(cls) child.className=cls; node.appendChild(child); return child;
  };
  async function refresh() {
    await Promise.all([
      checked(async () => {
        const board=await read("/api/gspc");
        const totals=board?.totals;
        if(!totals || !Number.isFinite(totals.axes) || !Number.isFinite(totals.measured_axes)) throw Error("schema");
        text("gspc", totals.public_count || (totals.axes+" axes · "+totals.measured_axes+" measured"));
        text("gspc-note", (totals.separation_public_count || "No public separation summary") + " · source /api/gspc; dated measurements, not new tests.");
      },()=>{text("gspc","UNVERIFIED");text("gspc-note","The board could not be read; not an outage determination.");}),
      checked(async () => {
        const ptr=await read("/interop/regulatory-inventory-latest.json");
        if(ptr?.schema!=="csoai.regulatory-inventory-pointer/1") throw Error("schema");
        text("inventory",ptr.versioned_at ? "Snapshot "+ptr.versioned_at.slice(0,10):"Undated snapshot");
        text("inventory-note",String(ptr.crosswalk_assets??"Unknown")+" heterogeneous assets · not signed legal determinations. Source /interop/regulatory-inventory-latest.json.");
      },()=>{text("inventory","UNVERIFIED");text("inventory-note","Inventory pointer not readable from this client.");}),
      checked(async () => {
        const wg=await read("/working-groups/catalog.json");
        if(!Array.isArray(wg?.documents)) throw Error("schema");
        const drafts=wg.documents.filter(v=>v.status==="draft").length;
        text("groups", drafts+" draft proposal"+(drafts===1?"":"s"));
        text("groups-note","Catalog as of "+(wg.asOf||"unspecified")+"; none of these records establishes human acceptance or external authority.");
      },()=>{text("groups","UNVERIFIED");text("groups-note","Catalogue could not be read, not evidence that groups are closed.");}),
      checked(async () => {
        const graph=await read("/interop/governance-dependency-projection.json");
        if(graph?.schema!=="csoai.governance-dependency-projection/0.1" || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges) ||
           graph.counts?.total_nodes!==graph.nodes.length || graph.counts?.total_edges!==graph.edges.length ||
           graph.controls?.human_authority_conferred!==false) throw Error("graph contract");
        text("graph",graph.counts.total_nodes+" nodes · "+graph.counts.total_edges+" links");
        text("graph-note",graph.counts.working_groups+" Council group references · "+graph.counts.gspc_axis_references+" GSPC axis references · "+graph.counts.external_source_references+" external source references. All candidate mappings; no delegated authority.");
      },()=>{text("graph","UNVERIFIED");text("graph-note","Dependency projection cannot be verified from this client.");}),
      checked(async () => {
        const research=await read("/working-groups/controlai.json");
        if(research?.schema!=="csoai.research-evidence-pack/1" || research.status!=="research-candidate" ||
           research.authorityGranted!==false || research.partnershipEstablished!==false ||
           !Array.isArray(research.claims)) throw Error("research authority contract");
        const toUTC = raw => {
          if(typeof raw!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
          const time=Date.parse(raw+"T00:00:00Z");
          return Number.isFinite(time) && new Date(time).toISOString().slice(0,10)===raw ? time : null;
        };
        const end=toUTC(research.reviewAfter), observed=toUTC(research.asOf);
        if(end===null || observed===null || end<observed) throw Error("research dates not verified");
        const now=new Date(), today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
        const active=research.claims.filter(c=>c.status==="source-reported" || c.status==="observed");
        if(!active.length) throw Error("no reviewable claims");
        let expired=0;
        for(const claim of active){
          const limit=toUTC(claim.reviewAfter);
          if(limit===null) throw Error("bad claim review date");
          if(today>=limit) expired++;
        }
        const due=today>=end || expired>0;
        text("research", due ? "RECHECK REQUIRED" : "REVIEW WINDOW ACTIVE");
        text("research-note", research.id+" · "+expired+" of "+active.length+" active claims require recheck · pack review after "+research.reviewAfter+" · no human approval inferred.");
      },()=>{text("research","UNVERIFIED");text("research-note","Research source date or authority state could not be verified; no renewal assumed.");}),
      checked(async () => {
        const doc=await read("/interop/regulatory-window-research-20261122.json");
        if(doc?.schema!=="csoai.regulatory-window-research/0.1" || !Array.isArray(doc.windows)) throw Error("schema");
        const list=q("windows");list.replaceChildren();
        const today=new Date(), day=Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate());
        for (const w of doc.windows) {
          if(!/^\d{4}-\d{2}-\d{2}$/.test(w.date) || !String(w.source_url).startsWith("https://")) continue;
          const ms=Date.parse(w.date+"T00:00:00Z");if(!Number.isFinite(ms)) continue;
          const li=add(list,"li","","window");
          const days=Math.round((ms-day)/86400000);
          add(li,"span",w.date,"date");
          add(li,"span", days<0 ? "Date passed; re-check status" : days===0 ? "Date today" : days+" days until date","state");
          add(li,"h3",w.title);
          add(li,"p",w.scope,"meta");
          const link=add(li,"a","Official reference");
          link.href=w.source_url;link.rel="noopener noreferrer";link.target="_blank";
        }
        if(!list.children.length)add(list,"li","No validated reference dates available.");
      },()=>{q("windows").replaceChildren();add(q("windows"),"li","UNVERIFIED: dated research reference unavailable.");}),
    ]);
  }
  document.addEventListener("DOMContentLoaded",()=>{
    q("refresh")?.addEventListener("click",refresh);
    refresh();
  });
})();
