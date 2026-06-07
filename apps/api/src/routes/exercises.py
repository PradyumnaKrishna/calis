from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..core.database import get_session
from ..models import Exercise
from ..schemas import ExerciseList, ExercisePublic


router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=ExerciseList)
def list_exercises(session: Session = Depends(get_session)) -> ExerciseList:
    exercises = session.exec(select(Exercise).order_by(Exercise.name)).all()

    return ExerciseList(data=exercises)


@router.get("/{slug}", response_model=ExercisePublic)
def get_exercise(slug: str, session: Session = Depends(get_session)) -> ExercisePublic:
    exercise = session.exec(select(Exercise).where(Exercise.slug == slug)).first()

    if exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not found")

    return exercise
