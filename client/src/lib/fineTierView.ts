/** Present recorded metadata without turning absent tiers into zero legal exposure. */
export interface FineTier {statutory_maximum:string;cited_to:string;applies_to:string}
export type FineTierView={state:'RECORDED';entries:[string,FineTier][]}|{state:'NOT_RECORDED'|'UNCHECKABLE';entries:[]};
export function fineTierView(value:unknown):FineTierView{
 if(value===null||value===undefined)return {state:'NOT_RECORDED',entries:[]};
 if(typeof value!=='object'||Array.isArray(value))return {state:'UNCHECKABLE',entries:[]};
 const entries:[string,FineTier][]=[];
 for(const [key,row] of Object.entries(value)){
  if(row===null||typeof row!=='object'||Array.isArray(row))return {state:'UNCHECKABLE',entries:[]};
  const r=row as Record<string,unknown>;
  if(typeof r.statutory_maximum!=='string'||!r.statutory_maximum.trim()||typeof r.cited_to!=='string'||!r.cited_to.trim()||typeof r.applies_to!=='string'||!r.applies_to.trim())return {state:'UNCHECKABLE',entries:[]};
  entries.push([key,{statutory_maximum:r.statutory_maximum,cited_to:r.cited_to,applies_to:r.applies_to}]);
 }
 return entries.length?{state:'RECORDED',entries}:{state:'NOT_RECORDED',entries:[]};
}
