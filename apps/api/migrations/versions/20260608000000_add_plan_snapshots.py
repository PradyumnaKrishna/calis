"""Add plan snapshots.

Revision ID: 20260608000000
Revises: 20260607010000
Create Date: 2026-06-08 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260608000000"
down_revision: str | Sequence[str] | None = "20260607010000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "plan_snapshots",
        sa.Column("profile_id", sa.String(), nullable=False),
        sa.Column("plan_level", sa.String(), nullable=False),
        sa.Column("volume_tier", sa.String(), nullable=False),
        sa.Column("plan_data", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"]),
        sa.PrimaryKeyConstraint("profile_id"),
    )
    op.create_index("ix_plan_snapshots_plan_level", "plan_snapshots", ["plan_level"])
    op.create_index("ix_plan_snapshots_volume_tier", "plan_snapshots", ["volume_tier"])

    op.create_table(
        "plan_workout_completions",
        sa.Column("profile_id", sa.String(), nullable=False),
        sa.Column("workout_date", sa.Date(), nullable=False),
        sa.Column("day", sa.Integer(), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"]),
        sa.PrimaryKeyConstraint("profile_id", "workout_date"),
    )
    op.create_index("ix_plan_workout_completions_completed", "plan_workout_completions", ["completed"])
    op.create_index("ix_plan_workout_completions_day", "plan_workout_completions", ["day"])
    op.create_index(
        "ix_plan_workout_completions_workout_date",
        "plan_workout_completions",
        ["workout_date"],
    )


def downgrade() -> None:
    op.drop_index("ix_plan_workout_completions_workout_date", table_name="plan_workout_completions")
    op.drop_index("ix_plan_workout_completions_day", table_name="plan_workout_completions")
    op.drop_index("ix_plan_workout_completions_completed", table_name="plan_workout_completions")
    op.drop_table("plan_workout_completions")

    op.drop_index("ix_plan_snapshots_volume_tier", table_name="plan_snapshots")
    op.drop_index("ix_plan_snapshots_plan_level", table_name="plan_snapshots")
    op.drop_table("plan_snapshots")
