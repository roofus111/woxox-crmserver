# syntax=docker/dockerfile:1
# Legacy WOXOX CRM API (crmserver) — build context must be the crmserver repo root

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN useradd --system --uid 1001 crmserver

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p /app/data/wa-sessions /app/uploads && chown -R crmserver:crmserver /app/data /app/uploads

USER crmserver
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "index.js"]
