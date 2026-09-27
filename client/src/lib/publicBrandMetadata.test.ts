import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { resolveHead, SITE_NAME } from './seoHead';
import head from '../data/seo-head.json';

const routes = ['/contact', '/gspc-verify', '/methodology', '/api-docs', '/tools', '/services'];
const pages = ['Contact', 'GSPCVerify', 'Methodology', 'ToolsPage', 'Services'];

/** Inspect syntax, not matching comments or incidental examples. */
function competingTitleWriters(source: string): string[] {
  const file = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) && node.left.expression.getText(file) === 'document' &&
        node.left.name.text === 'title') found.push('document.title');
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(file) === 'title') found.push('JSX title');
    ts.forEachChild(node, visit);
  }
  visit(file);
  return found;
}

describe('Public brand metadata uses the existing single head producer', () => {
  for (const route of routes) {
    it(`${route} aligns browser and social identity before data loads`, () => {
      const result = resolveHead(`${route}/?review=brand`);
      expect(SITE_NAME).toBe('Council of AI');
      expect(result.title.endsWith(` | ${SITE_NAME}`)).toBe(true);
      expect(result.title.length).toBeLessThanOrEqual(60);
      expect(result.ogTitle).toBe(result.title);
      expect(result.ogDescription).toBe(result.description);
      expect(result.description.length).toBeGreaterThanOrEqual(110);
      expect(result.description.length).toBeLessThanOrEqual(160);
      expect(result.canonical).toBe(`https://councilof.ai${route}/`);
      expect(result.title).not.toMatch(/\| (CSOAI|councilof\.ai)$/);
    });
  }
  for (const name of pages) {
    it(`${name} cannot overwrite the canonical title after mounting`, () => {
      const source = readFileSync(new URL(`../pages/${name}.tsx`, import.meta.url), 'utf8');
      expect(competingTitleWriters(source)).toEqual([]);
    });
  }
  it('detects both an old imperative title and a second Helmet title', () => {
    const mutation = 'document.title = "Contact | CSOAI"; const x = <Helmet><title>Other</title></Helmet>;';
    expect(competingTitleWriters(mutation)).toEqual(['document.title', 'JSX title']);
  });
  it('retains the legal entity and institutional origin', () => {
    expect(head.site.shellDescription).toContain('CSOAI LTD');
    expect(head.site.shellDescription).toContain('16939677');
    expect(head.routes['/contact'].description).toContain('CSOAI Ltd');
    expect(head.site.origin).toBe('https://councilof.ai');
  });
  it('leaves Services manifest loading and the unavailable state intact', () => {
    const source = readFileSync(new URL('../pages/Services.tsx', import.meta.url), 'utf8');
    expect(source).toContain('fetch(MANIFEST');
    expect(source).toContain('cache: "no-store"');
    expect(source).toContain('state: "unread"');
    expect(source).not.toContain('react-helmet-async');
  });
  it('leaves the Contact enquiry prefill intact', () => {
    const source = readFileSync(new URL('../pages/Contact.tsx', import.meta.url), 'utf8');
    expect(source).toContain('new URLSearchParams(window.location.search)');
    expect(source).toContain('subject: subjects[arm]');
    expect(source).toContain('CONTACT_MAILBOX');
  });
});
