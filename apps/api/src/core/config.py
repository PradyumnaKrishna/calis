from pathlib import Path
import os


API_ROOT = Path(__file__).resolve().parents[2]


def _sqlite_path(database_url: str) -> Path:
    if database_url.startswith("file:"):
        database_url = database_url.removeprefix("file:")

    path = Path(database_url)

    return path if path.is_absolute() else API_ROOT / path


DATABASE_PATH = _sqlite_path(os.getenv("DATABASE_URL", "file:./.data/calis.sqlite"))
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")
PORT = int(os.getenv("PORT", "3001"))
