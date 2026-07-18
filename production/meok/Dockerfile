FROM python:3.11-slim
WORKDIR /app
COPY meok-bridge/meok_bridge.py .
RUN pip install --no-cache-dir flask numpy httpx
EXPOSE 3112
CMD ["python3", "meok_bridge.py"]
