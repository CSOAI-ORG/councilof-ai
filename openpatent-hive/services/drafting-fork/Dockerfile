# OpenPatent Drafting Fork
# 6-agent TypeScript patent drafting engine. Bridges into the api-gateway.
FROM node:22-alpine

LABEL org.opencontainers.image.description="OpenPatent.ai hive — 6-agent drafting fork"
LABEL hive.role="drafting-fork" hive.port="3216"

WORKDIR /opt/drafting-fork
COPY services/drafting-fork/package.json ./
RUN npm install --no-audit --no-fund

COPY services/drafting-fork/tsconfig.json ./
COPY services/drafting-fork/src ./src
RUN npx tsc

EXPOSE 3216
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:3216/health >/dev/null 2>&1 || exit 1

CMD ["node", "dist/index.js"]
