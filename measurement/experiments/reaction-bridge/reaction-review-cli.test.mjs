// SPDX-License-Identifier: Apache-2.0
import {test} from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const command=fileURLToPath(new URL("./reaction-review-cli.mjs",import.meta.url));
const H="a".repeat(64),M="b".repeat(64);
const example=[{schema:"csoai.reaction-experiment/0.1",realm:"SIMULATED",condition:"NO_HUMAN",experiment_id:"sample",case_id:"one",input_sha256:H,method_sha256:M,stages:{}}];
const run=(input,opts={})=>spawnSync(process.execPath,[command],{encoding:"utf8",input,...opts});
test("pure stdin review returns explicit unknown",()=>{const r=run(JSON.stringify(example));assert.equal(r.status,0);assert.match(r.stdout,/UNQUALIFIED INPUT/);assert.match(r.stdout,/SIMULATION_ONLY/);assert.match(r.stdout,/UNKNOWN/);assert.equal(r.stderr,"")});
test("empty input refuses",()=>{const r=run("");assert.equal(r.status,2);assert.match(r.stderr,/REVIEW REFUSED/)});
test("invalid JSON refuses",()=>{const r=run("{");assert.equal(r.status,2);assert.match(r.stderr,/REVIEW REFUSED/)});
test("oversized input refuses",()=>{const r=run("x".repeat(256*1024+1));assert.equal(r.status,2);assert.match(r.stderr,/exceeds 256 KiB/)});
test("malformed evidence refuses",()=>{const r=run(JSON.stringify([{schema:"other"}]));assert.equal(r.status,2);assert.match(r.stderr,/REVIEW REFUSED/)});
test("refuses unexpected arguments",()=>{const r=spawnSync(process.execPath,[command,"--execute"],{encoding:"utf8",input:JSON.stringify(example)});assert.equal(r.status,2);assert.match(r.stderr,/usage/)});
