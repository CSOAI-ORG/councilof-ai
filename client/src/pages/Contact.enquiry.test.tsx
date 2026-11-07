import React from 'react';import {describe,it,expect} from 'vitest';import {renderToStaticMarkup} from 'react-dom/server';import Contact from './Contact';
describe('contact enquiry disclosure and accessibility',()=>{
 it('shows the saving and privacy boundary before submission',()=>{const html=renderToStaticMarkup(<Contact/>);expect(html).toContain('Save enquiry');expect(html).toContain('It does not subscribe you to marketing');expect(html).toContain('href="/privacy-policy"');expect(html).not.toContain('nothing you type here is');});
 it('associates each visible label with its actual control',()=>{const html=renderToStaticMarkup(<Contact/>);for(const f of ['name','email','subject','message']){expect(html).toContain(`for="contact-${f}"`);expect(html).toContain(`id="contact-${f}"`);}});
 it('email fallback remains a user initiated draft, not a sent confirmation',()=>{const html=renderToStaticMarkup(<Contact/>);expect(html).toContain('contact-email-fallback');expect(html).toContain('mailto:contact@csoai.org');expect(html).toContain('it does not send the message');expect(html).not.toContain('Enquiry recorded for review.');});
 it('informational address and hours do not create empty navigation links',()=>expect(renderToStaticMarkup(<Contact/>)).not.toContain('href="#"'));
 it('offers written evidence scoping rather than an automatic booking',()=>{const html=renderToStaticMarkup(<Contact/>);expect(html).toContain('Request an evidence walkthrough');expect(html).toContain('separately agreed scope');expect(html).not.toContain('The demo is 30 minutes');});
});
