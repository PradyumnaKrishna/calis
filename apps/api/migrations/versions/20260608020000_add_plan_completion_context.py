"""Add plan completion context.

Revision ID: 20260608020000
Revises: 20260608010000
Create Date: 2026-06-08 02:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260608020000"
down_revision: str | Sequence[str] | None = "20260608010000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "plan_workout_completions",
        sa.Column("plan_level", sa.String(), nullable=True),
    )
    op.add_column(
        "plan_workout_completions",
        sa.Column("volume_tier", sa.String(), nullable=True),
    )
    op.add_column(
        "plan_workout_completions",
        sa.Column("feedback", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_plan_workout_completions_plan_level",
        "plan_workout_completions",
        ["plan_level"],
    )
    op.create_index(
        "ix_plan_workout_completions_volume_tier",
        "plan_workout_completions",
        ["volume_tier"],
    )
    op.create_index(
        "ix_plan_workout_completions_feedback",
        "plan_workout_completions",
        ["feedback"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_plan_workout_completions_feedback",
        table_name="plan_workout_completions",
    )
    op.drop_index(
        "ix_plan_workout_completions_volume_tier",
        table_name="plan_workout_completions",
    )
    op.drop_index(
        "ix_plan_workout_completions_plan_level",
        table_name="plan_workout_completions",
    )
    op.drop_column("plan_workout_completions", "feedback")
    op.drop_column("plan_workout_completions", "volume_tier")
    op.drop_column("plan_workout_completions", "plan_level")
