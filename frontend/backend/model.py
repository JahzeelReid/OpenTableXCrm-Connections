from extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import ForeignKey, Text, String
from datetime import datetime, timezone, timedelta
import pytz

# from zoneinfo import ZoneInfo

eastern = pytz.timezone("America/New_York")


class Company(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    state: Mapped[int] = mapped_column(default=1)
    # The state of the account determines what the client should be doing
    bearer_token: Mapped[str]
    location_id: Mapped[str]
    # Relationship to scheduled posts
    scheduled_posts: Mapped[list["ScheduledPost"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    # queued_posts: Mapped[list["Post"]] = relationship(
    # list of post ids queued
    menu: Mapped[dict] = mapped_column(JSON, nullable=True)  # menu stored as JSON
    links: Mapped[dict] = mapped_column(JSON, nullable=True)  # links stored as JSON
    week_tally: Mapped[int] = mapped_column(default=0)  # number of posts this week
    # NEED A CRON JOB TO RESET THIS EVERY WEEK
    total_messages: Mapped[int] = mapped_column(default=0)  # total clicks tracked


class ScheduledPost(db.Model):
    __tablename__ = "scheduled_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"))
    local_id: Mapped[int] = mapped_column()  # 1-12
    day_of_week: Mapped[int] = mapped_column(nullable=True)  # 0-6 (Sun-Sat)
    time: Mapped[int] = mapped_column(
        nullable=True
    )  # 0-3 for morning 9, afternoon 12, evening 6, night 9
    posted: Mapped[bool] = mapped_column(default=False)
    mode: Mapped[str] = mapped_column(nullable=True)  # "auto" or "manual"
    promotion: Mapped[str] = mapped_column(nullable=True)  # if auto
    # created_at: Mapped[datetime] = mapped_column(default=datetime.now)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
    link: Mapped[str] = mapped_column(nullable=True)

    company: Mapped["Company"] = relationship(back_populates="scheduled_posts")
    # NEED A CRON JOB TO RESET ALL POSTS ONCE A MONTH ON THE FIRST PREFEREBLY


class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    public_id = db.Column(db.String(50), unique=True)
    username: Mapped[str] = mapped_column(unique=True)
    password: Mapped[str]
    email: Mapped[str]
    company_id: Mapped[int] = mapped_column(db.ForeignKey("company.id"))


class Post(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(db.ForeignKey("company.id"))
    title: Mapped[str]
    content: Mapped[str]
    image_url: Mapped[str] = mapped_column(nullable=True)
    user_id: Mapped[int] = mapped_column(db.ForeignKey("user.id"))
    # created_at: Mapped[datetime] = mapped_column(default=datetime.now)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )


class TrackedLink(db.Model):
    __tablename__ = "tracked_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(
        String(10), unique=True, index=True, nullable=False
    )
    destination_url: Mapped[str] = mapped_column(Text, nullable=False)

    company_id: Mapped[int] = mapped_column(nullable=False)

    # created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )


class LinkClick(db.Model):
    __tablename__ = "link_clicks"

    id: Mapped[int] = mapped_column(primary_key=True)
    tracked_link_id: Mapped[int] = mapped_column(
        ForeignKey("tracked_links.id"), nullable=False
    )

    # clicked_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
    ip_address: Mapped[str] = mapped_column(String(45))
    user_agent: Mapped[str] = mapped_column(Text)


class CronLock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_name = db.Column(db.String(50), nullable=False)
    run_date = db.Column(db.Date, nullable=False)

    __table_args__ = (db.UniqueConstraint("job_name", "run_date"),)
