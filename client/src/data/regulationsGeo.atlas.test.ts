import {describe,it,expect} from 'vitest';import {readFileSync} from 'node:fs';import {resolve} from 'node:path';import {createHash} from 'node:crypto';import {WORLD_ATLAS_URL} from './regulationsGeo';
describe('pinned locally served map data',()=>{
 it('does not require a third-party network request',()=>expect(WORLD_ATLAS_URL).toBe('/vendor/world-atlas/2.0.2/countries-110m.json'));
 it('matches retained source digest and geometry count',()=>{const root=resolve(__dirname,'../../../public/vendor/world-atlas/2.0.2'),m=JSON.parse(readFileSync(root+'/source.json','utf8')),raw=readFileSync(root+'/countries-110m.json'),d=JSON.parse(raw.toString());expect(createHash('sha256').update(raw).digest('hex')).toBe(m.files['countries-110m.json'].sha256);expect(d.objects.countries.geometries).toHaveLength(m.feature_records);expect(m.scope).toContain('not a current territorial');});
 it('retains the upstream licence',()=>expect(readFileSync(resolve(__dirname,'../../../public/vendor/world-atlas/2.0.2/LICENSE'),'utf8')).toContain('Permission to use'));
});
