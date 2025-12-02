from extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import ForeignKey
from datetime import datetime, timezone, timedelta


class Company(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    state: Mapped[int] = mapped_column(default=1)
    # The state of the account determines what the client should be doing
    bearer_token: Mapped[str]
    # Relationship to scheduled posts
    scheduled_posts: Mapped[list["ScheduledPost"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    # queued_posts: Mapped[list["Post"]] = relationship(
    # list of post ids queued
    menu: Mapped[dict] = mapped_column(JSON, nullable=True)  # menu stored as JSON


class ScheduledPost(db.Model):
    __tablename__ = "scheduled_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"))

    mode: Mapped[str] = mapped_column()  # "auto" or "manual"
    promotion: Mapped[str] = mapped_column(nullable=True)  # if auto
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    company: Mapped["Company"] = relationship(back_populates="scheduled_posts")


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
