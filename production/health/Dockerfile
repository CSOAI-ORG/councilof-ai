FROM python:3.11-slim
WORKDIR /app
COPY mcp-tools/health-dashboard/health_dashboard.py .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3109
CMD ["python3", "health_dashboard.py"]
