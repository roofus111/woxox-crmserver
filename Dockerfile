# syntax=docker/dockerfile:1
# Legacy WOXOX CRM API (crmserver) — build context must be the crmserver repo root

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN useradd --system --uid 1001 crmserver \
  && apt-get update -y \
  && apt-get install -y --no-install-recommends passwd \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY . .
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN mkdir -p /app/data/wa-sessions /app/uploads/fileuploads /app/uploads/chat \
  && chown -R crmserver:crmserver /app/data /app/uploads \
  && chmod +x /docker-entrypoint.sh

# Entrypoint runs as root briefly to fix volume ownership, then drops to crmserver
USER root
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/docker-entrypoint.sh"]
