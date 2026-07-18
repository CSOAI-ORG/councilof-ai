# x402 Payment Router — 60/25/15 split across ops/infra/BFT council
FROM python:3.11-slim

LABEL org.opencontainers.image.description="OpenPatent.ai hive — x402 payment router"
LABEL hive.role="x402-router" hive.port="3217"

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

WORKDIR /opt/x402
RUN pip install --no-cache-dir fastapi uvicorn pydantic prometheus-client>=0.19.0

COPY services/x402-router/router.py /opt/x402/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py

EXPOSE 3217

CMD ["python", "router.py"]
