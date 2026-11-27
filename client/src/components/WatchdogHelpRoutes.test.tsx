import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import WatchdogHelpRoutes,{WATCHDOG_HELP_ROUTES} from './WatchdogHelpRoutes';
describe('watchdog referral boundary',()=>{
 const html=renderToStaticMarkup(<WatchdogHelpRoutes/>);
 it('uses explicit fixed destinations and no reporting payload',()=>{
   expect(WATCHDOG_HELP_ROUTES).toHaveLength(7);
   expect(new Set(WATCHDOG_HELP_ROUTES.map(x=>x.href)).size).toBe(7);
   expect(WATCHDOG_HELP_ROUTES.every(x=>x.href.startsWith('/')||x.href.startsWith('https://'))).toBe(true);
   expect(WATCHDOG_HELP_ROUTES.every(x=>!x.href.includes('?'))).toBe(true);
   expect(html).not.toContain('<form');
 });
 it('states limits and sensitive disclosure boundary',()=>{
   expect(html).toContain('not a statutory regulator');
   expect(html).toContain('not established');
   expect(html).toContain('do not send confidential allegations');
   expect(html).toContain('local emergency services');
   expect(html).toContain('do not transmit your report');
 });
 it('renders human enquiry and official links in static markup',()=>{
   for(const r of WATCHDOG_HELP_ROUTES)expect(html).toContain('href="'+r.href+'"');
   expect(html).not.toContain('tel:');
 });
});
