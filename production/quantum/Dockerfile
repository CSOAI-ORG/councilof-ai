FROM python:3.11-slim
WORKDIR /app
COPY quantum/quantum_council_simple.py .
RUN pip install --no-cache-dir flask numpy
EXPOSE 3111
CMD ["python3", "quantum_council_simple.py"]
