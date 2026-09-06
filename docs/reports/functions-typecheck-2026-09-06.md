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

---

## RE-MEASURED after installing the types — and the number did not fall the way this report said

This report predicted `npm i -D @cloudflare/workers-types` would remove "181 of 233". The types
are now a real devDependency and the config names them. Measured:

```
                    before   after    delta
TS2304  missing globals  183       0     -183
TS2339  property         28      59      +31
TS2322                    8       7       -1
TS2345                    5       6       +1
TS2769                    3       4       +1
TS2352                    1       3       +2
TS2688                    3       0       -3
TOTAL                   236      84     -152
```

(236, not the 233 first recorded — master moved by three between the two runs.)

**Installing types does not only subtract. It reveals.** With `PagesFunction`, `Request`,
`KVNamespace` and the rest undefined, TypeScript could not check property access *through* them,
so 31 real errors sat underneath the 183 that hid them. "Removes 181 of 233" was arithmetic on
one error code presented as arithmetic on the total, and it was wrong. The honest sentence is:
**183 missing-global errors resolved, 31 real ones revealed, 152 net.**

**And the revealed ones are the defect this report already named.** The first of them:

```
functions/api/_x402.ts(539,72): error TS2339:
  Property 'reason' does not exist on type 'RecordOutcome'.

      if (!recorded.stored) {
        (settlement as Record<string, unknown>).recording_gap = recorded.reason;
```

`RecordOutcome` is a discriminated union on a boolean literal. `!recorded.stored` does **not**
narrow it; `recorded.stored === false` does. That is the same idiom counted at 16 instances
earlier in this report, and the real figure is higher — several of the 31 newly visible TS2339s
are more of it, in `action-jobs.ts` (`BodyRead.status`, `BodyRead.error`) among others.

**84 is the number to work from.** `npm run check:functions` reproduces it. It is not wired to a
gate: wire the gate when the count reaches zero, not before, or every unrelated PR inherits a red
check it did not cause.
