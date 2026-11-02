import {describe,it,expect} from 'vitest';
import {parseOrganisationEvidence,readObservatoryFilters,writeObservatoryFilters} from './gspcObservatory';
const fixture={schema:'csoai.lab-card-census/0.1',as_of:'2026-09-17T00:00:00Z',rows:[{org:'Fixture Lab',url:'https://example.org/',signed:{state:'NO',evidence:'Fixture only',note:'Scope qualification'},artifacts_examined:['javascript:bad','https://example.org/card.pdf']}]};
describe('lab census projection',()=>{
 it('retains evidence states without scoring the organisation',()=>{const [r]=parseOrganisationEvidence('lab-artifact',fixture);expect(r.measured).toBe(false);expect(r.labChecks?.[0].state).toBe('NO');expect(r.labChecks?.[0].note).toBe('Scope qualification');expect(r.labChecks?.[1].state).toBe('UNCHECKABLE');expect(r.artifacts).toEqual(['https://example.org/card.pdf']);});
 it('rejects another schema',()=>expect(()=>parseOrganisationEvidence('lab-artifact',{rows:[]})).toThrow());
 it('does not duplicate an org in the same census',()=>expect(parseOrganisationEvidence('lab-artifact',{...fixture,rows:[...fixture.rows,...fixture.rows]})).toHaveLength(1));
 it('does not turn a novel upstream state into YES',()=>expect(parseOrganisationEvidence('lab-artifact',{...fixture,rows:[{org:'Fixture',signed:{state:'APPROVED'}}]})[0].labChecks?.[0].state).toBe('UNCHECKABLE'));
});
describe('shareable workspace',()=>{
 it('round-trips a lens, search and collection',()=>{const f={lens:'nist-ai-rmf',query:'care & safety',scope:'lab-artifact'};expect(readObservatoryFilters(new URL(writeObservatoryFilters('https://example.org/gspc?keep=1#tab',f)).search)).toEqual(f);});
 it('retains unrelated route state',()=>{const u=new URL(writeObservatoryFilters('https://example.org/gspc?keep=1#tab',{lens:'all',query:'',scope:'all'}));expect(u.search).toBe('?keep=1');expect(u.hash).toBe('#tab');});
 it('bounds query size',()=>expect(readObservatoryFilters('?gspcQuery='+ 'a'.repeat(300)).query).toHaveLength(160));
 it('does not render attacker-supplied option values',()=>expect(readObservatoryFilters('?gspcLens=javascript:bad&gspcCollection=arbitrary')).toEqual({lens:'all',query:'',scope:'all'}));
});
