"""Database models for the platform (see CLAUDE.md section 17).

Location is stored twice on purpose:
  * `latitude` / `longitude` as plain floats — simple, portable, and what the
    dashboard actually reads.
  * `geom` as a PostGIS POINT — only when running on PostgreSQL. This is what
    makes real spatial queries (nearby reports, hotspots, region filters)
    possible.
Keeping both means the app runs identically on the SQLite fallback.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.database.session import Base

if settings.is_postgres:
    from geoalchemy2 import Geometry


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --- Sync status values for a report (CLAUDE.md section 22) ---
STATUS_PENDING = "PENDING"
STATUS_PROCESSING = "PROCESSING"
STATUS_SYNCED = "SYNCED"
STATUS_FAILED = "FAILED"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="farmer", nullable=False)
    language: Mapped[str] = mapped_column(String(8), default="en", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    reports: Mapped[list["CropReport"]] = relationship(back_populates="user")


class CropReport(Base):
    __tablename__ = "crop_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Generated on the client so an offline report keeps its identity across a
    # retried sync. This is what makes /api/reports/sync idempotent.
    client_uuid: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)

    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    crop_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    image_url: Mapped[str | None] = mapped_column(String(512))

    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    region: Mapped[str | None] = mapped_column(String(120), index=True)

    status: Mapped[str] = mapped_column(
        String(20), default=STATUS_PENDING, nullable=False, index=True
    )
    error_message: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(8), default="en", nullable=False)

    # True when the report arrived through the offline sync endpoint. Useful for
    # demonstrating that offline capture actually worked.
    captured_offline: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    prediction: Mapped["Prediction | None"] = relationship(
        back_populates="report", uselist=False, cascade="all, delete-orphan"
    )
    user: Mapped["User | None"] = relationship(back_populates="reports")

    if settings.is_postgres:
        # SRID 4326 = plain WGS84 lat/lon, what a phone's GPS gives you.
        geom: Mapped[object | None] = mapped_column(
            Geometry(geometry_type="POINT", srid=4326), nullable=True
        )


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_id: Mapped[int] = mapped_column(
        ForeignKey("crop_reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    disease: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    crop: Mapped[str] = mapped_column(String(64), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    report: Mapped["CropReport"] = relationship(back_populates="prediction")


class Disease(Base):
    __tablename__ = "diseases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Machine-readable id the ML service emits, e.g. "early_blight".
    key: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    crop: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (UniqueConstraint("key", "crop", name="uq_disease_key_crop"),)

    treatments: Mapped[list["Treatment"]] = relationship(back_populates="disease")


class Treatment(Base):
    __tablename__ = "treatments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    disease_id: Mapped[int] = mapped_column(
        ForeignKey("diseases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    language: Mapped[str] = mapped_column(String(8), nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    # Where this advice came from. A treatment with no verifiable source must
    # not be presented as verified guidance.
    source: Mapped[str | None] = mapped_column(String(512))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    __table_args__ = (
        UniqueConstraint("disease_id", "language", name="uq_treatment_disease_lang"),
    )

    disease: Mapped["Disease"] = relationship(back_populates="treatments")


# Composite index: the dashboard's most common query is "reports of disease X
# over a time range".
Index("ix_reports_created_crop", CropReport.created_at, CropReport.crop_type)
