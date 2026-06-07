from collections.abc import Iterator

from .config import DATABASE_PATH
from sqlmodel import SQLModel, Session, create_engine

from .. import models  # noqa: F401


engine = create_engine(
    f"sqlite:///{DATABASE_PATH}",
    connect_args={"check_same_thread": False},
)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def create_db_and_tables() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    SQLModel.metadata.create_all(engine)


def reset_db_and_tables() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    engine.dispose()
    DATABASE_PATH.unlink(missing_ok=True)
    SQLModel.metadata.create_all(engine)
