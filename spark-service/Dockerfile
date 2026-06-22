FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y default-jdk && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONPATH=/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Asegura que PySpark encuentre hive-site.xml
ENV SPARK_CONF_DIR=/app/conf

CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]