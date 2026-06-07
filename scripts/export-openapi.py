import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "apps" / "api"))

from src.main import app


print(json.dumps(app.openapi(), indent=2))
