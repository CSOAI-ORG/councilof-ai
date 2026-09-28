import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Slideshow } from './BrandGraphics';

const slides = [
  {title:'First evidence item',body:'Read the original source.',tag:'Evidence'},
  {title:'Second evidence item',body:'Read the limitations.'},
  {title:'Third evidence item',body:'Review corrections.'},
];
const markup = (props = {}) => renderToStaticMarkup(<Slideshow slides={slides} {...props} />);
describe('public slideshow rendering contract', () => {
  it('renders nothing for an empty collection', () => {
    expect(renderToStaticMarkup(<Slideshow slides={[]} />)).toBe('');
  });
  it('renders a named carousel and the current item without browser globals', () => {
    const html = markup();
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('aria-label="Featured information"');
    expect(html).toContain('First evidence item');
    expect(html).toContain('aria-label="Slide 1 of 3"');
  });
  it('supports an explicit per-instance label', () => {
    expect(markup({label:'Evidence reading steps'})).toContain('aria-label="Evidence reading steps"');
  });
  it('does not offer rotation or navigation for a single item', () => {
    const html = markup({slides:[slides[0]]});
    expect(html).toContain('First evidence item');
    expect(html).not.toContain('<button');
  });
  it('provides named native non-submit controls', () => {
    const html = markup();
    expect(html).toContain('aria-label="Previous slide"');
    expect(html).toContain('aria-label="Next slide"');
    expect(html).toContain('aria-label="Slide 2: Second evidence item"');
    expect((html.match(/<button\b/g)||[]).length).toBe(6);
    expect((html.match(/type="button"/g)||[]).length).toBe(6);
  });
  it('does not begin rotating before browser motion preference is known', () => {
    const html = markup();
    expect(html).toContain('Automatic rotation off');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-live="polite"');
  });
  it('marks exactly one selector current', () => {
    expect((markup().match(/aria-current="true"/g)||[]).length).toBe(1);
  });
  it('uses existing ink colours and minimum-sized selector controls', () => {
    const html = markup();
    expect(html).toContain('surface-ink');
    expect(html).toContain('ink-muted');
    expect(html).toContain('h-11 w-11');
    expect(html).toContain('min-h-11 min-w-11');
    expect(html).not.toContain('bg-[#03110b]');
  });
  it('retains a visible keyboard-focus treatment on controls', () => {
    expect(markup()).toContain('focus-visible:ring-2');
    expect(markup()).toContain('focus-visible:ring-[var(--ink-kicker)]');
  });
  it.each(['title','body','tag'] as const)('escapes supplied %s text', field => {
    const html = markup({slides:[{...slides[0],[field]:'<script>example</script>'}]});
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;example&lt;/script&gt;');
  });
  it('generates distinct controlled slide regions when mounted twice', () => {
    const html = renderToStaticMarkup(<><Slideshow slides={slides}/><Slideshow slides={slides}/></>);
    const ids = [...html.matchAll(/id="([^"]+-slide)"/g)].map(m=>m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for(const id of ids) expect(html).toContain(`aria-controls="${id}"`);
  });
});
