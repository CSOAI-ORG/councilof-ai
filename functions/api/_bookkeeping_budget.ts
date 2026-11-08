/** Bounded post-settlement observations. KV writes cannot be cancelled or assumed absent. */
export const BOOKKEEPING_DEADLINE_MS=250;
export class BookkeepingTimeout extends Error {
  constructor(readonly phase:"get"|"put",readonly invoked:boolean){super(invoked&&phase==="put"?"UNKNOWN: invoked KV put exceeded observation deadline":"observation deadline exceeded");}
}
export type BookkeepingBudget=ReturnType<typeof bookkeepingBudget>;
export function bookkeepingBudget(ms=BOOKKEEPING_DEADLINE_MS){
  let state="NOT_REQUESTED";
  const severity:Record<string,number>={NOT_REQUESTED:0,OBSERVED:1,ERROR:2,DEADLINE:3,UNKNOWN:4};
  const mark=(next:string)=>{if(severity[next]>severity[state])state=next;};
  let expired=false,active=false,invoked=false,phase:"get"|"put"="get";
  let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{
    expired=true;if(active)mark(phase==="put"&&invoked?"UNKNOWN":"DEADLINE");
    reject(new BookkeepingTimeout(phase,active&&invoked));
  },ms);});
  // A returned budget can expire between observations; it must never create an unhandled rejection.
  void timeout.catch(()=>undefined);
  return {
    async run<T>(operation:()=>Promise<T>,nextPhase:"get"|"put"):Promise<T>{
      if(expired){mark("DEADLINE");throw new BookkeepingTimeout(nextPhase,false);}
      phase=nextPhase;active=true;invoked=false;
      try{const value=await Promise.race([timeout,Promise.resolve().then(()=>{
        if(expired)throw new BookkeepingTimeout(nextPhase,false);
        invoked=true;return operation();
      })]);mark("OBSERVED");return value;}catch(error){mark(error instanceof BookkeepingTimeout?(error.phase==="put"&&error.invoked?"UNKNOWN":"DEADLINE"):"ERROR");throw error;}finally{active=false;}
    },
    expired:()=>expired,
    state:()=>state,
    clear(){if(timer!==undefined)clearTimeout(timer);},
  };
}
export const bookkeepingGap=(error:unknown):string=>error instanceof BookkeepingTimeout
  ? error.phase==="put"&&error.invoked?"UNKNOWN: invoked KV put may commit later; read-only reconciliation required":"UNRECORDED_DEADLINE: no later observation was started"
  : "ERROR: observation failed";

const fallbackBudgets=new WeakMap<object,BookkeepingBudget>();
function budgetFor(payment:object):BookkeepingBudget{
  const supplied=(payment as {observationBudget?:BookkeepingBudget}).observationBudget;
  if(supplied)return supplied;
  let budget=fallbackBudgets.get(payment);
  if(!budget){budget=bookkeepingBudget();fallbackBudgets.set(payment,budget);}
  return budget;
}
export function postSettlementStore(kv:{get:(key:string)=>Promise<string|null>;put:(key:string,value:string)=>Promise<void>},payment:object){
  const budget=budgetFor(payment);
  return {get:(key:string)=>budget.run(()=>kv.get(key),"get"),
    put:(key:string,value:string)=>budget.run(()=>kv.put(key,value),"put")};
}
export const postObservationState=(payment:object):string=>
  ((payment as {observationBudget?:BookkeepingBudget}).observationBudget??fallbackBudgets.get(payment))?.state()??"NOT_REQUESTED";
