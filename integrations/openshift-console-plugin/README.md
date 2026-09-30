# GSPC evidence on Red Hat OpenShift

Two ways to run the same panel. Apache-2.0. Evidence by GSPC · Council of AI. Measurement, not certification.

| Mode | What it creates | Who can install it |
|---|---|---|
| **sandbox** (`values-sandbox.yaml`, `deploy/rendered/panel-sandbox.yaml`) | ConfigMap ×2, Service, Deployment (stock `ubi9/nginx-120`, no build), Route. Namespace-scoped only. | Any namespace user, incl. the Red Hat Developer Sandbox. |
| **cluster** (`values.yaml`, `deploy/rendered/panel-cluster.yaml`) | The above minus the Route, plus the cluster-scoped `ConsolePlugin` CR, so the panel appears **inside** the console at `/gspc-evidence` (Home → GSPC evidence, and the Developer perspective). | cluster-admin only. |

The Developer Sandbox forbids cluster-scoped objects, so a console dynamic plugin cannot be enabled
there by anyone but Red Hat. In the sandbox the panel runs as its own page behind a Route. The
plugin build (`console-extensions.json`, `src/components/GspcEvidencePage.tsx`, `rspack.config.mjs`,
`Dockerfile`) follows `openshift/console-plugin-template` (main, read 30 Sep 2026: rspack,
`@openshift-console/dynamic-plugin-sdk` 4.23-latest, `consolePlugin` in package.json). The
`ConsolePlugin` adds `https://councilof.ai` to the console's `connect-src` (OCP 4.18+ `contentSecurityPolicy`).

The Llama Stack `remote::csoai` eval provider (`packages/llama-stack-provider-csoai`) ships beside it
as `deploy/llama-stack-provider/provider-sandbox.yaml`: a ConfigMap holding the package's own files
(byte-exact; re-render with `python3 deploy/llama-stack-provider/render.py`, check with `--check`),
a Deployment on stock `ubi9/python-312` that installs it at start (`llama-stack==0.7.3`, `mcp<2`,
as the package README pins), and a cluster-internal Service on 8321. Its fixtures are signed with a
PUBLISHED TEST KEY and attest nothing. This is our code; it is not a Red Hat integration.

## Deploy to the Developer Sandbox (owner step)

**(a) Preferred: a token on Oracle, we deploy from the pod.**

1. In the sandbox web console: your name (top right) → **Copy login command** → **Display Token**.
2. On `oracle-micro-2`, create the file without the token touching shell history:
   ```sh
   umask 077; mkdir -p ~/.secrets
   cat > ~/.secrets/redhat-sandbox.env   # paste the two lines below, then Ctrl-D
   OC_SERVER=https://api.<cluster>.openshiftapps.com:6443
   OC_TOKEN=sha256~<the token>
   ```
   Optional third line `OC_NAMESPACE=<user>-dev` if you have more than one project.
3. Tell the lane. It then runs, from the lanes pod (the token is streamed over ssh, written only to a
   0700 temp dir, never echoed, never put in argv, deleted on exit):
   ```sh
   ssh oracle-micro-2 'cat ~/.secrets/redhat-sandbox.env' | ssh <lanes-pod> \
     'f=$(mktemp); cat > "$f"; bash /root/gspc-panel/integrations/openshift-console-plugin/deploy/sandbox-deploy.sh "$f"; rm -f "$f"'
   ```
   `sandbox-deploy.sh` refuses `default`, `kube-*` and `openshift*` namespaces, applies only the two
   namespace-scoped YAML files, waits for both rollouts, prints the Route URL, runs the provider's
   fixture job and prints its rows. Then: `node deploy/smoke-standalone.mjs https://<route>/ shot.png`.
   The token expires with the sandbox session (about a day); a new one is needed for a redeploy.

**(b) Fallback: the web console only.**

1. Top bar **+** (Import YAML), Project `<user>-dev`.
2. Paste the whole of `deploy/rendered/panel-sandbox.yaml` → **Create**.
3. **+** again, paste `deploy/llama-stack-provider/provider-sandbox.yaml` → **Create**.
4. Networking → Routes → `gspc-evidence-plugin` → the Location URL is the live page.
5. The provider pod takes a few minutes to install; its log ends with the server listening on 8321.

(Helm is not needed for either. With Helm: `helm upgrade -i gspc-evidence charts/gspc-evidence-plugin
-f charts/gspc-evidence-plugin/values-sandbox.yaml -n <user>-dev`.)

## Cluster mode (cluster-admin, not the sandbox)

```sh
oc new-project gspc-evidence
oc new-build --binary --strategy=docker --name gspc-evidence-plugin -n gspc-evidence
oc start-build gspc-evidence-plugin --from-dir=integrations/openshift-console-plugin --follow -n gspc-evidence
helm upgrade -i gspc-evidence charts/gspc-evidence-plugin -n gspc-evidence \
  --set plugin.image=image-registry.openshift-image-registry.svc:5000/gspc-evidence/gspc-evidence-plugin:latest
oc patch consoles.operator.openshift.io cluster --type=json \
  -p '[{"op":"add","path":"/spec/plugins/-","value":"gspc-evidence-plugin"}]'
```

## Tested here (30 Sep 2026, 4090 builder, no cluster)

- `helm lint` both modes; `helm template` → `deploy/rendered/*.yaml`; every object parses.
- The bundle and the provider files survive the ConfigMap round trip byte for byte.
- The sandbox nginx config (from the rendered ConfigMap) served the standalone page on a local nginx;
  Playwright against LIVE councilof.ai: 3 panels (MEASURED, MEASURED, TIE), 3 signatures VALID,
  attribution on each, hosts contacted = the page and councilof.ai only, 0 CSP violations, no
  horizontal overflow at 1280 or 375 px.
- NOT tested: the console plugin inside a real console (needs cluster-admin), the Route and pods in the
  sandbox (needs the owner's token).
