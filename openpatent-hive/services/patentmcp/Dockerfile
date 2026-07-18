# PatentMCP — 6-layer cryptographic disclosure core
# Preserves the existing open-source PatentMCP codebase verbatim and exposes
# it as a long-running service for the OpenPatent.ai hive.
FROM python:3.11-slim

LABEL org.opencontainers.image.source="https://github.com/CSOAI-ORG/patentmcp"
LABEL org.opencontainers.image.description="OpenPatent.ai hive — patentmcp core (6-layer crypto disclosure)"
LABEL version="1.0.0"
LABEL hive.role="patentmcp-core"
LABEL hive.port="3210"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /opt/patentmcp

# PatentMCP runtime deps (mirrors patentmcp/requirements.txt)
RUN pip install --no-cache-dir \
    cryptography>=42.0.0 \
    mcp>=1.0.0 \
    fastapi>=0.110.0 \
    uvicorn[standard]>=0.27.0 \
    httpx>=0.27.0 \
    pydantic>=2.5.0 \
    cryptography>=42.0.0 \
    prometheus-client>=0.19.0 \
    opentimestamps>=0.7.0 \
    psycopg[binary]>=3.1.0
# Copy the unmodified PatentMCP source (MIT, attribution preserved) + service wrapper
# Paths are relative to the build context (repo root).
COPY services/patentmcp_source/src/ /opt/patentmcp/src/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py
COPY services/patentmcp/patentmcp_service.py /opt/patentmcp/
COPY services/patentmcp/audit_persistence.py /opt/patentmcp/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py
COPY services/patentmcp/patentmcp_health.py /opt/patentmcp/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py
COPY services/patentmcp/requirements.txt /opt/patentmcp/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py

ENV PYTHONPATH=/opt/patentmcp/src

# Persistent data — audit chain + registry
RUN mkdir -p /var/lib/patentmcp
VOLUME ["/var/lib/patentmcp"]

EXPOSE 3210

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python patentmcp_health.py || exit 1

CMD ["python", "patentmcp_service.py"]
