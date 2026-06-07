from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from ..core.database import get_session
from ..models import QuestionRecord
from ..schemas import LevelAssessment, LevelRequest, Questionnaire
from ..services import assess_level

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

QUESTIONNAIRE_ID = "calis-onboarding"
QUESTIONNAIRE_TITLE = "Calis onboarding"
QUESTIONNAIRE_DESCRIPTION = "Builds a starter profile from goal, ability, equipment, constraints, and training availability."


@router.get("/questionnaire", response_model=Questionnaire)
def questionnaire(session: Session = Depends(get_session)) -> Questionnaire:
    questions = session.exec(
        select(QuestionRecord)
        .options(selectinload(QuestionRecord.options))
        .where(QuestionRecord.is_active == True)  # noqa: E712
        .order_by(QuestionRecord.position)
    ).all()

    if not questions:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    return Questionnaire(
        id=QUESTIONNAIRE_ID,
        title=QUESTIONNAIRE_TITLE,
        description=QUESTIONNAIRE_DESCRIPTION,
        steps=questions,
    )


@router.post("/level", response_model=LevelAssessment)
def level(
    request: LevelRequest, session: Session = Depends(get_session)
) -> LevelAssessment:
    return assess_level(session, request.answers)
