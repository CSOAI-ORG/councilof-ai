#!/bin/bash
# CSOAI Platform - Deployment Script
# Usage: ./deploy.sh [docker|pm2|direct]

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     CSOAI Platform - Deployment Script                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"

MODE=${1:-docker}

case $MODE in
  docker)
    echo "🐳 Deploying with Docker..."
    docker-compose down 2>/dev/null || true
    docker-compose build --no-cache
    docker-compose up -d
    echo "✅ CSOAI is running at http://localhost:3001"
    echo "   Health check: curl http://localhost:3001/health"
    ;;

  pm2)
    echo "🚀 Deploying with PM2..."
    npm ci --legacy-peer-deps
    npm run build
    pm2 delete csoai 2>/dev/null || true
    NODE_ENV=production pm2 start dist/server/index.js --name csoai
    pm2 save
    echo "✅ CSOAI is running with PM2"
    pm2 status csoai
    ;;

  direct)
    echo "▶️  Starting directly..."
    npm ci --legacy-peer-deps
    npm run build
    NODE_ENV=production node dist/server/index.js
    ;;

  *)
    echo "Usage: ./deploy.sh [docker|pm2|direct]"
    echo "  docker - Deploy with Docker Compose (recommended)"
    echo "  pm2    - Deploy with PM2 process manager"
    echo "  direct - Run directly with Node.js"
    exit 1
    ;;
esac
