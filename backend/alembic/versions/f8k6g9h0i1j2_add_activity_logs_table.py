"""add activity_logs table

Revision ID: f8k6g9h0i1j2
Revises: e7j5f8g9h0i1
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f8k6g9h0i1j2"
down_revision: Union[str, None] = "e7j5f8g9h0i1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ACTIVITY_TYPES = (
    "member_joined",
    "member_left",
    "member_promoted",
    "points_awarded",
    "task_completed",
)


def upgrade() -> None:
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("club_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "activity_type",
            sa.Enum(*ACTIVITY_TYPES, name="activitytypeenum"),
            nullable=False,
        ),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("target_user_id", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["club_id"], ["clubs.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_activity_logs_club_id", "activity_logs", ["club_id"])


def downgrade() -> None:
    op.drop_index("ix_activity_logs_club_id", table_name="activity_logs")
    op.drop_table("activity_logs")
    sa.Enum(name="activitytypeenum").drop(op.get_bind(), checkfirst=True)
