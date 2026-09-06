# functions/ has never been type-checked — 233 errors, and what they are

`tsconfig.json` includes `client/src/**/*` and `shared/**/*`. **`functions/` is in neither**, so
`npm run check` has never looked at a single Cloudflare Pages Function — not `/api/verify`, not
`_x402.ts`, not `cardSign`/`cardVerify`, not the MCP handlers. 556 TypeScript files.

    npx tsc --noEmit
    error TS18003: No inputs were found ... include ["client/src/**/*","shared/**/*"]

## The count, at the repo's own strictness

`tsconfig.functions.json` mirrors `tsconfig.json` (`strict: false`, ES2022, bundler) on purpose:
a first pass with `strict: true` reported **335** and invented ~109 implicit-any errors that are a
strictness *I* chose, not a defect the repo has. Excluding `*.test.ts`.

    npm run check:functions        233 errors across 126 of 556 files

    181  TS2304  Cannot find name  — 156 PagesFunction, 24 KVNamespace, 1 EventContext
     52  real type errors
    ---
    233

**181 of 233 are one missing package.** `@cloudflare/workers-types` is not installed, and two
files already reference it directly (`hub-cards.ts` → *"Cannot find type definition file for
'@cloudflare/workers-types'"*), so the dependency was assumed long before it was declared. **Not added here.** `npm install --package-lock-only` for it removed 53 other package entries from `package-lock.json` — `@drizzle-team/brocli`, the `@esbuild-kit/*` transitives — and a lockfile change that broad belongs in its own PR where it is the subject, not a side effect of a report. `pr-gates` runs `npm ci`, which fails outright when package.json and the lock disagree, so shipping the dependency without the lock was never an option either.

Sixteen TS2307 "cannot find module" errors in the first run were **my sparse checkout**, not the
code — JSON imports of `public/signed/*` and `evidence/*`. They vanished once those paths were
checked out. R13: a checker that cannot see its inputs is not reporting on the code.

## The 52 real ones

    16  Property 'reason' does not exist on '{ ok: false; reason: string } | { ok: true; ... }'
     7  Type 'boolean' is not assignable to type 'number'
     5  Property 'request' does not exist on type 'unknown'
     5  Uint8Array<ArrayBufferLike> not assignable to BufferSource / BodyInit
     2  Cannot find type definition file for '@cloudflare/workers-types'
    17  assorted (TS2322/2345/2769/2739/18046)

### The 16 are one idiom, and they are type-level only

`if (!r.ok)` does **not** narrow a boolean-literal discriminated union; `if (r.ok === false)`
does. Reduced to a four-line repro:

```ts
type R = { stored: true; record: string } | { stored: false; reason: string; record: string | null };
async function a() { const r = await rec(); if (!r.stored)        { return r.reason; } return ""; } // TS2339
async function b() { const r = await rec(); if (r.stored === false) { return r.reason; } return ""; } // ok
```

Only `a` errors. **At runtime the two are identical**, so none of these 16 is a live defect — the
field is present on the branch the code actually takes. They are real type errors and a real
readability trap, not a behaviour bug, and the fix is mechanical.

## Six touch an x402 or signing door

    _x402.ts:539                          recorded.reason  (the 16-idiom; recording_gap bookkeeping)
    witness.ts:122                        g.reason         (the 16-idiom; fail-closed guard)
    receipts/batch.ts:188,195,196         the 16-idiom, three times
    _witness.ts:389                       Uint8Array not assignable to BodyInit
    hub-cards.ts:31                       missing @cloudflare/workers-types
    interop/scitt-root-signed-statement.json.ts:22   Uint8Array not assignable to BufferSource

Every one of the payment/witness `reason` errors is the narrowing idiom above, so **no payment or
signature outcome changes because of them**. That is the answer to the question C13 asks, and it
is a better answer than a count.

## Not wired into pr-gates

Deliberately. `pr-gates` is green today; adding this would turn it red on 126 files with no plan,
and the v3 rule is that gates are never widened to make a tip deployable — the inverse applies
too. Land the checker and the number first; fix in batches; wire the gate when the count is zero.

    npm i -D @cloudflare/workers-types    # removes 181 of 233; own PR, lockfile included
    # then set "types": ["@cloudflare/workers-types"] in tsconfig.functions.json
    npm run check:functions               # then 52
