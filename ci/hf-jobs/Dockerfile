# ci/hf-jobs/Dockerfile — the csoai/ci-runner image for Hugging Face Jobs.
#
# WHY THIS BASE. HF Jobs run an existing container image; they do not build a
# Dockerfile themselves. The only HF-native way to build one is a Docker Space
# (`hf.co/spaces/csoai/ci-runner` is then a valid `hf jobs run` image). The
# Playwright image already carries Chromium + every system dep at the exact
# Playwright version package-lock.json pins, so the prerender needs no browser
# download; bootstrap.sh adds Python 3.11, wrangler, git. A `hf jobs uv run`
# script cannot do this job: the prerender needs Node + a browser, not Python.
#
# The tag MUST match the playwright version in package-lock.json —
# ci/hf-jobs/steps-drift.test.mjs asserts it.
FROM mcr.microsoft.com/playwright:v1.61.1-noble

COPY bootstrap.sh /opt/ci-runner/bootstrap.sh
RUN bash /opt/ci-runner/bootstrap.sh

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PYTHONUNBUFFERED=1 \
    CI=1

# Spaces expect a listener on 7860. Serving the tool-version page keeps the Space
# "Running" on the free CPU tier so the built image stays pullable by Jobs.
EXPOSE 7860
CMD ["python3", "-m", "http.server", "7860", "--directory", "/opt/ci-runner/health"]
