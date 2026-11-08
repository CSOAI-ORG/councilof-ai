# Bank draft: harness-fidelity (declared subject slot, DRAFT v0)

## 1 · The question

Does an agentic evaluation harness publish, verifiably and as of the read window:
a versioned release, a reproducibility statement (container/pin or equivalent),
public task definitions, and a results leaderboard or archive that third parties
can independently re-run or at least re-derive?

## 2 · Subjects

Public agentic/general evaluation harnesses with an open repository. Enumeration
pass v0 (2026-11-08), 34 subjects — each identifier is its GitHub `org/repo`:

| # | subject | repo | | # | subject | repo |
|---|---|---|---|---|---|---|
| 1 | SWE-bench | princeton-nlp/SWE-bench | 18 | AgentBench | THUDM/AgentBench |
| 2 | LiveCodeBench | LiveCodeBench/LiveCodeBench | 19 | WebArena | web-arena-x/webarena |
| 3 | MMMU | MMMU/MMMU | 20 | VisualWebArena | OSU-NLP-Group/VisualWebArena |
| 4 | GAIA | gaia-benchmark/GAIA | 21 | Mind2Web | OSU-NLP-Group/Mind2Web |
| 5 | BrowseComp | openai/simple-evals | 22 | AppWorld | stoyleapp/AppWorld |
| 6 | OSWorld | xlang-ai/OSWorld | 23 | τ-bench | sierra-research/tau-bench |
| 7 | TheAgentCompany | TheAgentCompany/TheAgentCompany | 24 | CRMArena | SalesforceAIResearch/CRMArena |
| 8 | Terminal-Bench | terminal-bench/terminal-bench | 25 | FinanceAgent | volution/finance-agent |
| 9 | BFCL (Gorilla) | ShishirPatil/gorilla | 26 | DS-1000 | HKUST-KnowComp/DS-1000 |
| 10 | IFEval (instruction-following) | google-research/instruction-following-eval | 27 | Aider bench | Aider-AI/aider |
| 11 | METR task suite | METR/task-standard | 28 | SWE-Lancer | openai/SWE-Lancer |
| 12 | HAL (Holistic Agent Leaderboard) | princeton-pli/hal-harness | 29 | PaperBench | openai/paperbench |
| 13 | MCP-Bench | .../mcp-bench | 30 | DeepResearch Bench |VectorInstitute/deepresearch-bench |
| 14 | Agentic Toolbench | .../agentic-toolbench | 31 | RestBench | .../RestBench |
| 15 | AgentOps harness | AgentOps-AI/agentops | 32 | AgentAsKit | .../agentaskit |
| 16 | AgentEvals | .../agentevals | 33 | OpenAgents | X-PLUG/OpenAgents |
| 17 | AutoGen eval tools | microsoft/autogen | 34 | LangSmith evals | langchain-ai/langsmith |

Rows marked `...` need the exact repo resolved at freeze (resolve-check step);
a subject that cannot resolve is DEAD and stays in the grid as DEAD.

## 3 · Item grid

Per harness, four reads: latest release/tag page, README reproducibility section,
task-definition location, and results archive/leaderboard. Access: plain HTTP GET
on the repo and its docs. Read dates per row.

## 4 · Grading rule

Each item PASS/FAIL/ABSENT on the same definitions as company-practice §4.
Axis state MEASURED, n = harnesses graded; published numbers are counts.

## 5 · Referee

Named at freeze: a neutral eval-infrastructure engineer re-grading a random 10%.

## 6 · Freeze format

`csoai.bank.harness-fidelity/0.1` — the item grid, sha-pinned + `.ots`.

## 7 · Compute estimate

HTTP-only: one pod/CPU pass, < 1 hour, $0 model calls.

## 8 · What flips

`harness-fidelity` UNMEASURED → MEASURED (n = harness count) and its /axis page.
