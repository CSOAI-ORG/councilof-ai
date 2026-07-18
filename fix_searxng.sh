#!/bin/bash
# Fix SearXNG Configuration
echo "🔧 Fixing SearXNG configuration..."

# Create proper settings.yml
mkdir -p /Users/nicholas/clawd/searxng

cat > /Users/nicholas/clawd/searxng/settings.yml << 'EOF'
# SearXNG Configuration
use_default_settings: true

server:
  port: 8080
  bind_address: "0.0.0.0"
  secret_key: "sov3searxngsecretkey2026"
  base_url: false
  image_proxy: false
  http_protocol_version: "1.1"

search:
  safe_search: 0
  autocomplete: ""
  default_lang: "en"
  formats:
    - html
    - json
    - csv
    - rss

engines:
  - name: google
    engine: google
    shortcut: go
    disabled: false
  - name: duckduckgo
    engine: duckduckgo
    shortcut: ddg
    disabled: false
  - name: bing
    engine: bing
    shortcut: bi
    disabled: false
  - name: wikipedia
    engine: wikipedia
    shortcut: wp
    disabled: false
  - name: github
    engine: github
    shortcut: gh
    disabled: false

ui:
  static_path: "/usr/local/searxng/searx/static"
  templates_path: "/usr/local/searxng/searx/templates"
  default_theme: simple
  theme_args:
    simple_style: auto

redis:
  url: false

outgoing:
  request_timeout: 10.0
  max_request_timeout: 15.0
  pool_connections: 100
  pool_maxsize: 100
  enable_http2: true

# Disable bot detection for local use
# (We're running locally, so this is safe)
botdetection:
  enabled: false

EOF

echo "✅ SearXNG config created"
echo "Restarting SearXNG container..."

docker restart searxng 2>&1
sleep 5

echo "Testing SearXNG..."
curl -s "http://localhost:8080/search?q=open+source+AI&format=json" 2>&1 | head -c 200
