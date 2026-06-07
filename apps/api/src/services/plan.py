from dataclasses import dataclass

from sqlmodel import Session, select

from ..models import Exercise, Level, Profile, VolumeTier
from ..schemas import CurrentPlan, PlanExercise, PlanWorkout
from .progression import next_level, previous_level

MovementPattern = str


@dataclass(frozen=True)
class VolumePrescription:
    sets: int
    reps: str
    hold_seconds: str
    rest_seconds: int


@dataclass(frozen=True)
class WorkoutTemplate:
    title: str
    patterns: tuple[MovementPattern, ...]


@dataclass(frozen=True)
class PlanCatalog:
    primary: list[Exercise]
    exposure: list[Exercise]


VOLUME_PRESCRIPTIONS = {
    VolumeTier.LOW: VolumePrescription(
        sets=2,
        reps="6-8",
        hold_seconds="15-20",
        rest_seconds=75,
    ),
    VolumeTier.MEDIUM: VolumePrescription(
        sets=3,
        reps="6-8",
        hold_seconds="15-20",
        rest_seconds=90,
    ),
    VolumeTier.HIGH: VolumePrescription(
        sets=3,
        reps="10-12",
        hold_seconds="25-30",
        rest_seconds=120,
    ),
}

WORKOUT_TEMPLATES = {
    1: [
        WorkoutTemplate("Full Body", ("push", "pull", "squat", "hinge", "core")),
    ],
    2: [
        WorkoutTemplate("Full Body A", ("push", "squat", "pull", "core")),
        WorkoutTemplate("Full Body B", ("pull", "hinge", "push", "core")),
    ],
    3: [
        WorkoutTemplate("Push + Core", ("push", "push", "core", "squat")),
        WorkoutTemplate("Pull + Legs", ("pull", "pull", "squat", "hinge")),
        WorkoutTemplate("Full Body", ("push", "pull", "squat", "core")),
    ],
    4: [
        WorkoutTemplate("Push", ("push", "push", "core", "squat")),
        WorkoutTemplate("Pull", ("pull", "pull", "hinge", "core")),
        WorkoutTemplate("Legs + Core", ("squat", "hinge", "core", "balance")),
        WorkoutTemplate("Full Body", ("push", "pull", "squat", "core")),
    ],
}

WORKOUT_DAYS = {
    1: [1],
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 6],
}


def generate_current_plan(session: Session, profile: Profile) -> CurrentPlan:
    frequency = _normalized_frequency(profile.training_days)
    catalog = _load_plan_catalog(session, profile)
    workouts = _build_workouts(profile, frequency, catalog)

    return CurrentPlan(
        profile_id=profile.id,
        level=profile.level,
        plan_level=profile.current_plan_level,
        volume_tier=profile.current_volume_tier,
        cycle_days=7,
        workouts=workouts,
    )


def _normalized_frequency(training_days: int) -> int:
    return max(1, min(training_days, 4))


def _load_plan_catalog(session: Session, profile: Profile) -> PlanCatalog:
    return PlanCatalog(
        primary=_catalog_for_levels(session, _primary_levels(profile.current_plan_level)),
        exposure=_exposure_catalog(session, profile),
    )


def _primary_levels(level: Level) -> list[Level]:
    if level == Level.FOUNDATION:
        return [Level.FOUNDATION, Level.BEGINNER]

    return [level, previous_level(level)]


def _exposure_catalog(session: Session, profile: Profile) -> list[Exercise]:
    if profile.current_volume_tier != VolumeTier.HIGH:
        return []

    return _catalog_for_levels(session, [next_level(profile.current_plan_level)])


def _catalog_for_levels(session: Session, levels: list[Level]) -> list[Exercise]:
    return session.exec(
        select(Exercise)
        .where(Exercise.level.in_([level.value for level in levels]))
        .order_by(Exercise.difficulty, Exercise.name)
    ).all()


def _build_workouts(
    profile: Profile,
    frequency: int,
    catalog: PlanCatalog,
) -> list[PlanWorkout]:
    exposure_ids: set[str] = set()

    return [
        PlanWorkout(
            day=WORKOUT_DAYS[frequency][index],
            title=template.title,
            exercises=_build_workout_exercises(
                template=template,
                catalog=catalog,
                tier=profile.current_volume_tier,
                constraints=profile.constraints,
                exposure_ids=exposure_ids,
            ),
        )
        for index, template in enumerate(WORKOUT_TEMPLATES[frequency])
    ]


def _build_workout_exercises(
    template: WorkoutTemplate,
    catalog: PlanCatalog,
    tier: VolumeTier,
    constraints: list[str],
    exposure_ids: set[str],
) -> list[PlanExercise]:
    used_ids: set[str] = set()
    exercises = [
        _plan_exercise(exercise, tier)
        for pattern in template.patterns
        if (
            exercise := _pick_exercise(
                pattern=pattern,
                catalog=catalog.primary,
                used_ids=used_ids,
                constraints=constraints,
            )
        )
    ]

    if tier == VolumeTier.HIGH:
        exposure = _pick_exposure_exercise(
            catalog=catalog.exposure,
            used_ids=used_ids | exposure_ids,
            constraints=constraints,
        )
        if exposure is not None:
            exposure_ids.add(exposure.id)
            exercises.append(_plan_exercise(exposure, VolumeTier.LOW))

    return exercises


def _pick_exercise(
    pattern: MovementPattern,
    catalog: list[Exercise],
    used_ids: set[str],
    constraints: list[str],
) -> Exercise | None:
    return _pick_first_available(
        catalog=catalog,
        used_ids=used_ids,
        constraints=constraints,
        movement_pattern=pattern,
    )


def _pick_exposure_exercise(
    catalog: list[Exercise],
    used_ids: set[str],
    constraints: list[str],
) -> Exercise | None:
    return _pick_first_available(
        catalog=catalog,
        used_ids=used_ids,
        constraints=constraints,
    )


def _pick_first_available(
    catalog: list[Exercise],
    used_ids: set[str],
    constraints: list[str],
    movement_pattern: MovementPattern | None = None,
) -> Exercise | None:
    for exercise in catalog:
        if exercise.id in used_ids:
            continue

        if movement_pattern is not None and exercise.movement_pattern != movement_pattern:
            continue

        if _blocked_by_constraint(exercise, constraints):
            continue

        used_ids.add(exercise.id)
        return exercise

    return None


def _blocked_by_constraint(exercise: Exercise, constraints: list[str]) -> bool:
    if "knees" in constraints and exercise.movement_pattern == "squat":
        return True

    if "lower_back" in constraints and exercise.movement_pattern == "hinge":
        return True

    if "shoulders" in constraints and exercise.movement_pattern in {"push", "pull"}:
        return True

    return False


def _plan_exercise(exercise: Exercise, tier: VolumeTier) -> PlanExercise:
    volume = VOLUME_PRESCRIPTIONS[tier]
    is_hold = "plank" in exercise.name.lower() or "hang" in exercise.name.lower()

    return PlanExercise(
        exercise_id=exercise.id,
        slug=exercise.slug,
        name=exercise.name,
        movement_pattern=exercise.movement_pattern,
        sets=volume.sets,
        reps=None if is_hold else volume.reps,
        hold_seconds=volume.hold_seconds if is_hold else None,
        rest_seconds=volume.rest_seconds,
    )
