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
