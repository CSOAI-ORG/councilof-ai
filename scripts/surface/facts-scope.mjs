/** Isolate explicit quoted correction text from current-count claims.
 * Only two named historical-quotation fields within a valid correction record are
 * withheld from the axis-count rule. Current summaries and all other rules still run.
 */
export function currentCountContent(raw) {
 let doc;try{doc=JSON.parse(raw);}catch{return raw;}
 if(doc?.schema!=='csoai.correction-watch/0.1'||!Array.isArray(doc.scans))return raw;
 const copy=structuredClone(doc);
 for(const row of copy.scans){
  if(!row||typeof row!=='object'||!/^C-\d{4}-\d{4}-\d{2}$/.test(row.id??'')||typeof row.first_observed_at!=='string'||!Number.isFinite(Date.parse(row.first_observed_at)))continue;
  for(const key of ['what_was_wrong','why_it_was_wrong'])if(typeof row[key]==='string')row[key]='[Historical quotation for '+row.id+'; not a present board-count claim.]';
 }
 return JSON.stringify(copy);
}
/** An explicitly bank-qualified subset is not a whole-board count. */
export function isFrozenBankSubset(n,total,following){return Number.isSafeInteger(n)&&n>=0&&n<=total&&/^\s+carrying\s+(?:a|the)\s+frozen\s+bank\b/i.test(following);}
