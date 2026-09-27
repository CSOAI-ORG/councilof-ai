import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CouncilBrand } from './CouncilBrand';
import { COUNCIL_BRAND } from '@/lib/brand';
import { isPublicNavActive } from '../publicNavState';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const read=(path:string)=>readFileSync(root+path,'utf8');
const pins={full:'a6d0e6bed74d8316932afe70d6e5e81eb55c1c815317e0fa30d342b695c6044f',compact:'e3fe279844653fd6820677170b3eadd7559757e2ed175b2c28acb7d57d4a064c',mark:'3793856713713213c282332379009a935c0909ebfc45810df62a1fa1088f5afd'};
describe('approved public brand contract',()=>{
 for(const [name,sha] of Object.entries(pins)){
  it(`preserves the approved ${name} artwork bytes`,()=>expect(createHash('sha256').update(readFileSync(root+`public/brand/council-of-ai-${name}.svg`)).digest('hex')).toBe(sha));
  it(`${name} has no executable content, raster replacement or substituted font`,()=>expect(read(`public/brand/council-of-ai-${name}.svg`)).not.toMatch(/<(?:script|foreignObject|image|text)\b|(?:href|src)=["'](?:https?:|data:)/i));
 }
 it('renders the compact brand by default',()=>expect(renderToStaticMarkup(<CouncilBrand/>)).toContain('/brand/council-of-ai-compact.svg'));
 it('renders the approved full institution name',()=>expect(renderToStaticMarkup(<CouncilBrand variant="full"/>)).toContain('Council of AI — Council for the Safety of Artificial Intelligence'));
 it('preserves workspace context and size',()=>{const html=renderToStaticMarkup(<CouncilBrand size="sm" context="Workspace" strapline="Fixture description"/>);expect(html).toContain('council-brand--sm');expect(html).toContain('Workspace');expect(html).toContain('Fixture description');});
 it('keeps legal and technical legacy identifiers distinct from the public name',()=>{expect(COUNCIL_BRAND.name).toBe('Council of AI');expect(COUNCIL_BRAND.legacyName).toBe('CSOAI');expect(COUNCIL_BRAND.legacyDomain).toBe('csoai.org');});
 it('uses the shared brand instead of a competing footer emblem',()=>{const footer=read('client/src/components/Footer.tsx');expect(footer).toContain('<CouncilBrand variant="full"');expect(footer).not.toContain('footerShieldGradient');expect(footer).toContain('--cookie-banner-h');});
 it('uses the same shared identity in the header',()=>expect(read('client/src/components/Header.tsx')).toContain('<CouncilBrand variant="compact"'));
});
describe('navigation path boundaries',()=>{
 const cases:[string,string,boolean][]=[
  ['/board','/board/',true],['/board/','/board',true],['/board/models','/board/',true],
  ['/boardwalk','/board/',false],['/services/?feed=1','/services',true],
  ['/tools','/tools#quickstart',true],['/toolbox','/tools',false],
  ['/','/',false],['/services','https://example.invalid/services',false],
 ];
 for(const [location,href,expected] of cases) it(`${location} versus ${href}`,()=>expect(isPublicNavActive(location,href)).toBe(expected));
});
