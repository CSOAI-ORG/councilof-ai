export type ModelSelection={provider:string;model:string;offline:boolean;includeContext:boolean;transport:"web"|"extension"};
export type ModelAnswer={content:string;provider:string;requestedModel:string;reportedModel:string;modelLabel:string;local:boolean;offline:boolean;endpoint:string;signed:false;measured:false};
export function bridge(action:string,payload?:Record<string,unknown>,options?:{signal?:AbortSignal;onDelta?:(text:string)=>void;timeout?:number}):Promise<any>;
export function askModel(choice:ModelSelection,question:string,options?:{history?:{role:"user"|"assistant";content:string}[];signal?:AbortSignal;onDelta?:(text:string)=>void;maxTokens?:number}):Promise<ModelAnswer>;
export function mountAIControls(root:HTMLElement,options?:{onChange?:(value:ModelSelection|null)=>void;tools?:boolean}):{getSelection:()=>ModelSelection|null;setDisabled:(value:boolean)=>void;destroy:()=>void};
