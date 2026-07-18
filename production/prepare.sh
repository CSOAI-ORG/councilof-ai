#!/bin/bash
# SOV3 PRODUCTION DEPLOYMENT
# Push to meok.ai

echo "🚀 SOV3 PRODUCTION DEPLOYMENT"
echo "=============================="
echo ""

# Check all services
echo "Checking all services..."
for port in 3101 3103 3104 3105 3106 3107 3108 3109 3110 3111 3112 3201; do
    if curl -s http://localhost:$port/mcp -X POST -d '{"tool":"health"}' 2>/dev/null | grep -q "error\|status\|success"; then
        echo "  ✅ Port $port: RESPONDING"
    else
        echo "  ⚠️  Port $port: CHECK"
    fi
done

echo ""
echo "📊 Service Summary:"
echo "  SOV3 Core:        localhost:3101"
echo "  CouncilOf:         localhost:3103"
echo "  MoE Council:       localhost:3104"
echo "  SearXNG MCP:       localhost:3105"
echo "  Qdrant MCP:        localhost:3106"
echo "  Redis MCP:         localhost:3107"
echo "  Search Agent:      localhost:3108"
echo "  Health Dashboard:  localhost:3109"
echo "  Certification:     localhost:3110"
echo "  Quantum Council:   localhost:3111"
echo "  MEOK Bridge:       localhost:3112"
echo "  Ralph CEO:         localhost:3201"
echo ""

# Create production config
echo "Creating production config..."
mkdir -p /Users/nicholas/clawd/production

cat > /Users/nicholas/clawd/production/docker-compose.yml << 'EOF'
version: '3.8'

services:
  # SOV3 Core
  sov3-core:
    build: ../sovereign-temple
    ports:
      - "3101:3101"
    environment:
      - SOV3_MODE=production
    restart: unless-stopped
  
  # CouncilOf
  councilof:
    build: ../council-of-mcps/councilof
    ports:
      - "3103:3103"
    depends_on:
      - sov3-core
    restart: unless-stopped
  
  # MoE Council
  moe-council:
    build: ../council-of-mcps/moe
    ports:
      - "3104:3104"
    restart: unless-stopped
  
  # Quantum Council
  quantum-council:
    build: ../quantum
    ports:
      - "3111:3111"
    restart: unless-stopped
  
  # MEOK Bridge
  meok-bridge:
    build: ../meok-bridge
    ports:
      - "3112:3112"
    depends_on:
      - sov3-core
      - councilof
      - moe-council
    restart: unless-stopped
  
  # Certification API
  certification:
    build: ../certification
    ports:
      - "3110:3110"
    restart: unless-stopped
  
  # Search Agent
  search-agent:
    build: ../mcp-tools/search-agent
    ports:
      - "3108:3108"
    restart: unless-stopped
  
  # Health Dashboard
  health-dashboard:
    build: ../mcp-tools/health-dashboard
    ports:
      - "3109:3109"
    restart: unless-stopped

networks:
  sov3-network:
    driver: bridge
EOF

echo "✅ Production config created"
echo ""

# Create deployment script
cat > /Users/nicholas/clawd/production/deploy.sh << 'EOF'
#!/bin/bash
echo "Deploying SOV3 to production..."
docker-compose up -d --build
echo "✅ SOV3 deployed!"
echo "Dashboard: http://localhost:3109"
echo "MEOK API: http://localhost:3112"
echo "Certification: http://localhost:3110"
EOF

chmod +x /Users/nicholas/clawd/production/deploy.sh

echo "✅ Deployment ready!"
echo ""
echo "Next steps:"
echo "  1. cd /Users/nicholas/clawd/production"
echo "  2. ./deploy.sh"
echo "  3. Configure meok.ai DNS"
echo "  4. Enable SSL"
echo ""
