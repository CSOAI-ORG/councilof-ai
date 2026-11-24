// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import ReactionResearchReview from "./ReactionResearchReview";

const receipt="a".repeat(64),method="b".repeat(64);
const episode={
  schema:"csoai.reaction-experiment/0.1",realm:"SIMULATED",condition:"NO_HUMAN",
  experiment_id:"synthetic-example",case_id:"test-1",input_sha256:receipt,method_sha256:method,stages:{}
};
let holder:HTMLDivElement, root:Root;
async function render() {
  await act(async ()=>{ root.render(<ReactionResearchReview/>); });
}
async function click(text:string) {
  const button=[...holder.querySelectorAll("button")].find(b=>b.textContent?.includes(text));
  if(!button)throw new Error("No button "+text);
  await act(async()=>{button.dispatchEvent(new MouseEvent("click",{bubbles:true}));});
}
async function setTextarea(value:string) {
  const node=holder.querySelector("textarea");
  if(!node)throw new Error("No textarea");
  const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;
  if(!setter)throw new Error("No native textarea value setter");
  await act(async()=>{
    setter.call(node,value);
    node.dispatchEvent(new Event("input",{bubbles:true}));
  });
}
function result(){return holder.querySelector('pre[role="status"]')?.textContent||"";}
beforeEach(()=>{
  holder=document.createElement("div");
  document.body.appendChild(holder);
  root=createRoot(holder);
  (globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
});
afterEach(async()=>{
  await act(async()=>root.unmount());
  holder.remove();
  vi.restoreAllMocks();
});
describe("CouncilOS local-only reaction viewer user journey",()=>{
  it("renders collapsed and unknown, then loads and reviews a synthetic example",async()=>{
    await render();
    expect(holder.querySelector("details")?.hasAttribute("open")).toBe(false);
    expect(result()).toContain("All acceptance states remain unknown");
    await click("Load synthetic example");
    expect(holder.querySelector("textarea")?.value).toContain("SIMULATED");
    await click("Review reported stages");
    expect(result()).toContain("UNQUALIFIED INPUT");
    expect(result()).toContain("SIMULATION_ONLY");
    expect(result()).toContain("independently qualified: UNKNOWN");
    await click("Clear local input");
    expect(holder.querySelector("textarea")?.value).toBe("");
    expect(result()).toContain("Cleared");
  });
  it("refuses a malformed record without producing an approval",async()=>{
    await render();
    await setTextarea(JSON.stringify([{schema:"bad"}]));
    await click("Review reported stages");
    expect(result()).toMatch(/REVIEW REFUSED/);
    expect(result()).toContain("Nothing was accepted");
  });
  it("never submits the user's content over network or form actions",async()=>{
    const fetchSpy=vi.spyOn(globalThis,"fetch");
    await render();
    await setTextarea(JSON.stringify([episode]));
    await click("Review reported stages");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(holder.querySelector("form")).toBeNull();
  });
});
