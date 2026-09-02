# provider-diff leaves

Unsigned card-v0 `public.notice` atoms staged by `scripts/watch/provider_watch.py`
(`card-<provider>-<surface>-<stamp>-unsigned.json` per detected change,
`card-daily-<stamp>-unsigned.json` per run). Read by `scripts/adapters/provider_diff.py`;
signed only by the GHA public-root writer. Each attests that the normalised bytes at a
public URL differed between two captures — nothing about what changed or why. No content
is stored. Not a grade. Backfill: none.
