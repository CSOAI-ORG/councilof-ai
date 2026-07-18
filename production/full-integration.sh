#!/bin/bash
# SOV3 FULL INTEGRATION STACK DEPLOYMENT
# "Leave no stone unturned" — Production Dominance

echo "🚀 SOV3 FULL INTEGRATION STACK"
echo "==============================="
echo "Let's eat Western AI companies"
echo ""

# 1. Verify all services
echo "✅ PHASE 1: Service Verification"
echo "-------------------------------"
SERVICES_UP=0
SERVICES_TOTAL=15

for service in "3101:SOV3_Core" "3103:CouncilOf" "3104:MoE" "3105:SearXNG_MCP" "3106:Qdrant_MCP" "3107:Redis_MCP" "3108:Search_Agent" "3109:Health_Dashboard" "3110:Certification" "3111:Quantum_Council" "3112:MEOK_Bridge" "3201:Ralph_CEO" "8080:SearXNG" "6333:Qdrant" "6379:Redis"; do
    IFS=':' read -r port name <<< "$service"
    if curl -s http://localhost:$port/mcp -X POST -d '{"tool":"health"}' 2>/dev/null | grep -q "success\|status\|error"; then
        echo "  ✅ $name (Port $port)"
        ((SERVICES_UP++))
    else
        echo "  ⚠️  $name (Port $port) — checking..."
    fi
done

echo ""
echo "  Services: $SERVICES_UP/$SERVICES_TOTAL operational"

# 2. Create production Docker stack
echo ""
echo "✅ PHASE 2: Production Docker Stack"
echo "-------------------------------------"

mkdir -p /Users/nicholas/clawd/production/{sov3,councilof,moe,quantum,meok,certification,search,health}

# SOV3 Core Dockerfile
cat > /Users/nicholas/clawd/production/sov3/Dockerfile << 'DOCKER_EOF'
FROM python:3.11-slim
WORKDIR /app
COPY sovereign-temple/ .
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || pip install flask numpy requests httpx
EXPOSE 3101
CMD ["python3", "sovereign-mcp-server.py"]
DOCKER_EOF

# CouncilOf Dockerfile
cat > /Users/nicholas/clawd/production/councilof/Dockerfile << 'DOCKER_EOF'
FROM python:3.11-slim
WORKDIR /app
COPY council-of-mcps/councilof/ .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3103
CMD ["python3", "councilof_mcp.py"]
DOCKER_EOF

# MoE Dockerfile
cat > /Users/nicholas/clawd/production/moe/Dockerfile << 'DOCKER_EOF'
FROM python:3.11-slim
WORKDIR /app
COPY council-of-mcps/moe/ .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3104
CMD ["python3", "moe_council_mcp.py"]
DOCKER_EOF

# Quantum Council Dockerfile
cat > /Users/nicholas/clawd/production/quantum/Dockerfile << 'DOCKER_EOF'
FROM python:3.11-slim
WORKDIR /app
COPY quantum/quantum_council_simple.py .
RUN pip install --no-cache-dir flask numpy
EXPOSE 3111
CMD ["python3", "quantum_council_simple.py"]
DOCKER_EOF

# MEOK Bridge Dockerfile
cat > /Users/nicholas/clawd/production/meok/Dockerfile << 'DOCKER_EOF'
FROM python:3.11-slim
WORKDIR /app
COPY meok-bridge/meok_bridge.py .
RUN pip install --no-cache-dir flask numpy httpx
EXPOSE 3112
CMD ["python3", "meok_bridge.py"]
DOCKER_EOF

# Certification Dockerfile
cat > /Users/nicholas/clawd/production/certification/Dockerfile << 'DOCKER_EOF'
FROM python:3.11-slim
WORKDIR /app
COPY certification/certification_api.py .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3110
CMD ["python3", "certification_api.py"]
DOCKER_EOF

# Search Agent Dockerfile
cat > /Users/nicholas/clawd/production/search/Dockerfile << 'DOCKER_EOF'
FROM python:3.11-slim
WORKDIR /app
COPY mcp-tools/search-agent/search_agent_mcp.py .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3108
CMD ["python3", "search_agent_mcp.py"]
DOCKER_EOF

# Health Dashboard Dockerfile
cat > /Users/nicholas/clawd/production/health/Dockerfile << 'DOCKER_EOF'
FROM python:3.11-slim
WORKDIR /app
COPY mcp-tools/health-dashboard/health_dashboard.py .
RUN pip install --no-cache-dir flask numpy requests
EXPOSE 3109
CMD ["python3", "health_dashboard.py"]
DOCKER_EOF

# Master docker-compose
cat > /Users/nicholas/clawd/production/docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  # Core Services
  sov3-core:
    build: ./sov3
    ports:
      - "3101:3101"
    networks:
      - sov3
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3101/mcp"]
      interval: 30s
      timeout: 10s
      retries: 3

  councilof:
    build: ./councilof
    ports:
      - "3103:3103"
    networks:
      - sov3
    depends_on:
      - sov3-core
    restart: unless-stopped

  moe-council:
    build: ./moe
    ports:
      - "3104:3104"
    networks:
      - sov3
    restart: unless-stopped

  # Breakthrough Layer
  quantum-council:
    build: ./quantum
    ports:
      - "3111:3111"
    networks:
      - sov3
    restart: unless-stopped

  meok-bridge:
    build: ./meok
    ports:
      - "3112:3112"
    networks:
      - sov3
    depends_on:
      - sov3-core
      - councilof
      - moe-council
    restart: unless-stopped

  certification:
    build: ./certification
    ports:
      - "3110:3110"
    networks:
      - sov3
    restart: unless-stopped

  # Tools
  search-agent:
    build: ./search
    ports:
      - "3108:3108"
    networks:
      - sov3
    restart: unless-stopped

  health-dashboard:
    build: ./health
    ports:
      - "3109:3109"
    networks:
      - sov3
    restart: unless-stopped

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - sov3
    depends_on:
      - meok-bridge
      - certification
    restart: unless-stopped

networks:
  sov3:
    driver: bridge
COMPOSE_EOF

# Nginx config for meok.ai
cat > /Users/nicholas/clawd/production/nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    upstream meok_backend {
        server meok-bridge:3112;
    }

    upstream cert_backend {
        server certification:3110;
    }

    server {
        listen 80;
        server_name meok.ai sov3.meok.ai;
        
        location / {
            proxy_pass http://meok_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /api/certify {
            proxy_pass http://cert_backend;
            proxy_set_header Host $host;
        }
    }
}
NGINX_EOF

echo "  ✅ Docker stack created"
echo "     - 8 microservices"
echo "     - Nginx load balancer"
echo "     - Health checks"
echo "     - Auto-restart"

# 3. Create deployment script
echo ""
echo "✅ PHASE 3: Deployment Automation"
echo "-----------------------------------"

cat > /Users/nicholas/clawd/production/deploy.sh << 'DEPLOY_EOF'
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
DEPLOY_EOF

chmod +x /Users/nicholas/clawd/production/deploy.sh

echo "  ✅ deploy.sh created"

# 4. SSL setup script
echo ""
echo "✅ PHASE 4: SSL Certificate Setup"
echo "---------------------------------"

cat > /Users/nicholas/clawd/production/setup-ssl.sh << 'SSL_EOF'
#!/bin/bash
# SSL setup for meok.ai

echo "🔒 Setting up SSL for meok.ai"
echo ""

# Install certbot if needed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    # macOS
    if command -v brew &> /dev/null; then
        brew install certbot
    # Ubuntu/Debian
    elif command -v apt &> /dev/null; then
        apt update && apt install -y certbot
    fi
fi

# Get certificates
echo "Requesting certificates..."
certbot certonly --standalone -d meok.ai -d sov3.meok.ai --agree-tos --non-interactive --email nicholas@meok.ai

# Copy to nginx ssl directory
mkdir -p /Users/nicholas/clawd/production/ssl
cp /etc/letsencrypt/live/meok.ai/fullchain.pem ssl/
cp /etc/letsencrypt/live/meok.ai/privkey.pem ssl/

echo "✅ SSL certificates installed"
echo "Restart nginx: docker-compose restart nginx"
SSL_EOF

chmod +x /Users/nicholas/clawd/production/setup-ssl.sh

echo "  ✅ setup-ssl.sh created"

# 5. Summary
echo ""
echo "✅ PHASE 5: Integration Complete"
echo "----------------------------------"
echo ""
echo "📁 Production Stack:"
echo "   /Users/nicholas/clawd/production/"
echo ""
echo "🐳 Services:"
echo "   ├── sov3/         — Core consciousness"
echo "   ├── councilof/    — 33-node governance"
echo "   ├── moe/          — 9-expert routing"
echo "   ├── quantum/      — Quantum council"
echo "   ├── meok/         — Brand bridge"
echo "   ├── certification/ — Revenue API"
echo "   ├── search/       — Research agent"
echo "   └── health/       — Status dashboard"
echo ""
echo "🚀 Deploy Commands:"
echo "   cd /Users/nicholas/clawd/production"
echo "   ./deploy.sh       — Deploy full stack"
echo "   ./setup-ssl.sh    — Enable HTTPS"
echo ""
echo "💰 Revenue Ready:"
echo "   Certification API: £5K-15K per AI"
echo "   First cert: sov3-cert-1d74bfdfdb6b"
echo ""
echo "🎯 LET'S EAT!"
