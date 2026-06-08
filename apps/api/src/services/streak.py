from datetime import UTC, date, datetime, timedelta

from sqlmodel import Session, func, select

from ..models import PlanWorkoutCompletion, Profile
from ..schemas import CurrentPlan


def reconcile_streak_for_current_plan(
    session: Session,
    profile: Profile,
    plan: CurrentPlan,
    today: date | None = None,
) -> bool:
    if today is None:
        today = date.today()

    if not _has_missed_current_plan_workout(session, profile, plan, today):
        return False

    if profile.streak == 0:
        return False

    profile.streak = 0
    profile.updated_at = datetime.now(UTC)
    session.add(profile)

    return True


def increment_streak(profile: Profile) -> None:
    profile.streak += 1
    profile.updated_at = datetime.now(UTC)


def current_plan_completed_workout_count(
    session: Session,
    profile: Profile,
) -> int:
    statement = select(func.count()).where(
        PlanWorkoutCompletion.profile_id == profile.id,
        PlanWorkoutCompletion.workout_date >= _current_plan_start_date(profile),
        PlanWorkoutCompletion.completed == True,  # noqa: E712
        PlanWorkoutCompletion.plan_level == profile.current_plan_level,
        PlanWorkoutCompletion.volume_tier == profile.current_volume_tier,
    )

    return session.exec(statement).one()


def _has_missed_current_plan_workout(
    session: Session,
    profile: Profile,
    plan: CurrentPlan,
    today: date,
) -> bool:
    workout_days = {workout.day for workout in plan.workouts}

    if not workout_days:
        return False

    current = _current_plan_start_date(profile)

    while current < today:
        if current.isoweekday() in workout_days and not _completed_current_plan_workout(
            session,
            profile,
            current,
        ):
            return True

        current += timedelta(days=1)

    return False


def _current_plan_start_date(profile: Profile) -> date:
    plan_started_at = profile.current_plan_started_at or profile.created_at

    return plan_started_at.date()


def _completed_current_plan_workout(
    session: Session,
    profile: Profile,
    workout_date: date,
) -> bool:
    completion = session.get(PlanWorkoutCompletion, (profile.id, workout_date))

    return (
        completion is not None
        and completion.completed
        and completion.plan_level == profile.current_plan_level
        and completion.volume_tier == profile.current_volume_tier
    )
