"""Add onboarding sessions.

Revision ID: 20260610020000
Revises: 20260610010000
Create Date: 2026-06-10 02:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260610020000"
down_revision: str | Sequence[str] | None = "20260610010000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column("onboarded", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_profiles_onboarded", "profiles", ["onboarded"])

    op.create_table(
        "onboarding_sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("profile_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("questions", sa.JSON(), nullable=True),
        sa.Column("answers", sa.JSON(), nullable=True),
        sa.Column("assessment", sa.JSON(), nullable=True),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_onboarding_sessions_profile_id", "onboarding_sessions", ["profile_id"])
    op.create_index("ix_onboarding_sessions_status", "onboarding_sessions", ["status"])


def downgrade() -> None:
    op.drop_index("ix_onboarding_sessions_status", table_name="onboarding_sessions")
    op.drop_index("ix_onboarding_sessions_profile_id", table_name="onboarding_sessions")
    op.drop_table("onboarding_sessions")

    op.drop_index("ix_profiles_onboarded", table_name="profiles")
    op.drop_column("profiles", "onboarded")
