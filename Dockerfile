# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies required by faster-whisper (ctranslate2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production image
FROM python:3.11-slim

WORKDIR /app

# Runtime dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY main.py .
COPY api/ api/
COPY config/ config/
COPY models/ models/
COPY services/ services/
COPY utils/ utils/

# Create required directories
RUN mkdir -p temp_uploads logs

# Azure App Service injects PORT env var; default to 8000
ENV PORT=8000
ENV WHISPER_DEVICE=cpu
ENV DEBUG=false

EXPOSE ${PORT}

# Run with production settings
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
