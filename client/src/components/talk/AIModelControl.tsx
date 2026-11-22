import {useEffect,useRef} from "react";
import {mountAIControls,type ModelSelection} from "../../lib/modelConnection.mjs";
export default function AIModelControl({onChange,disabled=false}:{onChange:(value:ModelSelection|null)=>void;disabled?:boolean}){
  const root=useRef<HTMLDivElement>(null),callback=useRef(onChange),control=useRef<ReturnType<typeof mountAIControls>|null>(null);
  callback.current=onChange;
  useEffect(()=>{if(!root.current)return;control.current=mountAIControls(root.current,{onChange:value=>callback.current(value)});return()=>control.current?.destroy();},[]);
  useEffect(()=>control.current?.setDisabled(disabled),[disabled]);
  return <div ref={root} className="my-3 rounded-xl border border-border bg-card p-3 text-sm [&_select]:min-h-11 [&_input]:min-h-11 [&_button]:min-h-11 [&_label]:m-2 [&_p]:my-2 [&_select]:border [&_input]:border [&_button]:border [&_a]:underline" data-testid="ai-model-control" />;
}
