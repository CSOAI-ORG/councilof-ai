#!/bin/bash
# Weekly IndexNow re-submit for the 14 marketing URLs (host: indexnow-deploy-rho.vercel.app)
URLS=(
  "https://meok.ai"
  "https://meok.ai/hive"
  "https://meok.ai/gaming"
  "https://proofof.ai"
  "https://csoai.org"
  "https://meok-attestation-api.vercel.app"
  "https://wowmcp-deploy.vercel.app"
  "https://compliance-meok-ai.vercel.app"
  "https://case-studies-deploy.vercel.app"
  "https://hive-deploy.vercel.app"
  "https://industries-deploy.vercel.app"
  "https://portfolio-deploy-orcin-three.vercel.app"
  "https://blog-deploy-azure.vercel.app"
  "https://launch-deploy-murex.vercel.app"
)
JSON_BODY="{\"host\":\"indexnow-deploy-rho.vercel.app\",\"key\":\"4ce8d40dd91b87a343a68755bfb7e8c9\",\"keyLocation\":\"https://indexnow-deploy-rho.vercel.app/4ce8d40dd91b87a343a68755bfb7e8c9.txt\",\"urlList\":["
for i in "${!URLS[@]}"; do
  if [ $i -gt 0 ]; then JSON_BODY+=","; fi
  JSON_BODY+="\"${URLS[$i]}\""
done
JSON_BODY+="]}"
echo "$JSON_BODY" | curl -s -m 30 -X POST "https://api.indexnow.org/IndexNow" \
  -H "Content-Type: application/json; charset=utf-8" --data @-
echo ""
