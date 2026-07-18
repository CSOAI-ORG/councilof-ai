# OpenPatent.ai MCP Manifest
# Public MCP server discovery endpoint for mcp.openpatent.ai
FROM python:3.11-slim

LABEL org.opencontainers.image.description="OpenPatent.ai hive — mcp.openpatent.ai manifest"
LABEL hive.role="mcp-manifest" hive.port="3214"

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

WORKDIR /opt/openpatent-mcp
RUN pip install --no-cache-dir fastapi uvicorn prometheus-client>=0.19.0

COPY services/mcp-manifest/manifest.py /opt/openpatent-mcp/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py

EXPOSE 3214

CMD ["python", "manifest.py"]
