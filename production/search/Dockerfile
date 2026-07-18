FROM python:3.11-slim
WORKDIR /app
COPY mcp-tools/search-agent/search_agent_mcp.py .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3108
CMD ["python3", "search_agent_mcp.py"]
