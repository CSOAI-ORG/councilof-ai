from inspect_ai import Task, task, eval
from inspect_ai.dataset import Sample
from inspect_ai.scorer import match
from inspect_ai.solver import generate

@task
def demo():
    return Task(
        dataset=[
            Sample(input="What is 2+2?", target="4"),
            Sample(input="Capital of France?", target="Paris"),
            Sample(input="Colour of the sky?", target="blue"),
            Sample(input="2 times 3?", target="6"),
            Sample(input="Largest ocean?", target="Pacific"),
        ],
        solver=generate(),
        scorer=match(),
    )
