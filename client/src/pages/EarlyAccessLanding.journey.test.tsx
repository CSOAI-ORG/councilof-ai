// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { expect, it } from 'vitest';
import EarlyAccessLanding from './EarlyAccessLanding';

it('offers concrete public journeys instead of acknowledging an unsent waitlist signup', () => {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<Router ssrPath="/early-access"><EarlyAccessLanding /></Router>);
  expect(host.querySelectorAll('h1')).toHaveLength(1);
  expect(host.querySelector('form')).toBeNull();
  expect(host.querySelector('a button,button a')).toBeNull();
  const links = [...host.querySelectorAll('a')].map(a=>a.getAttribute('href'));
  for (const href of ['/gspc-verify','/dashboard?tab=board','/tools','/assess/','/dashboard?tab=learn']) expect(links).toContain(href);
  for (const obsolete of ['/signup','/courses','/start']) expect(links).not.toContain(obsolete);
  for (const promise of ['Check your email','Lifetime founding','10,000','Limited to first','every feature']) expect(host.textContent).not.toContain(promise);
});
