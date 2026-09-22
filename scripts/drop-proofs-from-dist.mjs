#!/usr/bin/env node
// Owner decision 2026-09-22: public/proofs/ (3,993 OpenTimestamps .ots files) leaves the deployed
// site so the tree stays under Cloudflare Pages' 20,000-file cap. Every /proofs/* URL keeps resolving
// through the in-repo `public/_redirects` rule (302 → the HF mirror csoai/councilof-ai-mirror, which
// holds the full tree). This runs inside `build:client` BEFORE pages-size-guard so the guard measures
// what will actually be uploaded. It removes nothing from the repository — only from dist/.
import { existsSync, rmSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const dist = resolve(process.argv[2] || "dist/client");
const dir = resolve(dist, "proofs");
// The rule is checked at its SOURCE (public/_redirects): generate-redirects.mjs writes dist/_redirects later in the chain.
const redirects = existsSync(resolve("public/_redirects")) ? resolve("public/_redirects") : resolve(dist, "_redirects");
if (!existsSync(redirects) || !/^\/proofs\/\*\s+https:\/\/huggingface\.co\/datasets\/csoai\/councilof-ai-mirror\/resolve\/main\/public\/proofs\/:splat\s+302/m.test(readFileSync(redirects, "utf8"))) {
  console.error("✗ drop-proofs-from-dist: refusing — _redirects does not carry the /proofs/* → mirror 302 rule, so dropping proofs/ would break every /proofs/* link");
  process.exit(11);
}
if (existsSync(dir)) { rmSync(dir, { recursive: true, force: true }); console.log("✓ drop-proofs-from-dist: dist/client/proofs removed (served via 302 from the HF mirror)"); }
else console.log("· drop-proofs-from-dist: no dist/client/proofs present");
