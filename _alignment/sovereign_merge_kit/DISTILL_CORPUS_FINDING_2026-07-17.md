# Distillation — honest corpus/teacher finding (2026-07-17)

## What was asked
Fire `distill_plan.json --live` to turn "distillation helps" from a PLAN into a measured number.

## What the check found (before spending any GPU)
The distill_plan named teachers (DeepSeek/Kimi/MiMo/Mistral) that are **paid-unfunded/dead** (sovereign_router
marks them PAID/UNFUNDED). The one live frontier-class teacher available is `host.llm()` (platform reasoning model).

Ran a real teacher-labeling pass on the compliance corpus (the plan's source, 821 prompts):
- After cleaning conversational fragments: 661 well-formed -> 150-prompt subset SENT to the teacher.
- Of 150 sent, **50 produced labeled pairs** that passed the quality filter (the other 100 were dropped as
  empty / <40 chars / truncated 'cut off' — technical filter, NOT classified as substantive refusals).
- Of those 50 labeled pairs, **21 were genuine grounded answers; 29 were refusal-worded** ("I don't have
  information about...") because they reference SOV-INTERNAL knowledge (its own charters: "SOVEREIGN MIST 12
  PILLARS", "THE 5 MEASURABLE INSTRUMENTS") that a general LLM cannot and should not answer.
- HONEST COUNT: 21/50 labeled were answerable; the 100 unlabeled were filtered for quality, not measured as
  refusals. Either way the corpus is SOV-internal and a general teacher is the wrong teacher — conclusion holds.

## Honest verdict — teacher-corpus MISMATCH, not a GPU block
Distilling a general teacher onto SOV's internal-charter corpus would teach the student to HALLUCINATE about
charters it has no grounding for. No amount of GPU spend fixes a wrong-teacher-for-corpus mismatch. STOPPED
rather than produce a hallucinating student for the sake of a number.

## What the RIGHT distillation is (and it's already done)
- SOV-internal compliance corpus -> the correct teacher is SOV's OWN RAG over the charters (grounded), not a
  general LLM. That's a retrieval task, already served by the article-RAG index.
- General-knowledge distillation -> ALREADY DONE + MEASURED today: the detectors. Large labeled general data
  (11,465 free examples) distilled into small owned models: injection 0.977, toxicity 0.871 held-out. That IS
  "distill the mix into one owned model," done, measured, wired.

## The principle (this is principle F in action)
FIT-BY-MEASURE applied to distillation: measure teacher-corpus fit BEFORE spending. The measurement said the
compliance-corpus general-teacher distill is a NO-GO by construction. The detector distill was a GO. Right
teacher, right corpus — the detectors are the honest distillation win; the compliance distill needs the RAG teacher.

## UPDATE — RAG-teacher distill attempted (2026-07-17, later)
Built the RAG-teacher as asked: 113 charter passages from 8 CHARTER_*.md indexed; lexical retrieval; teacher
answers ONLY from retrieved context, replies INSUFFICIENT_CONTEXT if not covered (anti-hallucination rule).

RESULT on 120 compliance prompts: **2 grounded answers, 116 abstained.** The RAG teacher correctly refused 97%
because the compliance prompts reference internal terms ("INDUSTRY DOMAIN & MARKET", "THE 5 MEASURABLE
INSTRUMENTS", "SOVEREIGN MIST 12 PILLARS") that are NOT present in the 8 charters on disk — they come from docs
not in the corpus, or are malformed training rows. The abstention is the SYSTEM WORKING: no grounding -> no answer
-> no hallucination.

DECISION: did NOT fire the £1 GPU run. Distilling on 2 pairs is motion not progress (alphabet gate) and principle F
(measure fit first) says NO-GO. The £1 is held until a corpus+teacher actually fit.

ROOT CAUSE for later fix: the compliance.jsonl training rows were written against internal docs that aren't in the
committed charter set. Either (a) add those source docs to the RAG corpus, or (b) regenerate compliance prompts FROM
the 8 charters we have (so prompt and grounding match by construction). (b) is the clean path — generate Q&A pairs
directly from each charter passage, which guarantees 100% grounding.
