"""Add portrait fields and story content_json

Revision ID: 002
Revises: 001
Create Date: 2026-06-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("characters", sa.Column("portrait_prompt", sa.Text(), server_default="", nullable=False))
    op.add_column("characters", sa.Column("portrait_status", sa.String(32), server_default="pending", nullable=False))
    op.add_column("stories", sa.Column("content_json", sa.Text(), server_default="{}", nullable=False))


def downgrade() -> None:
    op.drop_column("stories", "content_json")
    op.drop_column("characters", "portrait_status")
    op.drop_column("characters", "portrait_prompt")
