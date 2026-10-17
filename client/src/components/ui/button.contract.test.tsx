import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button, IconButton, ToggleButton } from './button';
const html = (value: React.ReactNode) => renderToStaticMarkup(value);

function describedElement(markup: string): string[] {
  return (markup.match(/aria-describedby="([^"]+)"/)?.[1] ?? '').split(' ').filter(Boolean);
}

describe('shared Button native and slotted output contract', () => {
  it('preserves the native button and its explicit type', () => {
    expect(html(<Button type="submit">Prepare</Button>)).toContain('type="submit"');
    expect(html(<Button>Prepare</Button>)).toMatch(/^<button/);
  });
  it('uses real native disabling', () => {
    expect(html(<Button disabled>Wait</Button>)).toContain('disabled=""');
    expect(html(<Button disabled>Wait</Button>)).toContain('aria-disabled="true"');
  });
  it('keeps native loading noninteractive and announced', () => {
    const output = html(<Button loading>Wait</Button>);
    expect(output).toContain('disabled=""');
    expect(output).toContain('aria-busy="true"');
  });
  it('keeps an enabled slotted anchor intact', () => {
    const output = html(<Button asChild><a href="/fixture-target">Inspect</a></Button>);
    expect(output).toMatch(/^<a/); expect(output).toContain('href="/fixture-target"');
    expect(output).not.toContain('disabled=""');
  });
  it.each(['disabled','loading'] as const)('removes native-anchor navigation while %s', state => {
    const output = html(<Button asChild {...{ [state]: true }}><a href="/fixture-target">Wait</a></Button>);
    expect(output).not.toContain('href=');
    expect(output).not.toContain('disabled=""');
    expect(output).toContain('aria-disabled="true"');
    expect(output).toContain('tabindex="-1"');
    expect(output).toContain('role="link"');
  });
  it('disabled wrapper cannot be undone by child or parent aria props', () => {
    const output = html(<Button asChild disabled aria-disabled={false}><a href="/fixture-target" aria-disabled={false}>Wait</a></Button>);
    expect(output).toContain('aria-disabled="true"'); expect(output).not.toContain('href=');
  });
  it('disables a native slotted button even when child says false', () => {
    expect(html(<Button asChild disabled><button disabled={false}>Wait</button></Button>)).toContain('disabled=""');
  });
  it('preserves a child that is already disabled', () => {
    expect(html(<Button asChild><button disabled>Wait</button></Button>)).toContain('disabled=""');
  });
  it('native description reference points to actual text', () => {
    const output = html(<Button description="Wait for evidence">Inspect</Button>);
    const ids = describedElement(output); expect(ids).toHaveLength(1);
    expect(output).toContain(`id="${ids[0]}"`); expect(output).toContain('Wait for evidence</span>');
  });
  it('slotted description reference points to actual text', () => {
    const output = html(<Button asChild description="Wait for evidence"><a href="/fixture-target">Inspect</a></Button>);
    const ids = describedElement(output); expect(ids).toHaveLength(1);
    expect(output).toContain(`id="${ids[0]}"`); expect(output).toContain('Wait for evidence</span>');
  });
  it('preserves child and wrapper description references with generated text', () => {
    const output = html(<Button asChild description="Generated" aria-describedby="wrapper-help"><a href="/fixture-target" aria-describedby="child-help">Inspect</a></Button>);
    const ids = describedElement(output);
    expect(ids).toContain('wrapper-help'); expect(ids).toContain('child-help');
    expect(ids).toHaveLength(3);
    expect(output).toContain(`id="${ids.find(id => !id.endsWith('-help'))}"`);
  });
  it('merges existing child and wrapper classes', () => {
    const output = html(<Button asChild className="wrapper-class"><a href="/fixture-target" className="child-class">Inspect</a></Button>);
    expect(output).toContain('wrapper-class'); expect(output).toContain('child-class');
  });
  it('preserves icon-button naming and toggle state', () => {
    expect(html(<IconButton aria-label="Inspect evidence">I</IconButton>)).toContain('aria-label="Inspect evidence"');
    expect(html(<ToggleButton pressed>Selected</ToggleButton>)).toContain('aria-pressed="true"');
  });
  it('keeps only one interactive element for an asChild link', () => {
    const output = html(<Button asChild description="Note"><a href="/fixture-target">Inspect</a></Button>);
    expect(output.match(/<a /g)).toHaveLength(1); expect(output).not.toContain('<button');
  });
  it('does not silently accept multiple slotted children', () => {
    expect(() => html(<Button asChild><a href="/one">One</a><a href="/two">Two</a></Button>)).toThrow();
  });
});
