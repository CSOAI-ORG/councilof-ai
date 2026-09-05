# TRIGGER-GATED DRAFT — "N surfaces live". DO NOT SEND YET.

## The measurement that must be true first

```
jq '[.[] | select(.status=="live")] | length' scripts/badger/_spray-log-v2.json
curl -s https://councilof.ai/api/press.json | jq .distribution_surfaces
```

**Send only when that count is greater than zero, and use that exact number.** As of 2026-09-05
it is **0**: the spray log holds 24 `drafted` and 3 `queued` rows, every one owner-gated, and no
`live` ones.

`/api/press.json` publishes `distribution_surfaces.live` as **null, not 0**, for the same reason
this draft is gated: a drafted row is not a placement, and a zero would read as a measured result
rather than an absence. Counting drafts as placements is how a distribution number becomes
fiction.

---

## The draft, for when it is true

# The Council of AI board is now readable on N surfaces

The live measurement board is mirrored to N surfaces. **Reach is distribution, not authority.**

The authority is, and stays, `GET /api/gspc` plus the signed cards and free verification. A
directory listing is not a grade. A download counter is not a measurement. Mirrors are convenience
for the reader, and every one of them derives from the same endpoint — if a mirror and the board
disagree, the board is right and the mirror is stale.

Fill N from the command above. Name the surfaces individually, with a link each, so a reader can
check any one of them. Do not publish a total that no per-surface list adds up to.

**Check it, don't take it:**
```
curl -s https://councilof.ai/api/press.json | jq .distribution_surfaces
curl -s https://councilof.ai/api/gspc | jq -r .totals.public_count
```
