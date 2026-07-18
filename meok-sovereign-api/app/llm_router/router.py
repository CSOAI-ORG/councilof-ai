import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from app.auth.router import get_current_user, User

router = APIRouter(prefix="/llm", tags=["llm"])

PROVIDERS = {
    "claude": {"base": "https://api.anthropic.com/v1", "key_env": "ANTHROPIC_API_KEY", "model": "claude-3-sonnet-20240229"},
    "gpt": {"base": "https://api.openai.com/v1", "key_env": "OPENAI_API_KEY", "model": "gpt-4o"},
    "gemini": {"base": "https://generativelanguage.googleapis.com/v1beta", "key_env": "GOOGLE_API_KEY", "model": "gemini-1.5-pro"},
    "mistral": {"base": "https://api.mistral.ai/v1", "key_env": "MISTRAL_API_KEY", "model": "mistral-large-latest"},
}


@router.post("/chat")
async def chat(provider: str, message: str, current_user: User = Depends(get_current_user)):
    config = PROVIDERS.get(provider)
    if not config:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")
    
    api_key = os.getenv(config["key_env"])
    if not api_key:
        raise HTTPException(status_code=503, detail=f"Provider {provider} not configured")
    
    try:
        if provider == "claude":
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{config['base']}/messages",
                    headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                    json={"model": config["model"], "max_tokens": 1024, "messages": [{"role": "user", "content": message}]},
                    timeout=30,
                )
                r.raise_for_status()
                data = r.json()
                return {"provider": provider, "reply": data["content"][0]["text"]}
        
        elif provider == "gpt":
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{config['base']}/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
                    json={"model": config["model"], "messages": [{"role": "user", "content": message}]},
                    timeout=30,
                )
                r.raise_for_status()
                data = r.json()
                return {"provider": provider, "reply": data["choices"][0]["message"]["content"]}
        
        else:
            return {"provider": provider, "reply": f"Routing to {provider} is configured but not yet implemented."}
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Provider error: {e.response.text}")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail=f"Provider {provider} unreachable")


@router.get("/providers")
def list_providers():
    return [{"name": k, "model": v["model"], "available": bool(os.getenv(v["key_env"]))} for k, v in PROVIDERS.items()]
