"""
Faris AI SaaS - FastAPI Backend
Multi-tenant AI-powered sales outreach platform
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

# Import routers from consolidated API module
from app.api import (
    auth_router,
    profile_router,
    leads_router,
    campaigns_router,
    sources_router,
    integrations_router,
    dashboard_router,
    ai_router
)

# Lifespan for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Faris AI SaaS Backend starting...")
    yield
    # Shutdown
    print("Faris AI SaaS Backend shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Faris AI",
    description="AI-powered sales outreach platform for Saudi businesses",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://farisai.app",
        "https://app.farisai.app",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profile_router, prefix="/api/profile", tags=["Company Profile"])
app.include_router(leads_router, prefix="/api/leads", tags=["Leads"])
app.include_router(campaigns_router, prefix="/api/campaigns", tags=["Campaigns"])
app.include_router(sources_router, prefix="/api/sources", tags=["Data Sources"])
app.include_router(integrations_router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])


@app.get("/")
async def root():
    return {
        "name": "Faris AI",
        "name_ar": "فارس AI",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/api/docs"
    }


@app.get("/api/status")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "api": "operational",
            "database": "operational",
            "ai": "operational"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
