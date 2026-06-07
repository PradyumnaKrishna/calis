from pydantic import ConfigDict
from sqlmodel import Field, SQLModel


class ExercisePublic(SQLModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    slug: str
    name: str
    body_region: str = Field(alias="bodyRegion")
    movement_pattern: str = Field(alias="movementPattern")
    difficulty: int
    level: str
    gif: str
    instructions: str


class ExerciseList(SQLModel):
    data: list[ExercisePublic]
