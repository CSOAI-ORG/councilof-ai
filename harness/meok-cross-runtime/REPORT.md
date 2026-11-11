# MEOK: actual execution across Hugging Face, Kaggle and Cloudflare

11 November 2026. Research result; original model unchanged.

## Result

The existing 980-parameter synthetic process predictor ran on the M4, on Kaggle CPU, through the existing private Hugging Face MCP tool and through a Cloudflare remote-development Worker. This establishes a bounded cross-runtime connection, not a new trained model or a claim that nobody else has built portable inference.

| Runtime | Actually executed | Comparison |
|---|---|---|
| Apple M4 / Python 3.14.7 | 560 public synthetic rows | Local reference, all raw/constrained outputs retained |
| Kaggle / Python 3.13.18 | Version2 COMPLETE, 560 rows | 4,480 output values matched M4 exactly |
| Existing Hugging Face MCP worker | 15 selected rows including the retained worst case; two invalid inputs and recovery | Exact numerical agreement;15 canonical unsigned event output digests verified |
| Cloudflare remote-development Worker | 70 eight-row batches plus health/refusal/recovery:78HTTP requests | 560rows/4,480values; max difference5.551115123125783e-16, below the predeclared1e-12tolerance |

The Node handler also passed25 contract checks. These counts are not independent intelligence measurements. The original constrained mean error remains0.0028797331109599016 and worst component error0.7499076603275624 on this public same-generator bank. No fitting, tuning, weight merging or blind benchmark was performed.

## Cloudflare: what ran, and what did not

The Worker uses the exact existing JS numerical core and pinned weights. It rejects incorrect model pins, malformed/oversize inputs and unsupported requests; it returns byte-hashed responses, explicitly without execution authority. It has no external-fetch, AI, storage, queue, database or secret bindings. The configured CPU ceiling is10ms/request; at most8 feature rows and8192input bytes are accepted. The preview refuses predictions after12November2026 00:00UTC.

A standalone named Preview was created without a production workers.dev endpoint or custom route. Its generated public URLs returned404/error1042 from both M4 and Kaggle. Deployment metadata was therefore NOT counted as successful application execution. A separate supported `wrangler dev --remote` session ran on Cloudflare through its local loopback proxy; all78responses had their exact digest and CF-Ray presence checked. The temporary session was stopped, with its PID and listener disappearance verified. Do not advertise the standalone preview URL as a working public API.

No councilof.ai or csoai-site production deployment, domain route, account-plan change or paid GPU was made. Billing/remaining startup credits were not inspected. Existing production deployment ownership stays intact.

## Kaggle publication

Notebook: https://www.kaggle.com/code/nicktempleman/meok-cross-runtime-replay . Version1 failed because a public HF source URL redirected and the runner deliberately refused redirects. Version2 fetches the exact same vendored bytes from the pinned canonical GitHub source, checks them against original HF hashes, and completed. Its report and every prediction were downloaded and compared. No account keys, private data or paid-model call is embedded in the notebook.

A separate lane was concurrently running `meok-cross-platform-cpu-replay`, a broader six-variant, offline data replay. That notebook and the existing Academy notebook were inspected/left unchanged. This lane's additional scope is HTTP/MCP execution, request/response binding, hosted refusal and Cloudflare portability.

## Integrity lessons

A raw-byte SHA256, sorted JSON and RFC8785 canonical JSON are different contracts. The first HF digest check used the wrong serialization and correctly stopped. Reusing the exact existing evidence-fabric canonicalizer fixed the verifier, without changing the producer or calling a mismatched hash a pass. The records remain unsigned and do not establish independent reviewer identity or prediction truth.

## Platform roles and next bounded move

HF can retain pinned model/data/source and serve the selected private worker. Kaggle can execute reproducible CPU/GPU notebooks under its actual quota. Cloudflare can provide the bounded application edge, routing, storage or supported model services. This experiment uses Worker CPU only; it does not install Cosmos on Workers AI or prove arbitrary custom-GPU support.

Before a production edge is proposed: repair/requalify public Preview routing; retain source-first release ownership; add an authenticated, budgeted ingress where appropriate; compare whole-job accepted-result cost and latency on a realistic workload; preserve the original exact-rule/learned-model distinction. Do not turn identical outputs into a claim that the known synthetic model became safer or more accurate.

Startup-credit eligibility is separate from access. The current official Cloudflare startup page lists a$2,500WorkersAI cap for the$10,000Tier3 programme and excludes AI Gateway at present. Those published limits do not verify this account's balance or contract. Source: https://www.cloudflare.com/startups/ . Remote-development semantics: https://developers.cloudflare.com/workers/local-development/ .
