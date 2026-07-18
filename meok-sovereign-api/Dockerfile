FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Copy everything first so setuptools can find the package
COPY pyproject.toml ./
COPY app/ ./app/

RUN pip install --no-cache-dir -e "."

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
