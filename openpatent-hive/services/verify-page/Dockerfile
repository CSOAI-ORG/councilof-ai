# OpenPatent.ai Verify Page Renderer
# Public-facing verify.openpatent.ai/{hash16} endpoint.
# Renders human-readable disclosure attestations. 6-layer verification.
FROM python:3.11-slim

LABEL org.opencontainers.image.description="OpenPatent.ai hive — verify.openpatent.ai renderer"
LABEL hive.role="verify-page" hive.port="3213"

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

WORKDIR /opt/openpatent-verify
RUN pip install --no-cache-dir fastapi uvicorn httpx jinja2 python-multipart prometheus-client>=0.19.0

COPY services/verify-page/verify_page.py /opt/openpatent-verify/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py
COPY services/verify-page/templates/ /opt/openpatent-verify/templates/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py

EXPOSE 3213

CMD ["python", "verify_page.py"]
