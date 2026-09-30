# SPDX-License-Identifier: Apache-2.0
"""NeMo Agent Toolkit plugin: `_type: csoai_evidence` evaluator.

    eval:
      evaluators:
        evidence:
          _type: csoai_evidence
          did_json: path/to/did.json        # pinned copy of https://csoai.org/.well-known/did.json

Each dataset item's generated answer (output_obj) is a signed-evidence bundle (see core.py). The item's result has
score None and reasoning {verification, state, reason, otel}: the event's state when the signature verifies,
INVALID when any byte was changed, UNVERIFIABLE_KEY when the key is not pinned. An evaluator error is reported as
UNCHECKABLE with score None -- never the 0.0 that NAT's BaseEvaluator substitutes on failure.
"""
import asyncio, json
from pydantic import Field
from nat.plugin_api import EvaluatorBaseConfig, EvaluatorInfo, register_evaluator
from nat.data_models.evaluator import EvalInput
from nat.plugins.eval.data_models.evaluator_io import EvalOutput, EvalOutputItem
from .core import evaluate_bundle


class CsoaiEvidenceEvaluatorConfig(EvaluatorBaseConfig, name="csoai_evidence"):
    did_json: str = Field(description="Path to a pinned copy of the issuer's DID document.")


class CsoaiEvidenceEvaluator:
    def __init__(self, did):
        self.did = did

    async def evaluate(self, eval_input: EvalInput) -> EvalOutput:
        items = []
        for it in eval_input.eval_input_items:
            try:
                r = evaluate_bundle(it.output_obj, self.did)
                items.append(EvalOutputItem(id=it.id, score=None, reasoning=r))
            except Exception as ex:  # a failure is UNCHECKABLE, never a zero
                items.append(EvalOutputItem(id=it.id, score=None, reasoning={"verification": "UNCHECKABLE", "state": "UNCHECKABLE", "reason": str(ex)[:200]},
                                            error=type(ex).__name__))
        await asyncio.sleep(0)
        return EvalOutput(average_score=None, eval_output_items=items)


@register_evaluator(config_type=CsoaiEvidenceEvaluatorConfig)
async def csoai_evidence_evaluator(config: CsoaiEvidenceEvaluatorConfig, builder):
    with open(config.did_json) as f:
        did = json.load(f)
    yield EvaluatorInfo(config=config, evaluate_fn=CsoaiEvidenceEvaluator(did).evaluate,
                        description="Verify CSOAI signed evidence offline; report each event's state, never a grade.")
