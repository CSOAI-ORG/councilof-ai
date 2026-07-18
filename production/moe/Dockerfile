FROM python:3.11-slim
WORKDIR /app
COPY council-of-mcps/moe/ .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3104
CMD ["python3", "moe_council_mcp.py"]
