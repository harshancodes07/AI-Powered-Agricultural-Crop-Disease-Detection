"""API request/response shapes. These define the contract the frontend codes against."""

from datetime import datetime

from pydantic import BaseModel, Field


class AlternativeOut(BaseModel):
    crop: str
    disease: str
    confidence: float
    # Present when we hold a verified treatment for this alternative too.
    disease_name: str | None = None


class PredictionOut(BaseModel):
    disease: str
    crop: str
    confidence: float
    model_version: str
    # Runner-up diagnoses. Diseases like early and late blight look alike, so a
    # single answer overstates what the model actually knows.
    alternatives: list[AlternativeOut] = []
    # False when the model was never trained on the crop the farmer selected.
    crop_supported: bool = True

    model_config = {"protected_namespaces": (), "from_attributes": True}


class TreatmentOut(BaseModel):
    disease_name: str
    description: str | None = None

    # Structured guidance, so the UI can present it as sections rather than one
    # undifferentiated wall of text.
    summary: str | None = None
    symptoms: str | None = None
    cause: str | None = None
    immediate_actions: list[str] = []
    prevention: list[str] = []
    expert_note: str | None = None
    # none | low | moderate | high
    severity: str = "moderate"

    # The same advice as a single paragraph, for API clients that want plain text.
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
