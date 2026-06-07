from pathlib import Path

from alembic import command
from alembic.config import Config

from ..core.config import API_ROOT, DATABASE_PATH


def _alembic_config() -> Config:
    config = Config(str(API_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(API_ROOT / "migrations"))
    config.set_main_option("sqlalchemy.url", f"sqlite:///{DATABASE_PATH}")
    return config


def migrate_database(revision: str = "head") -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    command.upgrade(_alembic_config(), revision)


def reset_database_file() -> None:
    DATABASE_PATH.unlink(missing_ok=True)


def main() -> None:
    migrate_database()
    print(f"Migrated Calis API database at {Path(DATABASE_PATH)}.")


if __name__ == "__main__":
    main()
