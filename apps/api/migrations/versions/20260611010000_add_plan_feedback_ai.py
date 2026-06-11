"""Add plan feedback AI fields.

Revision ID: 20260611010000
Revises: 20260610030000
Create Date: 2026-06-11 01:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260611010000"
down_revision: str | Sequence[str] | None = "20260610030000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "plan_workout_feedback",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("profile_id", sa.String(), nullable=False),
        sa.Column("workout_date", sa.Date(), nullable=False),
        sa.Column("day", sa.Integer(), nullable=False),
        sa.Column("plan_level", sa.String(), nullable=False),
        sa.Column("volume_tier", sa.String(), nullable=False),
        sa.Column("rating", sa.String(), nullable=False),
        sa.Column("note", sa.String(), nullable=True),
        sa.Column("ai_action", sa.String(), nullable=True),
        sa.Column("ai_confidence", sa.String(), nullable=True),
        sa.Column("ai_rationale", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_plan_workout_feedback_ai_action",
        "plan_workout_feedback",
        ["ai_action"],
    )
    op.create_index(
        "ix_plan_workout_feedback_ai_confidence",
        "plan_workout_feedback",
        ["ai_confidence"],
    )
    op.create_index(
        "ix_plan_workout_feedback_day",
        "plan_workout_feedback",
        ["day"],
    )
    op.create_index(
        "ix_plan_workout_feedback_plan_level",
        "plan_workout_feedback",
        ["plan_level"],
    )
    op.create_index(
        "ix_plan_workout_feedback_profile_id",
        "plan_workout_feedback",
        ["profile_id"],
    )
    op.create_index(
        "ix_plan_workout_feedback_rating",
        "plan_workout_feedback",
        ["rating"],
    )
    op.create_index(
        "ix_plan_workout_feedback_volume_tier",
        "plan_workout_feedback",
        ["volume_tier"],
    )
    op.create_index(
        "ix_plan_workout_feedback_workout_date",
        "plan_workout_feedback",
        ["workout_date"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_plan_workout_feedback_workout_date",
        table_name="plan_workout_feedback",
    )
    op.drop_index(
        "ix_plan_workout_feedback_volume_tier",
        table_name="plan_workout_feedback",
    )
    op.drop_index("ix_plan_workout_feedback_rating", table_name="plan_workout_feedback")
    op.drop_index(
        "ix_plan_workout_feedback_profile_id",
        table_name="plan_workout_feedback",
    )
    op.drop_index(
        "ix_plan_workout_feedback_plan_level",
        table_name="plan_workout_feedback",
    )
    op.drop_index("ix_plan_workout_feedback_day", table_name="plan_workout_feedback")
    op.drop_index(
        "ix_plan_workout_feedback_ai_confidence",
        table_name="plan_workout_feedback",
    )
    op.drop_index(
        "ix_plan_workout_feedback_ai_action",
        table_name="plan_workout_feedback",
    )
    op.drop_table("plan_workout_feedback")
