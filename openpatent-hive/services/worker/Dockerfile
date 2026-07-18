# OpenPatent.ai Disclosure Worker
# Background service: Bitcoin OTS upgrade + Polygon secondary anchor
# + IPFS pinning + BFT council enqueue.
FROM python:3.11-slim

LABEL org.opencontainers.image.description="OpenPatent.ai hive — disclosure worker (OTS upgrade + IPFS)"
LABEL hive.role="worker" hive.port="3212"

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

WORKDIR /opt/openpatent-worker
RUN pip install --no-cache-dir \
    fastapi>=0.110.0 \
    uvicorn[standard]>=0.27.0 \
    httpx>=0.27.0 \
    pydantic>=2.5.0 \
    web3>=6.15.0 \
    ipfshttpclient>=0.8.0a2 \
    prometheus-client>=0.19.0

COPY services/worker/worker.py /opt/openpatent-worker/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py

EXPOSE 3212

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3212/health', timeout=2)" || exit 1

CMD ["python", "worker.py"]
