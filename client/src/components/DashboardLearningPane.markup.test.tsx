import {afterEach, describe, expect, it, vi} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Router} from 'wouter';
import DashboardLearningPane from './DashboardLearningPane';
import {GSPC_LEARNING_PATHS, CANONICAL_AXIS_COUNT} from '../data/gspc-learning-paths';

// Actual imported component graph; SSR only, not a browser or effects/navigation test.
const render=()=>renderToStaticMarkup(<Router ssrPath="/dashboard?tab=learn"><DashboardLearningPane/></Router>);
afterEach(()=>vi.unstubAllGlobals());
describe('learning component integration markup',()=>{
 it('renders the existing component without executing a network request',()=>{
  const f=vi.fn(()=>{throw new Error('Unexpected network call');});vi.stubGlobal('fetch',f);
  expect(render()).toContain('data-testid="dashboard-learning-pane"');expect(f).not.toHaveBeenCalled();
 });
 it('renders every derived axis in the mobile selector and desktop chooser',()=>{
  const html=render();
  expect((html.match(/<option /g)||[]).length).toBe(CANONICAL_AXIS_COUNT);
  for(const path of GSPC_LEARNING_PATHS) expect(html).toContain(`data-axis-learning="${path.axis.id}"`);
  expect(html).toContain('value="effect-binding"');
 });
 it('provides labels and five ordered stage markers',()=>{
  const html=render();expect(html).toContain('for="learning-axis-select"');
  expect(html).toContain('for="learning-axis-search"');
  for(const stage of GSPC_LEARNING_PATHS[0].stages) expect(html).toContain(`data-testid="learning-stage-${stage.id}"`);
 });
 it('initially labels source as reading, with no invented retrieval time',()=>{
  const html=render();expect(html).toContain('Reading source context');
  expect(html).toContain('No successful source read in this attempt.');
  expect(html).not.toContain('Retrieved in this session:');
 });
 it('keeps practice and independent evidence visibly separate',()=>{
  const html=render();expect(html).toContain('PRACTICE_ONLY');expect(html).toContain('UNMEASURED');
  expect(html).toContain('Completing practice does not create an independently measured result');
  expect(html).not.toContain('Practice path reviewed');
 });
 it('keeps the learner inside the existing Council navigation',()=>{
  const html=render();expect(html).toContain('href="/dashboard?tab=space"');
  expect(html).toContain('href="/dashboard?tab=play"');expect(html).toContain('href="/dashboard?tab=tools"');
  expect(html).toContain('aria-label="Council workspace modes"');
 });
});
