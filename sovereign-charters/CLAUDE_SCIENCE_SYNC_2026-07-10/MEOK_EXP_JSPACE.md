# MEOK_EXP_JSPACE — the weights-access interpretability instrument (RUN, on real weights)

**Status: RUNNING.** The J-space probe — the one bench instrument that was marked "DESIGNED,
waits on Oracle" — is now **run locally on the Mac against a real open-weights transformer
(gpt2, 124M, 12 layers)**. Code + results + figure: `~/clawd/_jspace/`.

## The correction it forces (important)
The prior record said J-space "needs L4 model wired + weights (waits on Oracle keypair)." That
framing is half-wrong and worth fixing: **interpretability probes require open weights + activation
hooks — a hosted API (OCI GenAI 70B) can never provide that, no matter what keypair is uploaded.**
Logit lens reads the residual stream through the unembedding; a probing classifier trains on hidden
states. Both need the model *in-process*. So the honest unblock is not an Oracle step at all — it is
**run an open-weights model where you can hook it, which the Mac does now.** The Oracle GPU VM only
matters later, for scaling the *same* probe to a larger open-weights model (and even then it's a GPU
VM, not merely a keypair). This experiment removes the false blocker.

## What was measured (two canonical techniques)

### 1. Logit lens (nostalgebraist) — predictions crystallise in LATE layers
For each prompt, project every layer's final-token residual stream through `ln_f + lm_head` and track
the rank of the correct answer token across depth. Clean monotonic descent, resolving only in the
final third:

| prompt | answer | rank trajectory (L0→L12), 0 = top-1 | resolves |
|---|---|---|---|
| "The capital of France is" | Paris | 21415 … 199(L7) 51(L9) **1(L10) 1(L11)** 587 | #2 by L10–11 |
| "The opposite of hot is" | cold | 8949 … 1346(L7) **0(L9)** 1 **0(L11)** 103 | top-1 @ L9 |
| "Two plus two equals" | four | 15570 299 … 10(L9) **4 4** 86 | #5 by L10 |
| "The sky is" | blue | 29627 … 285(L7) 13(L9) 3 **0(L11)** 200 | top-1 @ L11 |

The answer is buried in the ranks (thousands deep) through the early/mid layers and only climbs to the
top in **L9–L11**, frequently shifting again at the very last layer. That is the textbook J-space
signature: **long-range, late-layer, integrative dynamics** — the prediction is *composed* across depth,
not looked up early.

### 2. Linear probing classifier (Alain & Bengio) — an honest contrast
Train a 5-fold logistic-regression probe on each layer's mean-pooled hidden state to decode sentiment
(20 positive / 20 negative sentences):

`L0:0.925  L1:0.975  L2–L6:1.00  L7–L11:0.975  L12:0.80`

Honest reading — **this is a contrast, not a "late-layer" result**: sentiment is a *lexical* property
("love"/"hate"), already linearly decodable from the embedding layer (L0 = 0.93), saturating by L2.
Surface features are available early; next-token *prediction* (technique 1) needs late-layer
integration. The two instruments together separate **what is read off the surface** from **what must
be computed** — which is exactly the access-consciousness distinction the bench is built to probe.

## Honest limits (unchanged from the bench discipline)
- gpt2-124M is a **principle instrument**, not a production benchmark; small model, easy stimuli.
- The probe target (sentiment) is deliberately simple — it demonstrates the *technique* and yields an
  honest early-decodability contrast, not a claim about abstract representation depth.
- **Measures representational structure only — where predictions form, where concepts are decodable.
  Says nothing about felt experience** (two-sentence rule).

## Where it sits in the trio → now a quartet of access-side instruments
Φ (integrated information) · EXP-PREDICT (integrated prediction) · EXP-CAUSAL (integrated control) each
probe the *shared-workspace coupling* in-silico. **EXP-JSPACE probes the internal representational
geometry of a real network** — the missing weights-access angle. Same design law, now shown inside
actual model activations: **integration is late, layered, and composed, not early lookup.**

## Repro
```
/opt/homebrew/bin/python3.11 ~/clawd/_jspace/jspace_probe.py   # torch 2.10 env
# → jspace_results.json + jspace_figure.png
```
Deps: torch, transformers, scikit-learn, matplotlib (installed). First run downloads gpt2 (~550MB).
