from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..core.database import get_session
from ..models import OnboardingSession, OnboardingStatus, Profile
from ..schemas import (
    AnswerValue,
    OnboardingQuestion,
    OnboardingRequest,
    OnboardingResponse,
    ProfilePublic,
)
from ..services.onboarding_ai import (
    OnboardingAIError,
    assess_onboarding,
    generate_onboarding_questions,
)
from ..services.profile import apply_onboarding_assessment
from .dependencies import get_profile

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

DEFAULT_HINT_SUMMARIES = {
    "goal": "Tell Calis the outcome you want most.",
    "current_level": "Share what you can do today so your first plan starts safely.",
    "baseline_strength": "Pick the closest clean-rep baseline.",
    "training_days": "Choose a weekly pace you can repeat.",
    "equipment": "Select only equipment you can use consistently.",
    "constraints": "Flag discomfort so the plan avoids risky starting points.",
}


@router.get("", response_model=OnboardingResponse)
def onboarding(
    profile: Profile = Depends(get_profile),
    session: Session = Depends(get_session),
) -> OnboardingResponse:
    if profile.onboarded:
        return _completed_response(profile)

    onboarding_session = OnboardingSession.get_or_create_active(session, profile.id)

    return OnboardingResponse(
        status="in_progress",
        questions=_session_questions(onboarding_session),
    )


@router.post("", response_model=OnboardingResponse)
def submit(
    request: OnboardingRequest,
    profile: Profile = Depends(get_profile),
    session: Session = Depends(get_session),
) -> OnboardingResponse:
    if profile.onboarded:
        return _completed_response(profile)

    onboarding_session = OnboardingSession.get_or_create_active(session, profile.id)
    questions = _session_questions(onboarding_session)
    answers = {**onboarding_session.answers, **request.answers}

    onboarding_session.answers = answers
    onboarding_session.updated_at = datetime.now(UTC)

    if not _required_questions_answered(questions, answers):
        session.add(onboarding_session)
        session.commit()

        return OnboardingResponse(status="in_progress", questions=questions)

    if _is_initial_question_set(questions):
        try:
            next_questions = generate_onboarding_questions(answers)
        except OnboardingAIError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

        if next_questions:
            onboarding_session.questions = [
                question.model_dump(mode="json", by_alias=True)
                for question in next_questions
            ]
            session.add(onboarding_session)
            session.commit()

            return OnboardingResponse(status="in_progress", questions=next_questions)

    try:
        assessment = assess_onboarding(answers)
    except OnboardingAIError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    apply_onboarding_assessment(profile, assessment)
    onboarding_session.status = OnboardingStatus.COMPLETED
    onboarding_session.assessment = assessment.model_dump(mode="json")
    onboarding_session.updated_at = datetime.now(UTC)

    session.add(profile)
    session.add(onboarding_session)
    session.commit()
    session.refresh(profile)

    return _completed_response(profile)


def _session_questions(onboarding_session: OnboardingSession) -> list[OnboardingQuestion]:
    return [
        OnboardingQuestion.model_validate(_question_data_with_hint_copy(question))
        for question in onboarding_session.questions
    ]


def _question_data_with_hint_copy(question: dict) -> dict:
    if question.get("hint") is None:
        return question

    return {
        **question,
        "hintSummary": question.get("hintSummary")
        or question.get("hint_summary")
        or DEFAULT_HINT_SUMMARIES.get(str(question.get("id")))
        or question["hint"],
        "hintDescription": question.get("hintDescription")
        or question.get("hint_description")
        or question["hint"],
    }


def _required_questions_answered(
    questions: list[OnboardingQuestion],
    answers: dict[str, AnswerValue],
) -> bool:
    for question in questions:
        if not question.required:
            continue

        if not _has_answer(answers.get(question.id)):
            return False

    return True


def _has_answer(answer: AnswerValue | None) -> bool:
    if isinstance(answer, str):
        return bool(answer.strip())

    if isinstance(answer, list):
        return bool(answer)

    return False


def _is_initial_question_set(questions: list[OnboardingQuestion]) -> bool:
    return {question.id for question in questions} == {"goal", "current_level"}


def _completed_response(profile: Profile) -> OnboardingResponse:
    return OnboardingResponse(
        status="completed",
        questions=[],
        profile=ProfilePublic(
            profile_id=profile.id,
            level=profile.level,
            current_plan_level=profile.current_plan_level,
            current_volume_tier=profile.current_volume_tier,
            onboarded=profile.onboarded,
            streak=profile.streak,
        ),
    )
