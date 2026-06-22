FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y default-jdk && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Asegura que PySpark encuentre hive-site.xml
ENV SPARK_CONF_DIR=/app/conf

CMD ["python", "main.py"]