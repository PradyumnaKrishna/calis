from datetime import UTC, date, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..core.database import get_session
from ..models import PlanWorkoutCompletion, PlanWorkoutFeedback, Profile
from ..schemas import (
    CompleteTodayExerciseRequest,
    CurrentPlan,
    PlanAdjustmentAssessment,
    PlanFeedbackRequest,
    PlanFeedbackResponse,
    PlanSummary,
    PlanWorkout,
    TodayPlan,
)
from ..services.plan_feedback_ai import assess_plan_feedback
from ..services.plan import get_current_plan
from ..services.profile import advance_profile_plan, reduce_profile_plan_volume
from ..services.streak import (
    current_plan_completed_workout_count_since_last_negative_feedback,
    increment_streak,
    reconcile_streak_for_current_plan,
)
from .dependencies import get_onboarded_profile

router = APIRouter(prefix="/plans", tags=["plans"])
PLAN_ADVANCEMENT_STREAK_THRESHOLD = 4


@router.get("", response_model=CurrentPlan)
def plan(
    profile: Profile = Depends(get_onboarded_profile),
    session: Session = Depends(get_session),
) -> CurrentPlan:
    return get_current_plan(session, profile)


@router.get("/today", response_model=TodayPlan | None)
def today_plan(
    profile: Profile = Depends(get_onboarded_profile),
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

    return _to_today_plan(
        plan=plan,
        day=day,
        workout=workout,
        completed_exercise_ids=completed_exercise_ids,
        completed=completion.completed if completion else None,
    )


@router.post("/today", response_model=TodayPlan | None)
def complete_today_plan(
    request: CompleteTodayExerciseRequest,
    profile: Profile = Depends(get_onboarded_profile),
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
            current_plan_completed_workout_count_since_last_negative_feedback(
                session,
                profile,
            )
            > PLAN_ADVANCEMENT_STREAK_THRESHOLD
        ):
            advance_profile_plan(profile)

        session.add(profile)

    session.commit()

    return _to_today_plan(
        plan=plan,
        day=day,
        workout=workout,
        completed_exercise_ids=next_completed_exercise_ids,
        completed=is_completed,
    )


@router.post("/today/feedback", response_model=PlanFeedbackResponse | None)
def submit_today_plan_feedback(
    request: PlanFeedbackRequest,
    profile: Profile = Depends(get_onboarded_profile),
    session: Session = Depends(get_session),
) -> PlanFeedbackResponse | None:
    today = date.today()
    day = today.isoweekday()
    plan = get_current_plan(session, profile)
    workout = next((workout for workout in plan.workouts if workout.day == day), None)

    if workout is None:
        return None

    completion = session.get(PlanWorkoutCompletion, (profile.id, today))
    completed_exercise_ids = (
        completion.completed_exercise_ids
        if completion and completion.completed_exercise_ids
        else []
    )

    feedback = PlanWorkoutFeedback(
        id=f"feedback_{uuid4().hex}",
        profile_id=profile.id,
        workout_date=today,
        day=day,
        plan_level=profile.current_plan_level,
        volume_tier=profile.current_volume_tier,
        rating=request.rating,
        note=request.note,
    )
    session.add(feedback)
    session.commit()
    session.refresh(feedback)

    assessment = assess_plan_feedback(
        profile=profile,
        workout=workout,
        rating=request.rating,
        note=request.note,
    )

    if assessment is not None:
        _apply_plan_adjustment(session, profile, assessment)
        feedback.ai_action = assessment.action
        feedback.ai_confidence = assessment.confidence
        feedback.ai_rationale = assessment.rationale
        feedback.updated_at = datetime.now(UTC)
        session.add(feedback)
        session.add(profile)
        session.commit()

    updated_plan = get_current_plan(session, profile)
    updated_workout = next(
        (workout for workout in updated_plan.workouts if workout.day == day),
        workout,
    )

    return PlanFeedbackResponse(
        plan=_to_today_plan(
            plan=updated_plan,
            day=day,
            workout=updated_workout,
            completed_exercise_ids=completed_exercise_ids,
            completed=completion.completed if completion else None,
        ),
        assessment=assessment,
    )


def _apply_plan_adjustment(
    session: Session,
    profile: Profile,
    assessment: PlanAdjustmentAssessment,
) -> None:
    if assessment.confidence == "low":
        return

    match assessment.action:
        case "reduce_volume" | "flag_pain" | "repeat_level":
            reduce_profile_plan_volume(profile)
        case "increase_volume":
            if (
                current_plan_completed_workout_count_since_last_negative_feedback(
                    session,
                    profile,
                )
                > PLAN_ADVANCEMENT_STREAK_THRESHOLD
            ):
                advance_profile_plan(profile)
        case "keep_plan":
            return


def _to_today_plan(
    *,
    plan: CurrentPlan,
    day: int,
    workout: PlanWorkout,
    completed_exercise_ids: list[str],
    completed: bool | None = None,
) -> TodayPlan:
    exercise_ids = {exercise.exercise_id for exercise in workout.exercises}
    is_completed = (
        completed
        if completed is not None
        else bool(exercise_ids)
        and exercise_ids.issubset(completed_exercise_ids)
    )

    plan_summary = PlanSummary.model_validate(plan)

    return TodayPlan(
        **plan_summary.model_dump(),
        day=day,
        completed=is_completed,
        completed_exercise_ids=completed_exercise_ids,
        workout=workout,
    )
