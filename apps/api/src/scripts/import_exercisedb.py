import json
import re
import shutil
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen


API_BASE_URL = "https://oss.exercisedb.dev/api/v1/exercises"
CATALOG_SIZE = 48
REQUEST_DELAY_SECONDS = 0.35
GIF_DELAY_SECONDS = 0.15
MAX_RETRIES = 5
MAX_CATALOG_PAGES = 48
USER_AGENT = "calis-exercisedb-importer/0.1"

API_ROOT = Path(__file__).resolve().parents[2]
SEED_FILE_PATH = Path(__file__).parent / "seed_data" / "exercises.json"
PUBLIC_MEDIA_DIR = API_ROOT / "public" / "media" / "exercises"

DESIRED_NAME_HINTS = [
    "push-up",
    "knee push-up",
    "incline push-up",
    "decline push-up",
    "diamond push-up",
    "pike push-up",
    "pull-up",
    "chin-up",
    "hanging knee raise",
    "dip",
    "bench dip",
    "plank",
    "side plank",
    "mountain climber",
    "leg raise",
    "crunch",
    "reverse crunch",
    "sit-up",
    "squat",
    "jump squat",
    "lunge",
    "split squat",
    "glute bridge",
    "hip raise",
    "calf raise",
    "wall sit",
    "burpee",
    "jumping jack",
    "bear crawl",
    "superman",
    "bird dog",
    "cobra",
    "upward facing dog",
    "downward facing dog",
]

EXCLUDED_NAME_HINTS = [
    "impossible",
    "muscle up",
    "handstand",
    "clap",
    "one arm",
    "weighted",
    "neck",
    "stretch",
    "potty",
    "quads",
    "(male)",
    "cable machine",
    "isometric wipers",
    "donkey",
]


def slugify(value: str) -> str:
    return re.sub(r"(^-+|-+$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def title_case(value: str) -> str:
    return value.title()


def clean_instruction(value: str) -> str:
    return re.sub(r"^Step:\d+\s*", "", value, flags=re.IGNORECASE).strip()


def infer_body_region(exercise: dict[str, Any]) -> str:
    name = exercise["name"].lower()
    body_parts = set(exercise["bodyParts"])
    target_muscles = set(exercise["targetMuscles"])

    if "waist" in body_parts or target_muscles.intersection({"abs", "spine"}):
        return "core"

    if body_parts.intersection({"upper legs", "lower legs"}) or target_muscles.intersection({"quads", "glutes", "calves"}):
        return "legs"

    if "back" in body_parts or any(hint in name for hint in ["pull", "row"]):
        return "back"

    if body_parts.intersection({"chest", "upper arms"}) or any(hint in name for hint in ["push", "dip"]):
        return "upper"

    if any(hint in name for hint in ["dog", "reach", "twist"]):
        return "mobility"

    return "other"


def infer_movement_pattern(exercise: dict[str, Any]) -> str:
    name = exercise["name"].lower()

    if any(hint in name for hint in ["pull", "row"]):
        return "pull"

    if any(hint in name for hint in ["push", "dip"]):
        return "push"

    if any(hint in name for hint in ["squat", "lunge", "calf raise"]):
        return "squat"

    if any(hint in name for hint in ["hip raise", "bridge"]):
        return "hinge"

    if any(hint in name for hint in ["sit-up", "crunch", "plank", "leg raise", "mountain climber"]):
        return "core"

    if any(hint in name for hint in ["dog", "reach", "twist"]):
        return "mobility"

    if any(hint in name for hint in ["crawl", "burpee"]):
        return "balance"

    return "core" if "waist" in exercise["bodyParts"] else "balance"


def infer_difficulty(exercise: dict[str, Any]) -> int:
    name = exercise["name"].lower()

    if any(
        hint in name
        for hint in [
            "incline push-up",
            "incline leg hip raise",
            "incline side plank",
            "incline twisting sit-up",
            "suspended row",
        ]
    ):
        return 1

    if any(hint in name for hint in ["single arm", "one leg squat", "l-pull", "ring dips", "superman push-up"]):
        return 5

    if any(hint in name for hint in ["pull-up", "chest dip", "decline", "hanging straight", "rocky"]):
        return 4

    if any(hint in name for hint in ["bench dip", "incline", "split squat", "burpee", "suspended row"]):
        return 2

    return 3


def level_from_difficulty(difficulty: int) -> str:
    if difficulty <= 1:
        return "foundation"

    if difficulty == 2:
        return "beginner"

    if difficulty == 3:
        return "intermediate"

    return "advanced"


def fetch_json(url: str) -> dict[str, Any]:
    for attempt in range(MAX_RETRIES + 1):
        request = Request(url, headers={"User-Agent": USER_AGENT})

        try:
            with urlopen(request) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code != 429 or attempt >= MAX_RETRIES:
                raise

            retry_after = error.headers.get("retry-after")
            delay = float(retry_after) if retry_after else 2.5 * (attempt + 1)
            time.sleep(delay)

    raise RuntimeError(f"Unable to fetch {url}")


def fetch_catalog() -> list[dict[str, Any]]:
    url: str | None = API_BASE_URL
    exercises: list[dict[str, Any]] = []
    pages_fetched = 0

    while url and pages_fetched < MAX_CATALOG_PAGES:
        payload = fetch_json(url)
        exercises.extend(payload["data"])
        pages_fetched += 1

        if payload["meta"]["hasNextPage"]:
            cursor = payload["meta"].get("nextCursor", "")
            url = f"{API_BASE_URL}?after={cursor}"
            time.sleep(REQUEST_DELAY_SECONDS)
        else:
            url = None

    return exercises


def unique_by_id(exercises: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []

    for exercise in exercises:
        if exercise["exerciseId"] in seen:
            continue

        seen.add(exercise["exerciseId"])
        unique.append(exercise)

    return unique


def score_exercise(exercise: dict[str, Any]) -> int:
    name = exercise["name"].lower()
    desired_score = sum(100 - index for index, hint in enumerate(DESIRED_NAME_HINTS) if hint in name)
    strength_bias = 30 if any(hint in name for hint in ["push", "pull", "dip", "squat", "raise", "row", "plank", "crawl"]) else 0
    body_part_score = len(set(exercise["bodyParts"])) * 4
    instruction_score = min(len(exercise["instructions"]), 6)

    return desired_score + strength_bias + body_part_score + instruction_score


def download_gif(exercise: dict[str, Any]) -> str:
    file_name = f"{slugify(exercise['name'])}-{exercise['exerciseId']}.gif"
    file_path = PUBLIC_MEDIA_DIR / file_name
    request = Request(exercise["gifUrl"], headers={"User-Agent": USER_AGENT})

    with urlopen(request) as response:
        file_path.write_bytes(response.read())

    time.sleep(GIF_DELAY_SECONDS)

    return f"/media/exercises/{file_name}"


def main() -> None:
    shutil.rmtree(PUBLIC_MEDIA_DIR, ignore_errors=True)
    PUBLIC_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)

    catalog = fetch_catalog()
    eligible = [
        exercise
        for exercise in unique_by_id(catalog)
        if "body weight" in exercise["equipments"]
        and not any(hint in exercise["name"].lower() for hint in EXCLUDED_NAME_HINTS)
    ]
    eligible.sort(key=score_exercise, reverse=True)

    seeds: list[dict[str, Any]] = []

    for exercise in eligible[: CATALOG_SIZE * 3]:
        try:
            local_gif_path = download_gif(exercise)
        except Exception as error:
            print(error)
            continue

        seeds.append(
            {
                "id": f"ex_{exercise['exerciseId']}",
                "name": title_case(exercise["name"]),
                "slug": slugify(exercise["name"]),
                "bodyRegion": infer_body_region(exercise),
                "movementPattern": infer_movement_pattern(exercise),
                "difficulty": (difficulty := infer_difficulty(exercise)),
                "level": level_from_difficulty(difficulty),
                "gif": local_gif_path,
                "instructions": "\n".join(item for item in map(clean_instruction, exercise["instructions"]) if item),
            }
        )

        if len(seeds) >= CATALOG_SIZE:
            break

    seeds.sort(key=lambda exercise: exercise["name"])
    SEED_FILE_PATH.write_text(json.dumps(seeds, indent=2) + "\n")

    print(f"Imported {len(seeds)} exercises from ExerciseDB.")
    print(f"Seed data: {SEED_FILE_PATH}")
    print(f"GIF assets: {PUBLIC_MEDIA_DIR}")


if __name__ == "__main__":
    main()
