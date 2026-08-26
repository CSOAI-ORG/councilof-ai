# Parallel archive RPC workers — CPU (NEXT_300 #288)

Stage 2 prep: fan-out **read-only** archive / explorer RPC on CPU workers.

- No GPU for contract churn (#289).
- No inventing MEASURED scores from partial RPC responses.
- Rate-limit per upstream; fail closed on custody miss when publishing (#291).
