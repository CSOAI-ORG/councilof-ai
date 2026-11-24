// SPDX-License-Identifier: Apache-2.0
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("./preview.html",import.meta.url),"utf8");
const js=readFileSync(new URL("./preview.mjs",import.meta.url),"utf8");
test("research preview is explicitly unqualified",()=>{assert.match(html,/Local research only/);assert.match(html,/not a CouncilOS production tool/);assert.match(html,/no upload, storage, external request/);});
test("local preview uses real shared operating module",()=>assert.match(js,/from "\.\/operating-view.mjs"/));
test("no implicit network, form submission, storage or raw HTML sink",()=>{for(const s of ["fetch(","XMLHttpRequest","localStorage","sessionStorage","innerHTML","<form","new WebSocket","navigator.sendBeacon"])assert.ok(!html.includes(s)&&!js.includes(s),s);});
test("accessible labeled local input and result",()=>{assert.match(html,/for="cases"/);assert.match(html,/aria-live="polite"/);assert.match(html,/role="status"/);});
test("large inputs and invalid JSON are refused locally",()=>{assert.match(js,/262144/);assert.match(js,/REVIEW REFUSED/);});
