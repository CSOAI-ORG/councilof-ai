FROM python:3.11-slim
WORKDIR /app
COPY council-of-mcps/councilof/ .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3103
CMD ["python3", "councilof_mcp.py"]
