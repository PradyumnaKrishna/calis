"""Add profiles.

Revision ID: 20260607010000
Revises: 20260607000000
Create Date: 2026-06-07 01:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260607010000"
down_revision: str | Sequence[str] | None = "20260607000000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("goal", sa.String(), nullable=False),
        sa.Column("level", sa.String(), nullable=False),
        sa.Column("training_days", sa.Integer(), nullable=False),
        sa.Column("equipment", sa.JSON(), nullable=True),
        sa.Column("constraints", sa.JSON(), nullable=True),
        sa.Column("answers", sa.JSON(), nullable=True),
        sa.Column("current_plan_level", sa.String(), nullable=False),
        sa.Column("current_volume_tier", sa.String(), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_profiles_goal", "profiles", ["goal"])
    op.create_index("ix_profiles_level", "profiles", ["level"])
    op.create_index("ix_profiles_training_days", "profiles", ["training_days"])
    op.create_index("ix_profiles_current_plan_level", "profiles", ["current_plan_level"])
    op.create_index(
        "ix_profiles_current_volume_tier",
        "profiles",
        ["current_volume_tier"],
    )


def downgrade() -> None:
    op.drop_index("ix_profiles_current_volume_tier", table_name="profiles")
    op.drop_index("ix_profiles_current_plan_level", table_name="profiles")
    op.drop_index("ix_profiles_training_days", table_name="profiles")
    op.drop_index("ix_profiles_level", table_name="profiles")
    op.drop_index("ix_profiles_goal", table_name="profiles")
    op.drop_table("profiles")
