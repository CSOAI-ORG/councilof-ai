# Same shape as openshift/console-plugin-template's Dockerfile (UBI 9 node build, UBI 9 nginx serve),
# with npm instead of yarn. Build it inside the owner's namespace with an OpenShift binary build
# (see README), so no external registry is needed.
FROM registry.access.redhat.com/ubi9/nodejs-22:latest AS build
USER root
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
WORKDIR /usr/src/app
COPY . /usr/src/app
# src/vendor/gspc-panel.js and standalone/gspc-panel.js are committed copies of councilof.ai's
# published bundle (integrations/vendor-panel.mjs --check pins them), so the build does not need the repo.
RUN npm install --no-audit --no-fund && NODE_ENV=production npx rspack

FROM registry.access.redhat.com/ubi9/nginx-120:latest
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
USER 1001
ENTRYPOINT ["nginx", "-g", "daemon off;"]
