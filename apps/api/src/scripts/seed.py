import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlmodel import Session, delete

from ..core.database import engine
from ..models import Exercise
from .migrate import migrate_database, reset_database_file


def seed_exercises(session: Session) -> None:
    now = datetime.now(UTC)
    seed_path = Path(__file__).parent / "seed_data" / "exercises.json"
    exercises: list[dict[str, Any]] = json.loads(seed_path.read_text())

    session.exec(delete(Exercise))

    for exercise in exercises:
        instructions = exercise["instructions"]
        if isinstance(instructions, list):
            instructions = "\n".join(instructions)

        session.add(
            Exercise(
                id=exercise["id"],
                name=exercise["name"],
                slug=exercise["slug"],
                body_region=exercise["bodyRegion"],
                movement_pattern=exercise["movementPattern"],
                difficulty=exercise["difficulty"],
                level=exercise["level"],
                gif=exercise["gif"],
                instructions=instructions,
                created_at=now,
                updated_at=now,
            )
        )


def seed_database() -> None:
    migrate_database()

    with Session(engine) as session:
        seed_exercises(session)
        session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Calis API database.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete the SQLite database before applying migrations and seed data.",
    )
    args = parser.parse_args()

    if args.reset:
        engine.dispose()
        reset_database_file()

    seed_database()
    print("Seeded Calis API database.")


if __name__ == "__main__":
    main()
