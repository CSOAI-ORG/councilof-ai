# App.tsx assembly staging — DO NOT LEAVE PARTIAL PARTS HERE

`assemble-align-app.yml` concatenates `part*.b64` in this directory and writes the
result over `client/src/App.tsx` on master via the GitHub Contents API.

On **1 September** and again on **3 September 2026** exactly one part was staged.
It assembled to **8,000 bytes**, ended mid-identifier at `const EUAIActClas`, and
carried no `export default`. The workflow wrote that over App.tsx both times.

`main.tsx` does `import App from "./App"`, so App.tsx is the app root: a truncated
write ships a blank site. Production survived only because the deploy queue was
jammed and the corrupted build never went out.

Two changes now stand between that and production:

1. The workflow no longer runs on push. Manual `workflow_dispatch` only.
2. It refuses to write unless the assembly is >50 KB, contains `export default`,
   and carries >300 routes. A partial assembly exits 1 and writes nothing.

`client/src/App.integrity.test.ts` asserts the same properties in CI.

If you stage parts here, stage **all** of them, and check the assembled length
matches the real file (~75,845 bytes at the last known-good commit `18357103`).
