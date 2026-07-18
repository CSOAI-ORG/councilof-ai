# OpenPatent.ai BFT Council
# 33-agent Byzantine Fault Tolerant council for high-value disclosures.
# 22/33 threshold = 2/3 + 1 supermajority. Per-agent Ed25519 attestations.
#
# Architecture aligned with meok-council sovereign-temple v2.0/v3.0:
#   - 11 domains × 3 nodes = 33 agents
#   - Care veto + 3/4 expertise threshold
#   - 55-bridge domain affinity matrix
#   - Optional cross-hive attestation via MEOK_KEYSTONE_URL
FROM python:3.11-slim

LABEL org.opencontainers.image.description="OpenPatent.ai hive — 33-agent BFT council (sovereign-temple v3.0)"
LABEL hive.role="bft-council" hive.port="3215"

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

WORKDIR /opt/openpatent-bft
RUN pip install --no-cache-dir \
    fastapi>=0.110.0 \
    uvicorn[standard]>=0.27.0 \
    httpx>=0.27.0 \
    pydantic>=2.5.0 \
    cryptography>=42.0.0 \
    prometheus-client>=0.19.0 \
    asyncpg>=0.29.0 \
    psycopg[binary]>=3.1.0

# Sovereign-temple v3.0 BFT council (replaces the original bft.py)
COPY services/bft-council/sovereign_bft.py /opt/openpatent-bft/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py

# Optional: when MEOK_KEYSTONE_URL is set, cross-hive attestation routes
# through meok-keystone (port 8000) for sovereign consensus.
ENV MEOK_KEYSTONE_URL=http://meok-keystone:8000

EXPOSE 3215

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3215/health', timeout=2)" || exit 1

CMD ["python", "sovereign_bft.py"]
