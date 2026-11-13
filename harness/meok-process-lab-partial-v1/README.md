# MEOK partial-observation v1 — reproducible research package

This package tests a fresh MEOK process-state predictor without exposing the full simulator profile proportions as model inputs.

## Reproduce

1. Python 3.10+.
2. Install the pinned numerical dependency using: python -m pip install -r requirements.txt.
3. Run python generate_episodes.py. It downloads eight source files at the immutable Council commit, verifies their SHA-256 values, and regenerates the fresh 320-episode bank. It refuses a source or output mismatch.
4. Run python train_partial.py. This trains eight generalist candidates and four policy-specialist candidates, selects using validation only, compares against persistence, trend, ridge and the unchanged privileged v0 model, then writes the public artifacts into release/.
5. Run python -m unittest -v test_predict.py and python -B verify_bundle.py after training.

The generated internal episode file contains privileged simulator features solely to evaluate the old v0 comparator. It is not included in the public v1 dataset files. Public train/validation/test files contain only the 12 partial-observation features.

## Important boundary

All episodes are synthetic procurement-rehearsal output. This is not a physical world model, a general-purpose MEOK agent, a Cosmos fine-tune, an action-authorising model, or a GSPC score. The exact simulator remains authoritative.

[executed on device: sov33-owem-micro2 (b4b647b8-0a67-4b8f-9b25-2981363e9bd0)]