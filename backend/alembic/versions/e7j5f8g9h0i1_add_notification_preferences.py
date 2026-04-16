"""add notification_preferences table

Revision ID: e7j5f8g9h0i1
Revises: d6i4e7f8g9h0
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e7j5f8g9h0i1"
down_revision: str = "d6i4e7f8g9h0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_preferences",
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("task_assigned", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("points_awarded", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("task_due_soon", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("member_joined", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )


def downgrade() -> None:
    op.drop_table("notification_preferences")
