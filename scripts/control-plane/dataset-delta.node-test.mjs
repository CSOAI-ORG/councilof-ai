// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { datasetManifest, compareDatasetManifests } from "./dataset-delta.mjs";
test("single byte mutation is detected without poisoning claim", () => {
 const a=datasetManifest([{path:"train/1.json", bytes:"hello"}]);
 const b=datasetManifest([{path:"train/1.json", bytes:"hellO"}]);
 const d=compareDatasetManifests(a,b);
 assert.deepEqual(d.changed,["train/1.json"]);
 assert.equal(d.identical,false);
 assert.equal(d.assurance,"EXACT_BYTES_ONLY_NO_POISONING_OR_BEHAVIOURAL_VERDICT");
});
test("identical bytes, insertions and removals are distinct",()=>{
 const a=datasetManifest([{path:"a",bytes:"one"},{path:"b",bytes:"two"}]);
 assert.equal(compareDatasetManifests(a,a).identical,true);
 const b=datasetManifest([{path:"b",bytes:"two"},{path:"c",bytes:"three"}]);
 assert.deepEqual(compareDatasetManifests(a,b).removed,["a"]);
 assert.deepEqual(compareDatasetManifests(a,b).added,["c"]);
});
test("reject path traversal, duplicates and tampered manifests",()=>{
 assert.throws(()=>datasetManifest([{path:"../bad",bytes:"x"}]),/unsafe/);
 assert.throws(()=>datasetManifest([{path:"a",bytes:"1"},{path:"a",bytes:"2"}]),/duplicate/);
 const a=datasetManifest([{path:"ok",bytes:"x"}]);
 assert.throws(()=>compareDatasetManifests(a,{...a,entries:[{...a.entries[0],sha256:"b".repeat(64)}]}),/tampered/);
});
