"""add awarded_by_user_id to point_logs

Revision ID: d6i4e7f8g9h0
Revises: c5h3d6e7f8g9
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d6i4e7f8g9h0"
down_revision: str = "c5h3d6e7f8g9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "point_logs",
        sa.Column("awarded_by_user_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_point_logs_awarded_by_user_id",
        "point_logs",
        "users",
        ["awarded_by_user_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_point_logs_awarded_by_user_id", "point_logs", type_="foreignkey")
    op.drop_column("point_logs", "awarded_by_user_id")
