import uuid
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class EndeavorRecord(Base):
    __tablename__ = "endeavors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50))
    priority: Mapped[str] = mapped_column(String(20))
    keywords: Mapped[list[str]] = mapped_column(JSON, default=list)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    news_monitoring_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class EndeavorFileRecord(Base):
    __tablename__ = "endeavor_files"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    endeavor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("endeavors.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(Integer)
    s3_key: Mapped[str] = mapped_column(String(500))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

