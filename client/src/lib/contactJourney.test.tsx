import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as enquiry from './pilotEnquiry';
import Contact from '../pages/Contact';
const fields={name:'Synthetic Reviewer',email:'reader@example.invalid',subject:'Evidence & scope?',message:'One public result.\nAn explicit acceptance decision.'};
const crlf=(text:string)=>text.replace(/\r\n|\r|\n/g,'\r\n');
const src=readFileSync(resolve(__dirname,'../pages/Contact.tsx'),'utf8');

describe('contact draft recovery: no send or storage operation',()=>{
 it('exposes a partial-form fallback with the existing fixed contact recipient',()=>{
  const d=enquiry.prepareContactEmail({name:'',email:'',subject:'',message:''});
  expect(new URL(d.mailto!).pathname).toBe('contact@csoai.org');
  expect(d.subject).toBe('Website enquiry');
 });
 it('retains all original form text in the copy fallback',()=>{
  const d=enquiry.prepareContactEmail(fields);
  expect(d.copyText).toBe(`To: contact@csoai.org\nSubject: ${fields.subject}\n\nName: ${fields.name}\nEmail: ${fields.email}\n\n${fields.message}`);
 });
 it.each(['\n','\r','\r\n'])('uses CRLF only for the URI with %j source lines',newline=>{
  const input={...fields,message:['First','Second','Third'].join(newline)};
  const d=enquiry.prepareContactEmail(input);
  expect(new URL(d.mailto!).searchParams.get('body')).toBe(crlf(d.body));
  expect(d.copyText.endsWith(input.message)).toBe(true);
 });
 it('does not turn reserved subject/body text into extra recipients',()=>{
  const d=enquiry.prepareContactEmail({...fields,subject:'Hello\r\nCc: nobody',message:'&bcc=other@example.invalid'});
  const u=new URL(d.mailto!);expect([...u.searchParams.keys()]).toEqual(['subject','body']);
  expect(u.searchParams.get('subject')).toBe('Hello Cc: nobody');expect(u.pathname).toBe('contact@csoai.org');
 });
 it.each(['a'.repeat(4000),'example line\n'.repeat(300),'漢字'.repeat(600)])('retains long draft without an unreliable email link',message=>{
  const d=enquiry.prepareContactEmail({...fields,message});expect(d.mailto).toBeNull();expect(d.body.endsWith(message)).toBe(true);expect(d.copyText.endsWith(message)).toBe(true);
 });
 it('preserves unpaired UTF-16 in the copy text without crashing URI creation',()=>{
  const d=enquiry.prepareContactEmail({...fields,message:'keep this '+String.fromCharCode(0xd800)});
  expect(d.mailto).toBeNull();expect(d.body.endsWith(String.fromCharCode(0xd800))).toBe(true);
 });
 it('keeps international text and caller data unchanged',()=>{
  const input={...fields,name:'Élodie 王 الباحث',message:'Résumé · 中文 · العربية'};const before={...input};
  const d=enquiry.prepareContactEmail(input);expect(input).toEqual(before);expect(d.copyText).toContain(input.name);expect(d.copyText.endsWith(input.message)).toBe(true);
 });
 it('does not accept runtime non-string fields',()=>{
  expect(()=>enquiry.prepareContactEmail({...fields,message:null} as any)).toThrow();
 });
 it('preserves the distinct approved pilot helper recipient',()=>{
  expect(new URL(enquiry.prepareEnquiry(fields).mailto!).pathname).toBe(enquiry.ENQUIRY_EMAIL);
 });
 it('bounds the final encoded URI rather than raw input length',()=>{
  for(const n of [50,200,400]){const d=enquiry.prepareContactEmail({...fields,message:'é\n'.repeat(n)});const u=`mailto:contact@csoai.org?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(crlf(d.body))}`;expect(d.mailto).toBe(u.length<=1800?u:null);}
 });
});
describe('existing Contact page adoption and static rendering',()=>{
 it('uses the existing preset resolver, including pilot, not a second map',()=>{
  expect(src).toMatch(/enquiryPreset\(window\.location\.search\)/);
  expect(src).not.toContain('subjects[arm]');
  expect(enquiry.enquiryPreset('?arm=pilot')?.message).toContain('useful outcome');
  expect(enquiry.enquiryPreset('?arm=constructor')).toBeNull();
 });
 it('renders a named read-only copy alternative before browser interaction',()=>{
  const html=renderToStaticMarkup(<Contact/>);expect(html).toContain('Copy enquiry instead');
  expect(html).toMatch(/<label[^>]*for="contact-copy-draft"[^>]*>Email draft to copy<\/label>/);
  expect(html).toMatch(/<textarea[^>]*id="contact-copy-draft"[^>]*readOnly=""/);
 });
 it('retains storage-not-delivery wording and the existing submit boundary',()=>{
  expect(src).toContain("submitEnquiry('/api/contact'");expect(src).toContain('not that it has been read or emailed');
  expect(src).toContain('No assessment, booking or payment has started.');
 });
 it('keeps public brand and semantic page tokens without changing the shared lockup',()=>{
  expect(src).toContain('Contact — Council of AI');
  expect(renderToStaticMarkup(<Contact/>)).toContain('bg-background text-foreground');
  expect(src).not.toContain('bg-white');
 });
 it('explains that email-app handoff is not sending and draft copy remains local',()=>{
  const html=renderToStaticMarkup(<Contact/>);expect(html).toContain('does not send the message');
  expect(html).toContain('This copy area stays in this page');
 });
});
