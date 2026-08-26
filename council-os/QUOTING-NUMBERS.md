# QUOTING NUMBERS — binding on every lane and every future session

**Quote `/api/state`. Never assert a count in a report.**

If a number is not in `/api/state`, **it is not established.** Do not publish it, do not
carry it forward from an older report, and do not reconcile two stale figures by picking
the one you like. Measure it, or say it is unmeasured.

```
curl -s https://councilof.ai/api/state | jq .
```

---

## Why this rule exists

In one week, twelve lane reports each published their own counts and they contradicted
each other. The axis count appeared as five different numbers. The MCP fleet appeared as
eight. The card count as three. The RWA instrument count as two.

Some of those differences were real — they counted different things, in different repos,
with different instruments. **Most were stale figures that nothing ever retired**, because
nothing in the estate had the job of retiring them. The board already derived its counts
from signed data. Nothing else did.

`/api/state` is the thing that retires a number.

---

## The rule, in four parts

### 1. Quote by field name, not by value

Write the field path into the report, so a reader can check it:

> The fleet has **1 reachable distinct server**
> (`/api/state` → `mcp_fleet.reachable_distinct_servers.value`, kind `probed`,
> as_of `2026-08-26T11:57:16.969Z`).

Not:

> ~~The fleet has 378 servers.~~

A bare integer in a report has no provenance, cannot be checked, and cannot be retired.
A field path can be re-fetched by anyone reading you, including you next week.

### 2. Carry the `kind` with the number

Every value in `/api/state` has a `kind`, and they are **never interchangeable**:

| kind | means |
|---|---|
| `measured` | A run happened against a frozen bank or source, and was graded. |
| `probed` | Something was contacted and answered, at `as_of`. |
| `catalogued` | It is listed in a register. Nothing was contacted, nothing was run. |
| `declared` | A slot or claim published so a gap is visible. No run behind it. |
| `unmeasured` | It exists and we have not measured it — stated, not implied. |

**Never sum across kinds.** Adding a catalogue count to a probed count is the exact
arithmetic that turned one reachable server into a published fleet of hundreds. A
directory listing is not a fleet. A declared slot is not a measurement.

### 3. When two numbers travel together, publish both

The board carries a slot count and a measured count and they are different numbers.
Quoting the larger one alone claims measurements that do not exist.

Quote `board.public_count.value` (the short sentence) or `board.count_grammar.value` (the
long one). Both already carry both numbers, verbatim from the signed payload — so quoting
them verbatim is always safe, and re-phrasing them is how the error gets reintroduced.

### 4. `as_of` is the artifact's timestamp, never yours

Each value carries `as_of` and `as_of_field`. `as_of` was read **out of the artifact**;
`as_of_field` names the exact key it came from, so you can open the file and check.

There is no `new Date()` in `/api/state`. Two calls, any interval apart, return identical
`as_of` values. Prove it whenever you doubt it:

```
curl -s https://councilof.ai/api/state | jq -S '[..|objects|select(has("as_of"))|{source,as_of_field,as_of}]' > /tmp/a
sleep 5
curl -s https://councilof.ai/api/state | jq -S '[..|objects|select(has("as_of"))|{source,as_of_field,as_of}]' > /tmp/b
diff /tmp/a /tmp/b && echo IDENTICAL
```

> **Check the field name before you trust the check.** A verifier that reads a field which
> does not exist compares `null` to `null` and passes for every input, forever. This repo
> has shipped that defect twice: a prerender check read `errored` when the report's field
> was `err` (515 failed routes reported as clean), and an API stamped `last_checked` at
> request time so two calls three seconds apart returned different "measurements".
> Confirm the field is present and non-null on at least one row *before* you compare two
> runs. `select(has("as_of"))` above is that guard: if it selects nothing, the diff is
> empty and the test proves nothing.

When an artifact carries no timestamp, `as_of` is `null` and `as_of_field` is `null` with
it. That is correct. **Do not substitute** a neighbouring file's date, the deploy time, or
today. Unknown stays null.

---

## The endpoint's authority is bounded

`/api/state` carries a `not_covered` block naming what it does **not** speak for — the
separate `csoai-static-deploy2` estate (whose card count is a different number about a
different set of bytes), the pod-only `gspc-os` server directories, arena axis counts,
in-flight `benchmark-results/` working files, the MEOK/SOVOS estate, and the `csoai.org`
static site.

Read that block before you quote. **Silence in `/api/state` is not permission** to quote a
figure from somewhere else as if it were covered here. If you need a number for one of
those subjects, quote it explicitly as *that* estate's number, on its own line, with its
own source — never merged into a CSOAI count.

---

## Adding a number to `/api/state`

The endpoint is `functions/api/state.ts`. Its rules are not style preferences:

1. **Derive it; never type it.** Compute the value from a committed artifact — count the
   array, do not trust the header that claims the array's length. There is not one
   hand-written count in that file, and adding one breaks the guarantee for every other
   number in the payload.
2. **No `new Date()`.** Read `as_of` from the artifact and name the key in `as_of_field`.
   If the artifact has no timestamp, publish `null` and say why.
3. **Pick the `kind` honestly.** If you are tempted to call a catalogue entry `probed`
   because it would read better, that is the defect, not the wording.
4. **If the value is contested, publish the cross-check.** Where two sources should agree,
   compute both and publish the boolean — `board.live_derivation_crosscheck`,
   `signed_cards.header_agrees`, `rwa_instruments.header_agrees`. When a cross-check is
   false, **neither** number is quotable until it is fixed. Do not pick one.

---

## In one line

> Quote `/api/state` by field name, with its `kind` and its `as_of`. If it is not there,
> it is not established.
