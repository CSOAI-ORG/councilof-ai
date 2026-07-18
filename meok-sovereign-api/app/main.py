"""MEOK Sovereign API — unified backend for the marketing frontend."""

from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_db_and_tables

from app.auth.router import router as auth_router
from app.waitlist.router import router as waitlist_router
from app.characters.router import router as characters_router
from app.llm_router.router import router as llm_router
from app.payments.router import router as payments_router
from app.routers.proxy import router as proxy_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Unified API gateway for the MEOK marketing frontend. Serves auth, characters, waitlist, LLM routing, and proxies to existing backend services.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the marketing frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────

app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(waitlist_router, prefix="/api", tags=["waitlist"])
app.include_router(characters_router, prefix="/api", tags=["characters"])
app.include_router(llm_router, prefix="/api", tags=["llm"])
app.include_router(payments_router, prefix="/api", tags=["payments"])
app.include_router(proxy_router, prefix="/api", tags=["proxy"])


@app.get("/health")
def health_check_public():
    return {"status": "ok", "service": "meok-sovereign-api", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "meok-sovereign-api"}
