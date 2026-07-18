FROM python:3.11-slim
WORKDIR /app
COPY sovereign-temple/ .
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || pip install flask numpy requests httpx
EXPOSE 3101
CMD ["python3", "sovereign-mcp-server.py"]
