# 🐉 SOV3 Bridge — HuggingFace Spaces (T4 GPU FREE)
# Create Space: huggingface.co/spaces → New Space → Docker → T4 GPU
# Upload Dockerfile + this app.py

from fastapi import FastAPI
import requests, json

app = FastAPI()
SOV3 = "http://35.242.143.249:3101/mcp"

@app.get("/")
def root():
    return {"sov3": "bridge", "gpu": "T4", "free": True, "hives": 28}

@app.post("/think")
def think(query: str, character: str = "sage"):
    r = requests.post(SOV3, json={
        "jsonrpc":"2.0","id":"1","method":"tools/call",
        "params":{"name":"bridge_think","arguments":{"character":character,"message":query}}
    }, timeout=60)
    return r.json()

@app.get("/health")
def health():
    return {"status": "online", "sov3": "connected"}
