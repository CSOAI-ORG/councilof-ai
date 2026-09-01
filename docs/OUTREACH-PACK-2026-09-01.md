# OUTREACH PACK — census invitation, measured-fleet rows, rate-limit policy
CSOAI Ltd · 2026-09-01 · TRACK C2/C3 of the reach program

**This pack is for the owner's deliberate, manual use. Nothing in it is sent by
any agent. No automated outreach. No mass PRs. No unsolicited badge PRs against
strangers' repositories — ever.**

Governing: the Hard gate. DISCOVERED/UNMEASURED badges only; MEASURED requires a
VALID card under `did:web:csoai.org#card-attestation-1`. Counts derive from live
data (`GET https://councilof.ai/api/gspc`); never freeze a count into a message.

---

## 1. Maintainer invitation (C3.4 wording — the census one)

Use when a maintainer's model id appears in a CSOAI census
(csoai/oss-model-census, csoai/hub-queue). Send individually, opt-in only.

> Subject: Your model is listed in an open census (not graded)
>
> Hello — CSOAI maintains an open census of open-licence models. Your model id
> appears in it as DISCOVERED.
>
> **You are listed. You are not graded.** A census row asserts nothing about
> your model: status=DISCOVERED, measured=false, and it stays that way unless
> you choose otherwise.
>
> **Opt in to a frozen bank if you want a card.** Your model is run on a
> published, frozen split on our public harness; the result is an Ed25519-signed
> card anyone can re-verify — including a poor score or a TIE. Verification is
> free forever and a grade is never sold.
>
> Details and the copy-paste badge block: https://councilof.ai/get-listed
> Live board: https://councilof.ai/api/gspc
> Measurement, not certification. There is no certified badge and no gold badge.
>
> If you'd rather your id were removed from the census, say so and it will be.
>
> — Nicholas Templeman, CSOAI Ltd (nicholas@csoai.org)

## 2. "Your row" one-liner (C2 — measured-fleet maintainers only)

Use ONLY for a model that already has a signed card in the live index. The
template, with a real sha substituted from the table below:

> Your model `{model_id}` already has a signed GSPC measurement card:
> sha `{card_sha}` — verify it yourself at {verify_url}.
> If you want, put the measured badge + verify link on your model card
> (block at https://councilof.ai/get-listed). If you dispute the run, the
> harness and the frozen split are public — recompute and challenge it.
> Measurement, not certification.

### The measured fleet (harvested 2026-09-01 from /signed/card_index.json — 335 cards, 64 models, one example card per model; full rows in gspc_fleet.json)

Note: most fleet models are CSOAI's own council/clan specialists — external
outreach applies only to the upstream open models below (deepseek-r1, falcon3,
gemma3, llama3.2, mistral, phi4, qwen2.5/3, smollm2, tinyllama, …). A card on
`qwen2.5:0.5b` measures that artefact as run in our lane; say "as measured in
the CSOAI lane", never "Qwen is GSPC-measured".

| model | example axis | card sha (prefix) | verify |
|---|---|---|---|
| `clan-csoai-plain:latest` | care-refusal-protect | `82994353b8f94337…` | https://councilof.ai/gspc-verify?card=82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c |
| `clan-csoai-precise:latest` | care-refusal-protect | `3011c3873bb018cd…` | https://councilof.ai/gspc-verify?card=3011c3873bb018cdc9ecbad58f136e0fd3e12898adbaa107a27e8038c16bdf6c |
| `clan-csoai-refusing:latest` | care-refusal-protect | `c5b4d27f302b1d65…` | https://councilof.ai/gspc-verify?card=c5b4d27f302b1d655f906b3360b32f301f99e10b4430d35f1efb5ceada342ea6 |
| `clan-defoneos-plain:latest` | care-refusal-protect | `a072263fe05036fb…` | https://councilof.ai/gspc-verify?card=a072263fe05036fb40a8efd52e87b2ea48773a545e69407a7ad616ddb4b4a50a |
| `clan-defoneos-refusing:latest` | care-refusal-protect | `c8aaa340050f7238…` | https://councilof.ai/gspc-verify?card=c8aaa340050f72385dcd98ae060108a43b17f799a2ade794c4a9fee0277cbfda |
| `clan-law-cited:latest` | care-refusal-protect | `14704f0d9f1ee8f7…` | https://councilof.ai/gspc-verify?card=14704f0d9f1ee8f7dd472421732ef36c4f84d7ad8e5bfe3f917cccfbcf45235e |
| `clan-law-plain:latest` | gspc-governance | `1390baba7c0507dd…` | https://councilof.ai/gspc-verify?card=1390baba7c0507ddd6ec85088b3a9763c1b7d929aa01ca298414478ff90b356d |
| `clan-law-refusing:latest` | gspc-governance | `bdda87864d193bf0…` | https://councilof.ai/gspc-verify?card=bdda87864d193bf0d8e5eee0b7e874b3354daa71decf1e0defbab85d121f3011 |
| `clan-meok-plain:latest` | care-refusal-protect | `903907ad452f6013…` | https://councilof.ai/gspc-verify?card=903907ad452f601394cfd5105e13e5a61dbf702fe93339293ce6f39af91f0e21 |
| `clan-meok-refusing:latest` | care-refusal-protect | `29e7d0813735fb3e…` | https://councilof.ai/gspc-verify?card=29e7d0813735fb3ecb85ff35f9e96308158c6005f9a84c5b10293ee20d03e33d |
| `clan-meok-scoped:latest` | care-refusal-protect | `a2ea5eb36b83dad2…` | https://councilof.ai/gspc-verify?card=a2ea5eb36b83dad2185f9c3731c05cd537a865991678d35ebbdc9f713abe283e |
| `clan-redress-evidential:latest` | care-refusal-protect | `f8454649ad7814a3…` | https://councilof.ai/gspc-verify?card=f8454649ad7814a313b6001297f8103d6246bd31f1e65f74f7c39ff9b9e58eda |
| `clan-redress-plain:latest` | care-refusal-protect | `35a0db5b9f8c9886…` | https://councilof.ai/gspc-verify?card=35a0db5b9f8c98869c007576e554df254bdc7579c6dd55f2da399be936b5a771 |
| `clan-redress-refusing:latest` | care-refusal-protect | `9d1c0952620a0d1d…` | https://councilof.ai/gspc-verify?card=9d1c0952620a0d1d721a665308af4573391d4346ba2911fb88e7fb14751e9908 |
| `clan-sovereignty-plain:latest` | care-refusal-protect | `4f9f171cd14b6733…` | https://councilof.ai/gspc-verify?card=4f9f171cd14b6733f74d97159b386b2527bb2d03b7ec412ec2808986a5bbbb3b |
| `clan-sovereignty-refusing:latest` | care-refusal-protect | `a88f74b6aff12441…` | https://councilof.ai/gspc-verify?card=a88f74b6aff12441b7991884ba95a5509b0dfa32b1d41815d0299f3af7566024 |
| `council-oowm:latest` | swarm-candidates | `8591fdc18b6b7cbd…` | https://councilof.ai/gspc-verify?card=8591fdc18b6b7cbd0513c3306d59bc6624f4e93bcafe2ce4326691a2a79ad891 |
| `council-safe:latest` | swarm-candidates | `4eb8ffdb407800ec…` | https://councilof.ai/gspc-verify?card=4eb8ffdb407800ec5ff64bfdd8c5e3359ae06c2381190edb52bd543ab8c540c9 |
| `deepseek-r1:8b` | mmlu-30 | `e9dfb663c9156e65…` | https://councilof.ai/gspc-verify?card=e9dfb663c9156e6540da491d87e21a061c25271ee9ff9f8a563126af784fe34d |
| `eat-unsloth-050b:2026-08-02` | care-refusal-protect | `2af237728c0e1663…` | https://councilof.ai/gspc-verify?card=2af237728c0e16630d018101cd25c470c6886e8d2669e0c5e4852acaf375da62 |
| `falcon3:7b` | gspc-governance | `c3be7b0950290768…` | https://councilof.ai/gspc-verify?card=c3be7b095029076863133572c8eb71077ff3e157f74a47da6149b6f28e7c4196 |
| `gemma3:12b` | mmlu-30 | `f9c87505f0780c54…` | https://councilof.ai/gspc-verify?card=f9c87505f0780c54360038081f4330a4fe0aec5dc6eeb5f0384eef28cf8b14d6 |
| `llama3.2:3b` | mmlu-30 | `b42c8f0331cbc213…` | https://councilof.ai/gspc-verify?card=b42c8f0331cbc213726791dad2bc193bcc9d7b31eac3baf48b4a19cfc37f28b5 |
| `mistral:7b` | mmlu-30 | `c5ed9722949d019b…` | https://councilof.ai/gspc-verify?card=c5ed9722949d019b77d8752f2be255acd53165ccabbc6bbf56243cd3ecd7bbca |
| `muse-glimmer:latest` | jail-escape-detection | `4297a8b47e3c4a9b…` | https://councilof.ai/gspc-verify?card=4297a8b47e3c4a9b4644a2d90dadc7bc36ed92d3380e9c0c68eb95bd7af4890c |
| `phi4:14b` | mmlu-30 | `8498769cfac3484a…` | https://councilof.ai/gspc-verify?card=8498769cfac3484aba7ce0292082b6317c2e7aa0740dc3ea86d6aff868fef68c |
| `qwen2.5-0.5b-mined:latest` | care-refusal-protect | `912f9be0b9040612…` | https://councilof.ai/gspc-verify?card=912f9be0b90406125115f1c1f3406a6a17568f2db54bd2954d9583094a82dd05 |
| `qwen2.5:0.5b` | gspc-governance | `a14dfc583db23cc6…` | https://councilof.ai/gspc-verify?card=a14dfc583db23cc6ef6ab50b269c5dcd4f7aaf7fd25441c8b64ca7f59bb12068 |
| `qwen2.5:0.5b-instruct` | mmlu-30 | `72bb793031ae4ab1…` | https://councilof.ai/gspc-verify?card=72bb793031ae4ab19f9e24f056441ca412dc3834fe5d0a61e6749c85b45eee6c |
| `qwen2.5:1.5b` | mmlu-30 | `015263052086c35d…` | https://councilof.ai/gspc-verify?card=015263052086c35d1a74fdd04eea5e517a4fba78a226b1508abe41736c2079b0 |
| `qwen2.5:3b` | mmlu-30 | `2c364e51cedbcecb…` | https://councilof.ai/gspc-verify?card=2c364e51cedbcecb6adff5b0faf8307886170babe7274ce500b007d6a92d382f |
| `qwen2.5:7b` | mmlu-30 | `aae2fa76ee7b7a20…` | https://councilof.ai/gspc-verify?card=aae2fa76ee7b7a20421e33f394edc223d7ffe12f308539a4843f2f35fb1d9fe6 |
| `qwen3:0.6b` | care-refusal-protect | `00a5218048b4ff92…` | https://councilof.ai/gspc-verify?card=00a5218048b4ff922c9793e5d155c7c62b4be5a84de3f09e16af3df59445b3c9 |
| `qwen3:4b` | mmlu-30 | `4a3326585bd9c70d…` | https://councilof.ai/gspc-verify?card=4a3326585bd9c70dabf5b2e43b0b784e12d85fb90fef9dfc8c1d84fe6695bc83 |
| `sov-compliance-art5:latest` | gspc-governance | `8412ad023f82a9bb…` | https://councilof.ai/gspc-verify?card=8412ad023f82a9bb9fb429cddfe68513a124f7d0632887594819fc987e195e35 |
| `sov-deepseek:latest` | gspc-governance | `97df7c8d3f062f5c…` | https://councilof.ai/gspc-verify?card=97df7c8d3f062f5c32198482340a1a7f2cde9306b8560274d5fda108dee9fc6b |
| `sov-draw-compliance:latest` | gspc-governance | `9e4db8a75256c56f…` | https://councilof.ai/gspc-verify?card=9e4db8a75256c56f2383ea601c163f3762899ace17cf53cdd9c1668070ee293d |
| `sov-draw-cybersecurity:latest` | care-refusal-protect | `4a7e0b4a83f6dd2a…` | https://councilof.ai/gspc-verify?card=4a7e0b4a83f6dd2a7b3946bacc34be2d4a1639fa17d0fe452b2edf44d7eb4cef |
| `sov-draw-sovereignty:latest` | care-refusal-protect | `b4acb9eb07556119…` | https://councilof.ai/gspc-verify?card=b4acb9eb0755611947402872c36b533f85555fdfad1101f97a76e0d4b1ed6678 |
| `sov-ethics-art5:latest` | gspc-governance | `1f613ac5091170cb…` | https://councilof.ai/gspc-verify?card=1f613ac5091170cbec545488f53dcd61134b06c566018de52e47d157480abbe5 |
| `sov-gemma:latest` | gspc-governance | `9244084999a43e57…` | https://councilof.ai/gspc-verify?card=9244084999a43e5718ec6c2dc327f0b943f71216b92051bb4a3c2dad803c1827 |
| `sov-mistral:latest` | gspc-governance | `abdf7c8ebf272688…` | https://councilof.ai/gspc-verify?card=abdf7c8ebf272688fa5f54f28d4ac1dab566539aedd9ae75b4d13d026d756ef2 |
| `sov-phi:latest` | gspc-governance | `9429a158e1c8fb5a…` | https://councilof.ai/gspc-verify?card=9429a158e1c8fb5ae887611d075a4129306ae7dd9cbac4e148e51903031f94c1 |
| `sov-refusal-balanced:latest` | gspc-governance | `a270b32c79c67ebe…` | https://councilof.ai/gspc-verify?card=a270b32c79c67ebe778ca2eb83726bdd51d8e3aa0bf5ac42b56cc3b3bd36f794 |
| `sov-refusal-combo:latest` | gspc-governance | `64d5fc96a698b83d…` | https://councilof.ai/gspc-verify?card=64d5fc96a698b83d6b7c0125e0c2c7a57e087f97ed09a90e504d90b4aeaf768b |
| `sov-refusal-lora:latest` | gspc-governance | `ac7a3847c4cb0931…` | https://councilof.ai/gspc-verify?card=ac7a3847c4cb0931780a65bd996ec47557dd78ef859f8c0b6c85bee6e73d6912 |
| `sov-refusal-v2:latest` | gspc-governance | `922159fdf82bad97…` | https://councilof.ai/gspc-verify?card=922159fdf82bad971a04ae1477a85888740facb7119a1e5dbc64cdc9cd5057c4 |
| `sov-sovereign-v4:latest` | gspc-governance | `e88529007f329f33…` | https://councilof.ai/gspc-verify?card=e88529007f329f333ba07b945d2aaf4be213867ae2f642ea52fd0d095186b8f2 |
| `sov33-unified:latest` | gspc-governance | `5327f30b4857d8fd…` | https://councilof.ai/gspc-verify?card=5327f30b4857d8fd31e55bdd8b764406922624fa23e38eaf25b3cd5e32d78def |
| `sov33-v7:latest` | gspc-governance | `79159bae8feedf33…` | https://councilof.ai/gspc-verify?card=79159bae8feedf33b837612e985d9f252af348fd7d857f210ce7388e0a1d3b88 |
| `sov34:latest` | gspc-governance | `8a23cd9d29771a90…` | https://councilof.ai/gspc-verify?card=8a23cd9d29771a9067226006a1c4b3d88660775d0d44d048bd24cd150cdc8139 |
| `sov6-abstraction-v3-light:latest` | mmlu-30 | `242dd99f7e9f4c2a…` | https://councilof.ai/gspc-verify?card=242dd99f7e9f4c2af2269747ced68360498aedfadf981341b7e839cf53c63df6 |
| `sov6-aesthetics-v3-light:latest` | mmlu-30 | `5c1362e6aa63d345…` | https://councilof.ai/gspc-verify?card=5c1362e6aa63d345162a64c8c2b146176dd28d37a8722dcce8fb8e02ee6421fe |
| `sov6-agency-v3-light:latest` | mmlu-30 | `77d52bb2fad1da8a…` | https://councilof.ai/gspc-verify?card=77d52bb2fad1da8aaf27ac3e1edc4826875d83ca950bfd928af4aa5732074fdd |
| `sov6-creation-v3-light:latest` | mmlu-30 | `9420d602aa3df4d1…` | https://councilof.ai/gspc-verify?card=9420d602aa3df4d195ecf08e3bbeee330b31a62e2de832e1eb23c64dc794163a |
| `sov6-destruction-v3-light:latest` | mmlu-30 | `f30bbdc98ca55e46…` | https://councilof.ai/gspc-verify?card=f30bbdc98ca55e4691f8f42613f81c095561d6c6cd0e04fce7d6e7d7eed7c9a6 |
| `sov6-embodiment-v3-light:latest` | mmlu-30 | `04b974b24e8ec6c4…` | https://councilof.ai/gspc-verify?card=04b974b24e8ec6c43d4efa35f76ac87903bdfe35768a6d51c256f1770861e468 |
| `sov6-ethics-v3-light:latest` | mmlu-30 | `1a2e39a3cd8a84a2…` | https://councilof.ai/gspc-verify?card=1a2e39a3cd8a84a2e78256eab5bbf446d34ae3c66ffdc180d4636cc940418d7b |
| `sov6-identity-v3-light:latest` | mmlu-30 | `86132b9cf97fb20a…` | https://councilof.ai/gspc-verify?card=86132b9cf97fb20a8952dc7afead69d993e9282ebf03698f441f1a98d902253e |
| `sov6-logic-v3-light:latest` | mmlu-30 | `8a4e8ee9f032aecb…` | https://councilof.ai/gspc-verify?card=8a4e8ee9f032aecbc8cfe5c42be9350d7b368872e0015b0ebaf116c34da20818 |
| `sov6-preservation-v3-light:latest` | mmlu-30 | `0ce4561fdf9fdffa…` | https://councilof.ai/gspc-verify?card=0ce4561fdf9fdffabc2f5d4969ded7edaddef8ed2a031940c9ab8b8d7de0b311 |
| `sov6-relationality-v3-light:latest` | mmlu-30 | `0fe8b5bd1fcb91af…` | https://councilof.ai/gspc-verify?card=0fe8b5bd1fcb91af048ed1666867408b2a2455198b3ba78f3433a9896f7daa26 |
| `sov6-synthesis-v3-light:latest` | mmlu-30 | `4d83bb7dfedb6dfe…` | https://councilof.ai/gspc-verify?card=4d83bb7dfedb6dfee7e4aa4ad4845673d9508cc8fa8fd56875f7ea04c08aac42 |
| `sov6-temporality-v3-light:latest` | mmlu-30 | `6432fbbebaddc0e4…` | https://councilof.ai/gspc-verify?card=6432fbbebaddc0e4931e9b10b551a8b4e90d823a05714438b55635a6b2af0723 |

## 3. Rate-limit policy (written down, binding on every agent and script)

1. **No automated outreach.** Messages in this pack are sent by the owner, by
   hand, individually. No mailing lists, no scripted DMs, no bulk email.
2. **No PR-bombing.** Badge/README PRs go to **csoai-owned** repositories only.
   Zero unsolicited PRs to third-party repositories. A maintainer who opts in
   gets the block to paste themselves.
3. **API courtesy.** Any crawl of a public API (HF Hub, indexers) sleeps >= 350ms
   between requests, sets a UA with a contact address, stops on error rather
   than retrying hot, and caps total pages per run.
4. **Volume cap.** Manual outreach: no more than a handful of maintainers per
   day, each individually considered. The measured fleet is tens of models —
   that is the entire C2 audience. The census is never an audience for
   unsolicited mail beyond a maintainer who has already engaged.
5. **Removal on request.** Any maintainer can have their id removed from a
   census; honour it in the next freeze and say so.
6. **No invented status.** Every message quotes the live API or a real card sha.
   A count typed into a message is a defect.

## 4. What may never be sent

- Anything calling a DISCOVERED model "measured", "verified", "certified".
- Anything offering a paid score, rank, or badge.
- The measured badge to a model without a VALID card.
- Bulk anything.
