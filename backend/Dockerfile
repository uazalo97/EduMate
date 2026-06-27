FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Lệnh khởi chạy mặc định cho môi trường Production (có thể ghi đè trong docker-compose.dev.yml)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
