#!/bin/bash
set -e

echo "🚀 Deploying SOV3 Full Stack"
echo ""

# Build and start
docker-compose build --parallel
docker-compose up -d

# Wait for health
echo "⏳ Waiting for services..."
sleep 10

# Verify
echo "✅ Verifying deployment..."
curl -s http://localhost:3112/ | python3 -m json.tool 2>/dev/null | head -10

echo ""
echo "🎉 SOV3 FULL STACK DEPLOYED!"
echo ""
echo "📊 Dashboard: http://localhost:3109"
echo "🌐 MEOK API:   http://localhost:3112"
echo "🏆 Certify:    http://localhost:3110/api/certify"
echo ""
echo "Next: Configure DNS + SSL"
