# Stdio MCP for the live GSPC board + three-state signed-card verify.
# Zero npm dependencies. Node >= 20 (WebCrypto Ed25519 + fetch).
# Health = initialize + tools/list. We measure, never certify.
FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402
WORKDIR /app
COPY package.json gspc-tools.json paid-tools.json axis-aliases.json index.mjs verify-card.mjs ./
USER node
CMD ["node", "index.mjs"]
