#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Manual-only read-only operator report from authorised, bounded, non-private JSON on stdin.
// No scheduler, file writes, HTTP request, proof/signing, model invocation, deployment or action.
import { summarizeReactionCases, renderOperatingView } from "./operating-view.mjs";
const LIMIT=256*1024;
async function main() {
  if(process.argv.length!==2)throw Error("usage: node reaction-review-cli.mjs < approved-public-episodes.json");
  let bytes=0,raw="";
  for await(const piece of process.stdin) {
    bytes+=piece.length;
    if(bytes>LIMIT)throw Error("input exceeds 256 KiB");
    raw+=piece.toString("utf8");
  }
  if(!raw.trim())throw Error("no JSON supplied");
  const records=JSON.parse(raw);
  process.stdout.write(renderOperatingView(summarizeReactionCases(records))+"\n");
}
main().catch(error=>{
  const msg=error instanceof Error?error.message:"invalid input";
  process.stderr.write("REVIEW REFUSED: "+msg.replace(/[\r\n]+/g," ").slice(0,180)+"\n");
  process.exitCode=2;
});
