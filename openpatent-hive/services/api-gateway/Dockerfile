# OpenPatent.ai API Gateway
# The single public entry point for api.openpatent.ai.
# Wraps patentmcp + worker + bft-council + drafting-fork behind a clean OpenAPI.
FROM python:3.11-slim

LABEL org.opencontainers.image.description="OpenPatent.ai hive — public API gateway"
LABEL version="1.0.0"
LABEL hive.role="api-gateway"
LABEL hive.port="3211"

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

WORKDIR /opt/openpatent-api

RUN pip install --no-cache-dir \
    fastapi>=0.110.0 \
    uvicorn[standard]>=0.27.0 \
    httpx>=0.27.0 \
    pydantic>=2.5.0 \
    python-multipart>=0.0.9 \
    prometheus-client>=0.19.0

# Core service code
COPY services/api-gateway/stripe_links.py /opt/openpatent-api/
COPY services/api-gateway/gateway.py /opt/openpatent-api/
COPY services/api-gateway/pricing.py /opt/openpatent-api/
COPY services/api-gateway/legal.py /opt/openpatent-api/

# L5 hardening modules (rate limit, hive stats, OTS verifier)
COPY services/api-gateway/rate_limit.py /opt/openpatent-api/
COPY services/api-gateway/hive_stats.py /opt/openpatent-api/
COPY services/api-gateway/ots_verifier.py /opt/openpatent-api/

# Shared Prometheus metrics module + sigil chain
COPY services/_shared/metrics.py /opt/_shared/metrics.py
# The shim (services/sigil.py) re-exports from services/_shared/sigil.py
# We need both, with services/sigil.py landing at /opt/_shared/sigil.py
# AND services/_shared/sigil.py landing at /opt/_shared/_shared/sigil.py
COPY services/_shared/sigil.py /opt/_shared/_shared/sigil.py
COPY services/_shared/sigil_chain.py /opt/_shared/_shared/sigil_chain.py
COPY services/sigil.py /opt/_shared/sigil.py

ENV PATENTMCP_URL=http://patentmcp:3210 \
    WORKER_URL=http://worker:3212 \
    BFT_URL=http://bft-council:3215 \
    DRAFTING_URL=http://drafting-fork:3216

EXPOSE 3211

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3211/health', timeout=2)" || exit 1

CMD ["python", "gateway.py"]
