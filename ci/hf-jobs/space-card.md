---
title: csoai ci-runner
emoji: 🛡️
colorFrom: gray
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# csoai/ci-runner

Runner image for the Hugging Face Jobs second CI lane of
[CSOAI-ORG/councilof-ai](https://github.com/CSOAI-ORG/councilof-ai)
(`ci/hf-jobs/`). It exists so `hf jobs run hf.co/spaces/csoai/ci-runner …` has a
pre-provisioned image; the Space itself only serves a tool-version page.
No secrets live in this Space.
