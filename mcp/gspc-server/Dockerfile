# Stdio MCP for the live GSPC board + three-state signed-card verify.
# Zero npm dependencies. Node >= 20 (WebCrypto Ed25519 + fetch).
# Health = initialize + tools/list. We measure, never certify.
FROM node:22-alpine
WORKDIR /app
COPY package.json gspc-tools.json index.mjs verify-card.mjs ./
USER node
CMD ["node", "index.mjs"]
