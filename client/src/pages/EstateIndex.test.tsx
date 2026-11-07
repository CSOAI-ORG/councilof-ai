import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import EstateIndex from './EstateIndex';
describe('estate page application landmark',()=>{
 it('retains one application main and a labelled content section',()=>{
  const html=renderToStaticMarkup(<main><EstateIndex/></main>);
  expect((html.match(/<main(?:\s|>)/g)??[]).length).toBe(1);
  expect(html).toContain('aria-labelledby="estate-index-heading"');
  expect(html).toContain('id="estate-index-heading"');
 });
 it('initial render does not invent loaded corpus counts',()=>{
  const html=renderToStaticMarkup(<main><EstateIndex/></main>);
  expect(html).toContain('Estate index');
  expect(html).not.toContain('Entries under the root');
  expect(html).not.toContain('0 artifacts');
 });
});
