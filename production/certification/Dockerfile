FROM python:3.11-slim
WORKDIR /app
COPY certification/certification_api.py .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3110
CMD ["python3", "certification_api.py"]
