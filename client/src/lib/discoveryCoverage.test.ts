import {describe,it,expect} from 'vitest';import {parseCoverage} from './observatoryCoverage';
const card=(path:string)=>({candidate_path:path,state:'LOCAL_AGENT_CARD_SHAPE',declared_executable:false,execution:'NOT_TESTED',interface_paths:['/api/a2a']});
const doc=()=>({schema:'csoai.agent-discovery-census/0.2',measurement_state:'NO_NEW_EXECUTION_OR_CONFORMANCE_TEST',canonical_agent_cards:[card('/.well-known/agent-card.json')],tool_scoped_cards:[card('/.well-known/agents/a.json'),card('/.well-known/agents/b.json')],counts:{canonical_service_cards:1,tool_scoped_card_records:2,distinct_declared_interface_paths:1,executed_agents:null}});
describe('agent card count is not executed agent count',()=>{
 it('collapses declared transport identities without merging source records',()=>{const r=parseCoverage('discovery',doc());expect(r.count).toBe(1);expect(r.detail).toContain('2 tool-scoped');expect(r.caveat).toContain('not a census of deployed agents');});
 it('does not invent a measurement timestamp',()=>expect(parseCoverage('discovery',doc()).asOf).toBeNull());
 it('rejects aggregate count inflation',()=>{const d=doc();d.counts.distinct_declared_interface_paths=3;expect(()=>parseCoverage('discovery',d)).toThrow('denominator');});
 it('does not accept an executed population manufactured from card files',()=>{const d=doc();Object.assign(d.counts,{executed_agents:3});expect(()=>parseCoverage('discovery',d)).toThrow();});
 it('refuses duplicate descriptor identities',()=>{const d=doc();d.tool_scoped_cards[1]=d.tool_scoped_cards[0];expect(()=>parseCoverage('discovery',d)).toThrow('duplicate');});
 it('does not accept an agent shape without explicit non-execution state',()=>{const d=doc();d.tool_scoped_cards[0].execution='LIVE';expect(()=>parseCoverage('discovery',d)).toThrow();});
 it('rejects an external destination masquerading as a local service',()=>{const d=doc();d.tool_scoped_cards[0].interface_paths=['//attacker.invalid/service'];expect(()=>parseCoverage('discovery',d)).toThrow();});
 it('does not accept the withdrawn population report',()=>expect(()=>parseCoverage('discovery',{schema:'csoai.tui-a-agent-enumeration/0.1',population:{ENUMERATED:13}})).toThrow());
 it('accepts empty explicitly unmeasured inventory without a failure grade',()=>{const d=doc();d.canonical_agent_cards=[];d.tool_scoped_cards=[];d.counts={canonical_service_cards:0,tool_scoped_card_records:0,distinct_declared_interface_paths:0,executed_agents:null};const r=parseCoverage('discovery',d);expect(r.count).toBe(0);expect(r.detail).toContain('NOT TESTED');});
});
