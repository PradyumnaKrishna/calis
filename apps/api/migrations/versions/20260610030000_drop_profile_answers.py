"""Drop profile answers.

Revision ID: 20260610030000
Revises: 20260610020000
Create Date: 2026-06-10 03:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260610030000"
down_revision: str | Sequence[str] | None = "20260610020000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_column("profiles", "answers")


def downgrade() -> None:
    op.add_column("profiles", sa.Column("answers", sa.JSON(), nullable=True))
