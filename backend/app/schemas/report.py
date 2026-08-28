"""API request/response shapes. These define the contract the frontend codes against."""

from datetime import datetime

from pydantic import BaseModel, Field


class PredictionOut(BaseModel):
    disease: str
    crop: str
    confidence: float
    model_version: str

    model_config = {"protected_namespaces": (), "from_attributes": True}


class TreatmentOut(BaseModel):
    disease_name: str
    description: str | None = None
    recommendation: str
    source: str | None = None
    # False means "we have no verified advice for this" — the UI must show that
    # differently from a real recommendation.
    verified: bool
    language: str


class ReportOut(BaseModel):
    id: int
    client_uuid: str | None = None
    crop_type: str
    image_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    region: str | None = None
    status: str
    error_message: str | None = None
    language: str
    captured_offline: bool
    created_at: datetime
    synced_at: datetime | None = None

    model_config = {"from_attributes": True}


class ReportDetail(BaseModel):
    """A report plus everything the farmer needs to see on the result screen."""

    report: ReportOut
    prediction: PredictionOut | None = None
    treatment: TreatmentOut | None = None


class QueuedReportIn(BaseModel):
    """One report captured offline, sent up by the browser's sync queue."""

    client_uuid: str = Field(
        ..., min_length=8, max_length=64,
        description="Stable id generated on the device; makes sync idempotent.",
    )
    crop_type: str
    language: str = "en"
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    region: str | None = None
    # Base64-encoded image bytes (data URI prefix optional).
    image_base64: str
    created_at: datetime | None = None


class SyncRequest(BaseModel):
    reports: list[QueuedReportIn]


class SyncResultItem(BaseModel):
    client_uuid: str
    status: str
    report_id: int | None = None
    # True when this uuid was already stored, i.e. a duplicate retry was ignored.
    duplicate: bool = False
    error: str | None = None


class SyncResponse(BaseModel):
    results: list[SyncResultItem]
