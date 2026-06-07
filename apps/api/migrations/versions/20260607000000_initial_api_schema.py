"""Initial API schema.

Revision ID: 20260607000000
Revises:
Create Date: 2026-06-07 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260607000000"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "questions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False, server_default="1"),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("eyebrow", sa.String(), nullable=False),
        sa.Column("question", sa.String(), nullable=False),
        sa.Column("hint", sa.String(), nullable=False),
        sa.Column("min_selections", sa.Integer(), nullable=True),
        sa.Column("max_selections", sa.Integer(), nullable=True),
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
        sa.UniqueConstraint("position", name="uq_questions_position"),
    )
    op.create_index("ix_questions_is_active", "questions", ["is_active"])

    op.create_table(
        "question_options",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("question_id", sa.String(), nullable=False),
        sa.Column("option_id", sa.String(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["question_id"], ["questions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "question_id",
            "option_id",
            name="uq_question_options_question_option",
        ),
        sa.UniqueConstraint(
            "question_id",
            "position",
            name="uq_question_options_question_position",
        ),
    )
    op.create_index("ix_question_options_option_id", "question_options", ["option_id"])
    op.create_index("ix_question_options_question_id", "question_options", ["question_id"])

    op.create_table(
        "exercises",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("body_region", sa.String(), nullable=False),
        sa.Column("movement_pattern", sa.String(), nullable=False),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("level", sa.String(), nullable=False),
        sa.Column("gif", sa.String(), nullable=False),
        sa.Column("instructions", sa.String(), nullable=False),
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
        sa.CheckConstraint(
            "difficulty >= 1 AND difficulty <= 5",
            name="ck_exercises_difficulty_range",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_exercises_body_region", "exercises", ["body_region"])
    op.create_index("ix_exercises_difficulty", "exercises", ["difficulty"])
    op.create_index("ix_exercises_level", "exercises", ["level"])
    op.create_index("ix_exercises_movement_pattern", "exercises", ["movement_pattern"])
    op.create_index("ix_exercises_name", "exercises", ["name"])
    op.create_index("ix_exercises_slug", "exercises", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_exercises_slug", table_name="exercises")
    op.drop_index("ix_exercises_name", table_name="exercises")
    op.drop_index("ix_exercises_movement_pattern", table_name="exercises")
    op.drop_index("ix_exercises_level", table_name="exercises")
    op.drop_index("ix_exercises_difficulty", table_name="exercises")
    op.drop_index("ix_exercises_body_region", table_name="exercises")
    op.drop_table("exercises")

    op.drop_index("ix_question_options_question_id", table_name="question_options")
    op.drop_index("ix_question_options_option_id", table_name="question_options")
    op.drop_table("question_options")

    op.drop_index("ix_questions_is_active", table_name="questions")
    op.drop_table("questions")
