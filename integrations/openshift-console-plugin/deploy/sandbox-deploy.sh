#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Deploy the GSPC evidence panel (standalone page, ConfigMap mode) and the remote::csoai Llama Stack
# eval provider into the owner's Red Hat Developer Sandbox namespace. Namespace-scoped objects only.
#
#   bash sandbox-deploy.sh <env-file>        env-file holds OC_SERVER and OC_TOKEN (never printed)
#
# It logs in with a private kubeconfig in a temp dir (the token never reaches argv, logs or disk
# outside that dir), applies the two rendered YAML files into the token's own default project,
# waits for both rollouts, runs the provider's fixture job, prints the Route URL, and logs out.
set -euo pipefail
ENV_FILE=${1:?usage: sandbox-deploy.sh <env-file with OC_SERVER and OC_TOKEN>}
HERE=$(cd "$(dirname "$0")" && pwd)
command -v oc >/dev/null || { echo "oc not on PATH"; exit 2; }
set +x
# shellcheck disable=SC1090
. "$ENV_FILE"
: "${OC_SERVER:?OC_SERVER missing in env file}" "${OC_TOKEN:?OC_TOKEN missing in env file}"
umask 077
export KUBECONFIG; KUBECONFIG=$(mktemp -d)/kubeconfig
trap 'rm -rf "$(dirname "$KUBECONFIG")"' EXIT
# The token goes into a private kubeconfig through the shell builtin printf, never into argv.
# The namespace is the sandbox's own "<user>-dev" project, read back from the API.
printf 'apiVersion: v1\nkind: Config\nclusters:\n- name: sandbox\n  cluster:\n    server: %s\nusers:\n- name: owner\n  user:\n    token: %s\ncontexts:\n- name: sandbox\n  context:\n    cluster: sandbox\n    user: owner\ncurrent-context: sandbox\n' "$OC_SERVER" "$OC_TOKEN" > "$KUBECONFIG"
unset OC_TOKEN
U=$(oc whoami)
NS=${OC_NAMESPACE:-$(oc get projects -o jsonpath='{.items[*].metadata.name}' | tr ' ' '\n' | grep -E -- '-dev$' | head -1)}
[ -n "$NS" ] || { echo "no <user>-dev project visible; set OC_NAMESPACE in the env file"; exit 3; }
oc config set-context --current --namespace="$NS" >/dev/null
echo "user: $U  namespace: $NS"
case "$NS" in default|kube-*|openshift*) echo "refusing: $NS is not a user sandbox namespace"; exit 3;; esac

oc apply -n "$NS" -f "$HERE/rendered/panel-sandbox.yaml"
oc apply -n "$NS" -f "$HERE/llama-stack-provider/provider-sandbox.yaml"
oc rollout status -n "$NS" deploy/gspc-evidence-plugin --timeout=180s
oc rollout status -n "$NS" deploy/llama-stack-csoai --timeout=900s

HOST=$(oc get route -n "$NS" gspc-evidence-plugin -o jsonpath='{.spec.host}')
echo "panel route: https://$HOST/"
curl -fsS -o /dev/null -w "panel route HTTP %{http_code}\n" "https://$HOST/"
curl -fsS "https://$HOST/gspc-panel.js" | sha256sum

# The provider, from inside the cluster: register the fixture benchmark, run the job, print rows.
POD=$(oc get pod -n "$NS" -l app=llama-stack-csoai -o jsonpath='{.items[0].metadata.name}')
oc exec -n "$NS" "$POD" -- bash -c 'cd /tmp/app &&
  curl -fsS -X POST localhost:8321/v1alpha/eval/benchmarks -H "content-type: application/json" -d @fixtures/benchmark.json >/dev/null &&
  J=$(curl -fsS -X POST localhost:8321/v1alpha/eval/benchmarks/csoai-evidence/jobs -H "content-type: application/json" -d @fixtures/job.json | python3 -c "import sys,json;print(json.load(sys.stdin)[\"job_id\"])") &&
  sleep 2 && curl -fsS localhost:8321/v1alpha/eval/benchmarks/csoai-evidence/jobs/$J/result'
echo
echo "done: panel https://$HOST/ ; provider svc llama-stack-csoai:8321 (cluster-internal) in $NS"
