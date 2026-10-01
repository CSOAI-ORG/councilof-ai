import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const app = read('client/src/App.tsx');
const buyer = read('public/pay.html');
const redirects = read('public/_redirects');
const sitemap = read('public/sitemap.xml');

test('buyer page owns /pay and owner wallet tool owns /pay-all', () => {
  assert.match(buyer, /<link rel="canonical" href="https:\/\/councilof\.ai\/pay"/);
  assert.match(app, /<Route path="\/pay-all" component=\{PayEveryDoor\} \/>/);
  assert.doesNotMatch(app, /<Route path="\/pay" component=\{PayEveryDoor\} \/>/);
  assert.match(redirects, /^\/pay\/\s+\/pay\s+308$/m);
  assert.match(redirects, /^\/pay-all\s+\/pay-all\/\s+308$/m);
  assert.doesNotMatch(redirects, /^\/pay\s+\/pay\/\s+308$/m);
  assert.match(sitemap, /<loc>https:\/\/councilof\.ai\/pay<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/councilof\.ai\/pay-all\/?<\/loc>/);
});
