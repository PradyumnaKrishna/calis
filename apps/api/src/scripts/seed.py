import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlmodel import Session, delete

from ..core.database import engine
from ..models import (
    Exercise,
    QuestionOptionRecord,
    QuestionRecord,
)
from .migrate import migrate_database, reset_database_file


QUESTIONNAIRE = {
    "id": "calis-onboarding",
    "title": "Calis onboarding",
    "description": "Builds a starter profile from goal, ability, equipment, constraints, and training availability.",
    "steps": [
        {
            "id": "primary_goal",
            "type": "single",
            "eyebrow": "Start point",
            "question": "What are you trying to achieve first?",
            "hint": "This sets the direction of your plan. Strength, skills, and mobility need different starting progressions.",
            "options": [
                {"id": "strength", "label": "Get stronger"},
                {"id": "pullups", "label": "Learn pull-ups"},
                {"id": "handstand", "label": "Learn handstands"},
                {"id": "mobility", "label": "Improve mobility"},
                {"id": "general_fitness", "label": "Build general fitness"},
            ],
        },
        {
            "id": "push_ups",
            "type": "single",
            "eyebrow": "Push strength",
            "question": "How many clean push-ups can you do?",
            "hint": "Clean reps matter more than maximum effort. This helps estimate your pressing baseline.",
            "options": [
                {"id": "push_0", "label": "0", "score": 0},
                {"id": "push_1_4", "label": "1-4", "score": 1},
                {"id": "push_5_14", "label": "5-14", "score": 2},
                {"id": "push_15_29", "label": "15-29", "score": 3},
                {"id": "push_30_plus", "label": "30+", "score": 4},
            ],
        },
        {
            "id": "pulling_capacity",
            "type": "single",
            "eyebrow": "Pull strength",
            "question": "What can you currently do for pulling?",
            "hint": "Pulling ability decides whether the plan starts with rows, hangs, negatives, or full pull-up progressions.",
            "options": [
                {"id": "cannot_hang", "label": "Cannot hang yet", "score": 0},
                {"id": "hang_under_10", "label": "Hang under 10 sec", "score": 1},
                {"id": "hang_10_30", "label": "Hang 10-30 sec", "score": 2},
                {"id": "pull_1_4", "label": "1-4 pull-ups", "score": 3},
                {"id": "pull_5_plus", "label": "5+ pull-ups", "score": 4},
            ],
        },
        {
            "id": "squat_capacity",
            "type": "single",
            "eyebrow": "Leg control",
            "question": "How many controlled bodyweight squats can you do comfortably?",
            "hint": "Squat control gives a simple lower-body signal and helps spot mobility or joint-limit starting points.",
            "options": [
                {"id": "squat_uncomfortable", "label": "Cannot squat comfortably", "score": 0},
                {"id": "squat_1_4", "label": "1-4", "score": 1},
                {"id": "squat_5_14", "label": "5-14", "score": 2},
                {"id": "squat_15_29", "label": "15-29", "score": 3},
                {"id": "squat_30_plus", "label": "30+", "score": 4},
            ],
        },
        {
            "id": "strength_background",
            "type": "single",
            "eyebrow": "Training history",
            "question": "Do you have recent strength training experience?",
            "hint": "This helps tune pacing. Weight training can help adaptation, but calisthenics progressions still start from bodyweight control.",
            "options": [
                {"id": "none_recent", "label": "No recent strength training"},
                {"id": "occasional", "label": "Occasional gym or weights"},
                {"id": "consistent", "label": "Consistent strength training"},
                {"id": "heavy", "label": "Heavy strength training"},
            ],
        },
        {
            "id": "equipment",
            "type": "multi",
            "eyebrow": "Setup",
            "question": "What equipment do you have access to?",
            "hint": "Equipment does not make the plan harder. It prevents the app from recommending progressions you cannot train.",
            "minSelections": 1,
            "options": [
                {"id": "none", "label": "None"},
                {"id": "pullup_bar", "label": "Pull-up bar"},
                {"id": "parallettes", "label": "Parallel bars"},
                {"id": "rings", "label": "Rings"},
                {"id": "bands", "label": "Resistance bands"},
            ],
        },
        {
            "id": "constraints",
            "type": "multi",
            "eyebrow": "Comfort",
            "question": "Is anything uncomfortable or risky right now?",
            "hint": "This helps filter exercises and keeps the first plan conservative around sensitive joints or positions.",
            "minSelections": 1,
            "options": [
                {"id": "none", "label": "None"},
                {"id": "wrists", "label": "Wrists"},
                {"id": "shoulders", "label": "Shoulders"},
                {"id": "knees", "label": "Knees"},
                {"id": "lower_back", "label": "Lower back"},
            ],
        },
        {
            "id": "training_days",
            "type": "single",
            "eyebrow": "Pace",
            "question": "How often do you realistically want to train?",
            "hint": "Frequency adjusts pacing and weekly volume. It should not make the starting level look more advanced.",
            "options": [
                {"id": "days_1", "label": "1 day per week"},
                {"id": "days_2", "label": "2 days per week"},
                {"id": "days_3", "label": "3 days per week"},
                {"id": "days_4_plus", "label": "4+ days per week"},
            ],
        },
    ],
}


def seed_questionnaire(session: Session) -> None:
    now = datetime.now(UTC)

    session.exec(delete(QuestionOptionRecord))
    session.exec(delete(QuestionRecord))

    for step_index, step in enumerate(QUESTIONNAIRE["steps"]):
        session.add(
            QuestionRecord(
                id=step["id"],
                position=step_index,
                weight=step.get("weight", 1),
                type=step["type"],
                eyebrow=step["eyebrow"],
                question=step["question"],
                hint=step["hint"],
                min_selections=step.get("minSelections"),
                max_selections=step.get("maxSelections"),
                created_at=now,
                updated_at=now,
            )
        )

        for option_index, option in enumerate(step["options"]):
            session.add(
                QuestionOptionRecord(
                    question_id=step["id"],
                    option_id=option["id"],
                    position=option_index,
                    label=option["label"],
                    score=option.get("score"),
                )
            )


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
        seed_questionnaire(session)
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
