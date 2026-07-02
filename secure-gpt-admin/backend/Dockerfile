# backend/Dockerfile
# Multi-stage build — keeps the final image lean.
# Stage 1: install dependencies
# Stage 2: copy app + run with non-root user

# ─── Stage 1: dependency builder ─────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# System deps needed to compile asyncpg + Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libffi-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps into a prefix so we can copy them cleanly
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ─── Stage 2: runtime image ───────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Runtime system deps only (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    poppler-utils \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root
USER appuser

EXPOSE 8000

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1 

# Health check — matches the /health endpoint in main.py
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# dumb-init for proper signal handling + uvicorn with performance flags
ENTRYPOINT ["dumb-init", "--"]
CMD ["uvicorn", "app.main:app", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--workers", "1", \
    "--loop", "uvloop", \
    "--http", "httptools", \
    "--proxy-headers", \
    "--forwarded-allow-ips", "*"]
