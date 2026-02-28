"""
StyleSense - AI Fashion Recommendation System
Main FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from routes.auth import router as auth_router
from routes.recommendations import router as rec_router
from models.database import init_db

# Initialize FastAPI app
app = FastAPI(
    title="StyleSense API",
    description="AI-Powered Fashion Recommendation System",
    version="1.0.0"
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("✅ StyleSense API started successfully!")

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(rec_router, prefix="/api", tags=["Recommendations"])

# Serve static frontend files
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/static", StaticFiles(directory=frontend_path), name="static")

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(frontend_path, "index.html"))

@app.get("/dashboard")
async def serve_dashboard():
    return FileResponse(os.path.join(frontend_path, "dashboard.html"))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": "StyleSense"}
