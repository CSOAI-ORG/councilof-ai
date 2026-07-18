#!/bin/bash
# Move 7: Deploy vLLM for GPU Model Serving

echo "🚀 Move 7: Deploying vLLM..."

# Check if we have GPU access (Vast.ai or local)
if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo "⚠️ No local GPU — will use CPU mode or connect to Vast.ai"
fi

# Install vLLM
echo "Installing vLLM..."
pip install vllm -q 2>&1 | tail -5

# Create vLLM startup script
cat > /Users/nicholas/clawd/vllm/start_vllm.sh << 'EOFSCRIPT'
#!/bin/bash
# Start vLLM server with Hermes3

MODEL=${1:-"hermes3:8b"}
PORT=${2:-8000}

echo "Starting vLLM with model: $MODEL on port $PORT"

# Map Ollama model name to HuggingFace
if [ "$MODEL" = "hermes3:8b" ]; then
    HF_MODEL="NousResearch/Hermes-3-Llama-3.1-8B"
elif [ "$MODEL" = "gemma4:e4b" ]; then
    HF_MODEL="google/gemma-4b"
else
    HF_MODEL="NousResearch/Hermes-3-Llama-3.1-8B"
fi

python3 -m vllm.entrypoints.openai.api_server \
    --model "$HF_MODEL" \
    --port $PORT \
    --tensor-parallel-size 1 \
    --max-model-len 8192 \
    --dtype half \
    --api-key "sov3-local-key" \
    2>&1 &

echo "vLLM started on port $PORT"
echo "API: http://localhost:$PORT/v1"
EOFSCRIPT

chmod +x /Users/nicholas/clawd/vllm/start_vllm.sh

# Create vLLM MCP tool
cat > /Users/nicholas/clawd/mcp-tools/vllm/vllm_mcp_tool.py << 'EOFPY'
#!/usr/bin/env python3
"""
vLLM MCP Tool — GPU Model Serving
=================================
Port: 3108
Function: High-throughput model serving via vLLM
"""

import json
import httpx
from http.server import HTTPServer, BaseHTTPRequestHandler

VLLM_URL = "http://localhost:8000/v1"

class vLLMClient:
    async def generate(self, prompt, model="hermes3:8b", max_tokens=512, temperature=0.7):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{VLLM_URL}/completions",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "max_tokens": max_tokens,
                        "temperature": temperature
                    },
                    timeout=60.0
                )
                if response.status_code == 200:
                    return {"success": True, "response": response.json()}
                return {"success": False, "error": f"Status {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def chat(self, messages, model="hermes3:8b", max_tokens=512):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{VLLM_URL}/chat/completions",
                    json={
                        "model": model,
                        "messages": messages,
                        "max_tokens": max_tokens
                    },
                    timeout=60.0
                )
                if response.status_code == 200:
                    return {"success": True, "response": response.json()}
                return {"success": False, "error": f"Status {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

vllm = vLLMClient()

class vLLMHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        import asyncio
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            request = json.loads(post_data)
            tool = request.get('tool')
            params = request.get('params', {})
            
            if tool == 'vllm_generate':
                result = asyncio.run(vllm.generate(
                    prompt=params.get('prompt', ''),
                    model=params.get('model', 'hermes3:8b'),
                    max_tokens=params.get('max_tokens', 512)
                ))
            elif tool == 'vllm_chat':
                result = asyncio.run(vllm.chat(
                    messages=params.get('messages', []),
                    model=params.get('model', 'hermes3:8b')
                ))
            else:
                result = {"error": f"Unknown tool: {tool}"}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(('localhost', 3108), vLLMHandler)
    print("⚡ vLLM MCP Tool on port 3108")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
EOFPY

echo "✅ vLLM setup complete"
echo "To start vLLM: /Users/nicholas/clawd/vllm/start_vllm.sh"
echo "Note: Requires GPU or will use CPU (slower)"
