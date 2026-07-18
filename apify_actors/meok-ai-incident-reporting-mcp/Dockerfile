FROM python:3.11-slim
RUN pip install --no-cache-dir     fastmcp==0.4.0     mcp==1.0.0     uvicorn==0.32.0     starlette==0.41.3
COPY . /app
WORKDIR /app
RUN pip install --no-cache-dir ai-incident-reporting-mcp==1.0.0
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost:8081/healthz || exit 1
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8081"]
