FROM node:22-alpine
WORKDIR /app
COPY probe.mjs /app/probe.mjs
COPY toolset.json /app/toolset.json
USER node
ENTRYPOINT ["node", "/app/probe.mjs"]
