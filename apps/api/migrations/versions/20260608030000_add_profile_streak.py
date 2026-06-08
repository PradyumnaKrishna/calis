"""Add profile streak.

Revision ID: 20260608030000
Revises: 20260608020000
Create Date: 2026-06-08 03:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260608030000"
down_revision: str | Sequence[str] | None = "20260608020000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column(
            "current_plan_started_at",
            sa.DateTime(),
            nullable=True,
        ),
    )
    op.execute("UPDATE profiles SET current_plan_started_at = created_at")
    op.add_column(
        "profiles",
        sa.Column("streak", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_profiles_streak", "profiles", ["streak"])


def downgrade() -> None:
    op.drop_index("ix_profiles_streak", table_name="profiles")
    op.drop_column("profiles", "streak")
    op.drop_column("profiles", "current_plan_started_at")
