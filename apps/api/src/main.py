from fastapi import FastAPI, Request
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


@app.middleware("http")
async def add_profile_context(request: Request, call_next):
    request.state.profile_id = request.headers.get("X-Profile-Id")

    return await call_next(request)


app.mount("/media", StaticFiles(directory=API_ROOT / "public" / "media"), name="media")
app.include_router(api_router)
