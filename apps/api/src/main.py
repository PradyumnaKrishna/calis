from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import API_ROOT, CORS_ORIGIN
from .routes import api_router


app = FastAPI(title="Calis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if CORS_ORIGIN == "*" else [CORS_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=API_ROOT / "public" / "media"), name="media")
app.include_router(api_router)
