import React from 'react';import {describe,it,expect} from 'vitest';import {renderToStaticMarkup} from 'react-dom/server';import {Button} from './button';
describe('composed button disabled contract',()=>{
 it('link is marked disabled and removed from tab order',()=>{const h=renderToStaticMarkup(<Button asChild disabled><a href="/fixture">Fixture link</a></Button>);expect(h).toContain('aria-disabled="true"');expect(h).toContain('tabindex="-1"');expect(h).toContain('Fixture link');});
 it('enabled link retains its normal tab order',()=>{const h=renderToStaticMarkup(<Button asChild><a href="/fixture" tabIndex={0}>Fixture link</a></Button>);expect(h).toContain('tabindex="0"');expect(h).not.toContain('aria-disabled="true"');});
 it('loading blocks a composed link too',()=>{const h=renderToStaticMarkup(<Button asChild loading><a href="/fixture">Fixture link</a></Button>);expect(h).toContain('aria-busy="true"');expect(h).toContain('tabindex="-1"');});
 it('a composed native button retains real disabled semantics',()=>{const h=renderToStaticMarkup(<Button asChild disabled><button>Fixture</button></Button>);expect(h).toMatch(/\sdisabled=""/);});
 it('ordinary native button still renders disabled',()=>{const h=renderToStaticMarkup(<Button disabled>Fixture</Button>);expect(h).toMatch(/<button[^>]+disabled=""/);});
});
