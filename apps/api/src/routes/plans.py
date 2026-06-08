from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session

from ..core.database import get_session
from ..models import PlanWorkoutCompletion, Profile
from ..schemas import CompleteTodayExerciseRequest, CurrentPlan, TodayPlan
from ..services.plan import get_current_plan
from ..services.profile import advance_profile_plan
from ..services.streak import (
    current_plan_completed_workout_count,
    increment_streak,
    reconcile_streak_for_current_plan,
)

router = APIRouter(prefix="/plans", tags=["plans"])
PLAN_ADVANCEMENT_STREAK_THRESHOLD = 4


def get_profile(
    profile_id: str = Header(alias="X-Profile-Id"),
    session: Session = Depends(get_session),
) -> Profile:
    profile = session.get(Profile, profile_id)

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


@router.get("", response_model=CurrentPlan)
def plan(
    profile: Profile = Depends(get_profile),
    session: Session = Depends(get_session),
) -> CurrentPlan:
    return get_current_plan(session, profile)


@router.get("/today", response_model=TodayPlan | None)
def today_plan(
    profile: Profile = Depends(get_profile),
    session: Session = Depends(get_session),
) -> TodayPlan | None:
    today = date.today()
    day = today.isoweekday()
    plan = get_current_plan(session, profile)
    workout = next((workout for workout in plan.workouts if workout.day == day), None)

    if workout is None:
        return None

    completion = session.get(PlanWorkoutCompletion, (profile.id, today))
    exercise_ids = {exercise.exercise_id for exercise in workout.exercises}
    completed_exercise_ids = (
        completion.completed_exercise_ids
        if completion and completion.completed_exercise_ids
        else []
    )

    return TodayPlan.model_validate(
        {
            **plan.model_dump(exclude={"cycle_days", "workouts"}),
            "day": day,
            "completed": bool(exercise_ids)
            and exercise_ids.issubset(completed_exercise_ids),
            "completedExerciseIds": completed_exercise_ids,
            "workout": workout,
        }
    )


@router.post("/today", response_model=TodayPlan | None)
def complete_today_plan(
    request: CompleteTodayExerciseRequest,
    profile: Profile = Depends(get_profile),
    session: Session = Depends(get_session),
) -> TodayPlan | None:
    today = date.today()
    day = today.isoweekday()
    plan = get_current_plan(session, profile)
    workout = next((workout for workout in plan.workouts if workout.day == day), None)

    if workout is None:
        return None

    reconcile_streak_for_current_plan(session, profile, plan)

    completion = session.get(PlanWorkoutCompletion, (profile.id, today))
    completed_exercise_ids = (
        completion.completed_exercise_ids
        if completion and completion.completed_exercise_ids
        else []
    )
    exercise_by_id = {exercise.exercise_id: exercise for exercise in workout.exercises}

    if request.exercise_id not in exercise_by_id:
        raise HTTPException(
            status_code=404, detail="Exercise not found in today's plan"
        )

    next_completed_exercise_id_set = {*completed_exercise_ids, request.exercise_id}
    next_completed_exercise_ids = [
        exercise_id
        for exercise_id in exercise_by_id
        if exercise_id in next_completed_exercise_id_set
    ]
    workout_exercise_ids = set(exercise_by_id)
    was_completed = bool(workout_exercise_ids) and workout_exercise_ids.issubset(
        completed_exercise_ids
    )
    is_completed = bool(workout_exercise_ids) and workout_exercise_ids.issubset(
        next_completed_exercise_ids
    )

    if completion is None:
        completion = PlanWorkoutCompletion(
            profile_id=profile.id,
            workout_date=today,
            day=day,
        )

    completion.plan_level = profile.current_plan_level
    completion.volume_tier = profile.current_volume_tier
    completion.completed_exercise_ids = next_completed_exercise_ids
    completion.completed = is_completed
    completion.updated_at = datetime.now(UTC)

    session.add(completion)

    if is_completed and not was_completed:
        increment_streak(profile)
        session.flush()

        if (
            current_plan_completed_workout_count(session, profile)
            > PLAN_ADVANCEMENT_STREAK_THRESHOLD
        ):
            advance_profile_plan(profile)

        session.add(profile)

    session.commit()

    return TodayPlan.model_validate(
        {
            **plan.model_dump(exclude={"cycle_days", "workouts"}),
            "day": day,
            "completed": is_completed,
            "completedExerciseIds": next_completed_exercise_ids,
            "workout": workout,
        }
    )
