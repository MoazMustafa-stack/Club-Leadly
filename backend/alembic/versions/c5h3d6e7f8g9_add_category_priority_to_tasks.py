"""add category and priority to tasks

Revision ID: c5h3d6e7f8g9
Revises: b4g2c5d6e7f8
Create Date: 2026-04-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5h3d6e7f8g9'
down_revision: Union[str, Sequence[str], None] = 'b4g2c5d6e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    priority_enum = sa.Enum('low', 'medium', 'high', name='priorityenum')
    priority_enum.create(op.get_bind(), checkfirst=True)

    op.add_column('tasks', sa.Column('category', sa.String(50), nullable=True))
    op.add_column('tasks', sa.Column('priority', priority_enum, nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('tasks', 'priority')
    op.drop_column('tasks', 'category')

    priority_enum = sa.Enum('low', 'medium', 'high', name='priorityenum')
    priority_enum.drop(op.get_bind(), checkfirst=True)
