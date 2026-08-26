# Board ruling — 2026-08-26 (owner: Nick Templeman)

**"150 + 335 — add them up."**

Measured result: the 150-card index is a **strict subset** of the 335-card index
(overlap 150/150; same pubkey, same schema `csoai.gspc-card-index/0.1`, same chain
head `66856aca…`). The union is therefore the **335 verified-card board**, which is
what `public/signed/card_index.json` on master carries.

The war machinery (reject-335-board.yml, sticky335-land-atomic.yml, the
card_index_335 CI payload dirs) is removed. `signed-json-guard` remains the only
adjudicator: bytes verify or they don't. Any future change to the board index goes
through a PR against the guard — never a direct counter-push.
