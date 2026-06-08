"""Add completed exercise ids.

Revision ID: 20260608010000
Revises: 20260608000000
Create Date: 2026-06-08 01:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260608010000"
down_revision: str | Sequence[str] | None = "20260608000000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "plan_workout_completions",
        sa.Column("completed_exercise_ids", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("plan_workout_completions", "completed_exercise_ids")
