FROM python:3.11-slim
LABEL org.opencontainers.image.description="OpenPatent.ai hive — 7 patent-primitive tools"
LABEL hive.role="openpatent-primitives" hive.port="3218"
WORKDIR /opt/primitives
RUN pip install --no-cache-dir fastapi uvicorn prometheus-client>=0.19.0 pydantic
COPY services/openpatent-primitives/primitives.py /opt/primitives/

# Copy the shared Prometheus metrics module
COPY services/_shared/metrics.py /opt/_shared/metrics.py
EXPOSE 3218
CMD ["python", "primitives.py"]
