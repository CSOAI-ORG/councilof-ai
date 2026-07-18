#!/bin/bash
# Move 9: Deploy SigNoz Observability

echo "📊 Deploying SigNoz..."

cd /Users/nicholas/clawd

# Clone SigNoz if not exists
if [ ! -d "signoz" ]; then
    git clone https://github.com/SigNoz/signoz.git 2>&1 | tail -5
fi

cd signoz/deploy

# Deploy with Docker
echo "Starting SigNoz stack..."
docker-compose up -d 2>&1 | tail -10

echo ""
echo "✅ SigNoz deployed!"
echo "   UI: http://localhost:3301"
echo "   API: http://localhost:4317 (OTLP)"
echo ""
echo "Waiting for services..."
sleep 10

# Check status
docker-compose ps 2>&1 | head -10
