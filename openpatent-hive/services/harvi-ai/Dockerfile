# harvi.ai — Gaming Power Pack
# Standalone Next.js 14 white-label deploy, served at harvi.ai
FROM node:22-alpine AS deps
WORKDIR /app
COPY services/harvi-ai/package.json ./
RUN npm install --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY services/harvi-ai/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p ./public
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/ >/dev/null || exit 1

CMD ["npm", "start"]
