import {describe,it,expect} from 'vitest';import {CONTROL_EVIDENCE_MAP,controlsForLens} from './gspcControlMap';
describe('versioned requirement evidence map',()=>{
 it('contains 12 NIST references with required organisational evidence',()=>{const rows=controlsForLens('nist-ai-rmf');expect(rows).toHaveLength(12);expect(rows.every(c=>c.requiredEvidence.length>=2&&c.status==='EVIDENCE_PLAN_ONLY')).toBe(true);});
 it('contains ten scoped EU references not automatic compliance passes',()=>expect(controlsForLens('eu-ai-act')).toHaveLength(10));
 it('isolates GPAI provisions',()=>expect(controlsForLens('gpai').map(c=>c.id)).toEqual(['Article 53','Article 55']));
 it('contains three proposed CARE controls without fabricating charter article numbers',()=>expect(controlsForLens('care').every(c=>c.id.startsWith('CARE-'))).toBe(true));
 it('has unique identities',()=>expect(new Set(CONTROL_EVIDENCE_MAP.map(c=>c.framework+':'+c.id)).size).toBe(CONTROL_EVIDENCE_MAP.length));
 it('does not silently infer an unknown framework',()=>expect(controlsForLens('invented')).toEqual([]));
});
