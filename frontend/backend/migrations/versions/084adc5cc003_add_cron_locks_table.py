from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_cron_locks"
down_revision = None  # change if you already have migrations
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "cron_locks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("job_name", sa.String(length=50), nullable=False),
        sa.Column("run_date", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "job_name",
            "run_date",
            name="uq_cron_job_per_day",
        ),
    )


def downgrade():
    op.drop_table("cron_locks")
