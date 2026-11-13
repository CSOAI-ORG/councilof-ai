// @vitest-environment jsdom
import {act,createRef} from "react";
import {createRoot} from "react-dom/client";
import {test,expect,vi} from "vitest";
import TalkPanel,{type TalkPanelHandle} from "./TalkPanel";
test("real model selector sends cloud question directly, switches to local without server fallback",async()=>{
 vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true);window.history.replaceState(null,"","/");
 Object.defineProperty(HTMLElement.prototype,"scrollIntoView",{configurable:true,value:vi.fn()});
 const fetcher=vi.fn(async(_url: RequestInfo | URL, _init?: RequestInit)=>Response.json({model:"overlay-actual",choices:[{message:{content:"A useful answer"},finish_reason:"stop"}]}));vi.stubGlobal("fetch",fetcher);
 const node=document.createElement("div");document.body.append(node);const root=createRoot(node),ref=createRef<TalkPanelHandle>();
 try{
  await act(async()=>root.render(<TalkPanel ref={ref} hideSuggestions/>));
  const mode=node.querySelector<HTMLSelectElement>('[data-ai="mode"]')!;
  await act(async()=>{mode.value="cloud";mode.dispatchEvent(new Event("change",{bubbles:true}));});
  expect(fetcher).not.toHaveBeenCalled();
  await act(async()=>{ref.current!.ask("Help me make a plan");await new Promise(r=>setTimeout(r,800));});
  expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0][0]).toContain("hf.space/v1/chat/completions");
  expect(node.textContent).toContain("A useful answer");expect(node.textContent).toContain("AI generated");
  await act(async()=>{mode.value="offline";mode.dispatchEvent(new Event("change",{bubbles:true}));});
  expect(node.textContent).toContain("tool execution is off");expect(node.querySelector('[aria-label="Speak your question"]')).toBeNull();
  // Cancel the absent extension request: no HTTP fallback and no public tool POST is permitted.
  await act(async()=>ref.current!.ask("Keep this offline"));
  expect(fetcher).toHaveBeenCalledTimes(1);
 }finally{await act(async()=>root.unmount());node.remove();vi.unstubAllGlobals();}
});
