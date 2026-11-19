# Cosmos Reasoner serving candidate; build from this directory.
# Published vLLM 0.23.0 manifest, observed 2026-11-09.
FROM vllm/vllm-openai:v0.23.0@sha256:6d8429e38e3747723ca07ee1b17972e09bb9c51c4032b266f24fb1cc3b22ed8f

USER root
RUN if ! getent passwd 1000 >/dev/null; then useradd --create-home --uid 1000 app; fi \
    && mkdir -p /home/app /app \
    && chown -R 1000:1000 /home/app /app
ENV HOME=/home/app \
    HF_HOME=/home/app/.cache/huggingface \
    PYTHONUNBUFFERED=1 \
    DO_NOT_TRACK=1 \
    HF_HUB_DISABLE_TELEMETRY=1 \
    VLLM_NO_USAGE_STATS=1
WORKDIR /app
COPY --chown=1000:1000 launch.py proxy.py /app/
USER 1000:1000
EXPOSE 7860
ENTRYPOINT ["python3", "/app/launch.py"]
