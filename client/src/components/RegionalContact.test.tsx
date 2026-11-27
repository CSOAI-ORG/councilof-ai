import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RegionalContact, { REGIONAL_CONTACTS, regionalContactHref } from './RegionalContact';

describe('regional contact', () => {
  it('contains six unique verified same-domain enquiry aliases', () => {
    expect(REGIONAL_CONTACTS).toHaveLength(6);
    expect(new Set(REGIONAL_CONTACTS.map(x=>x.address)).size).toBe(6);
    expect(REGIONAL_CONTACTS.every(x=>/^[a-z]+@csoai\.org$/.test(x.address))).toBe(true);
  });
  it('creates bounded email drafts only with fixed regional subjects', () => {
    for (const x of REGIONAL_CONTACTS) {
      const href = regionalContactHref(x);
      expect(href).toBe('mailto:'+x.address+'?subject='+encodeURIComponent('Regional enquiry — '+x.region));
      expect(href).not.toContain('&');
    }
  });
  it('renders six reachable direct links without JavaScript', () => {
    const html=renderToStaticMarkup(<RegionalContact />);
    expect((html.match(/href="mailto:/g)||[]).length).toBe(6);
    for(const x of REGIONAL_CONTACTS) expect(html).toContain(x.address);
  });
  it('preserves all regional addresses through Cloudflare email obfuscation', () => {
    const html=renderToStaticMarkup(<RegionalContact />);
    expect((html.match(/<!--email_off-->/g)||[]).length).toBe(6);
    expect((html.match(/<!--\/email_off-->/g)||[]).length).toBe(6);
  });
  it('discloses one inbox, UK operations, and no local office or authority', () => {
    const html=renderToStaticMarkup(<RegionalContact />);
    expect(html).toContain('same Council inbox');
    expect(html).toContain('United Kingdom');
    expect(html).toContain('not overseas offices');
    expect(html).toContain('not acceptance, appointment or authority');
    expect(html).not.toContain('tel:');
  });
  it('reuses canonical institutional and human review surfaces', () => {
    const html=renderToStaticMarkup(<RegionalContact />);
    for(const p of ['/regulator-atlas/','/working-groups/catalog.json','/him/'])expect(html).toContain('href="'+p+'"');
  });
});
