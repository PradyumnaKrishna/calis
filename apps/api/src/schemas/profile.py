from pydantic import ConfigDict
from sqlmodel import Field, SQLModel

from ..models import Level, VolumeTier
from .level import AnswerValue


class ProfileCreateRequest(SQLModel):
    answers: dict[str, AnswerValue]


class ProfileCreated(SQLModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    profile_id: str = Field(alias="profileId")
    level: Level
    current_plan_level: Level = Field(alias="currentPlanLevel")
    current_volume_tier: VolumeTier = Field(alias="currentVolumeTier")
    streak: int


class ProfilePublic(ProfileCreated):
    pass
