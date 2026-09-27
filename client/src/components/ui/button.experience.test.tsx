import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {Button} from './button';
describe('Button disabled and loading semantics',()=>{
  it('keeps native disabled controls disabled',()=>{
    const html=renderToStaticMarkup(<Button disabled>Wait</Button>);
    expect(html).toContain('disabled=""');expect(html).toContain('aria-disabled="true"');
  });
  it('marks disabled slotted links and removes them from the tab sequence',()=>{
    const html=renderToStaticMarkup(<Button asChild disabled><a href="#target">Wait</a></Button>);
    expect(html).toContain('aria-disabled="true"');expect(html).toContain('tabindex="-1"');
    expect(html).not.toMatch(/\sdisabled=""/);
  });
  it('does not let a child override the disabled state',()=>{
    const html=renderToStaticMarkup(<Button asChild disabled><a href="#target" aria-disabled={false} tabIndex={0}>Wait</a></Button>);
    expect(html).toContain('aria-disabled="true"');expect(html).toContain('tabindex="-1"');
  });
  it('sets native disabled on a slotted native button',()=>{
    expect(renderToStaticMarkup(<Button asChild disabled><button>Wait</button></Button>)).toContain('disabled=""');
  });
  it('treats a loading slotted control as unavailable',()=>{
    const html=renderToStaticMarkup(<Button asChild loading><a href="#target">Loading</a></Button>);
    expect(html).toContain('aria-disabled="true"');expect(html).toContain('aria-busy="true"');
  });
  it('preserves an enabled child target and caller tab order',()=>{
    const html=renderToStaticMarkup(<Button asChild><a href="#target" tabIndex={0}>Continue</a></Button>);
    expect(html).toContain('href="#target"');expect(html).toContain('tabindex="0"');expect(html).not.toContain('aria-disabled="true"');
  });
});
