"""Core report pipeline, shared by the online upload route and the offline sync
route so both behave identically.

Pipeline: validate image -> store file -> create report row -> call ML ->
store prediction -> look up verified treatment.

Guiding rule (CLAUDE.md section 22): a farmer's report is never lost. If the ML
service is down, the report is still saved with status FAILED and can be retried.
"""

import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import (
    STATUS_FAILED,
    STATUS_SYNCED,
    CropReport,
    Prediction,
)
from app.services import ml_client, treatments
from app.storage import images


def _set_location(report: CropReport, latitude: float | None, longitude: float | None):
    """Store coordinates, and the PostGIS point too when running on PostgreSQL."""
    report.latitude = latitude
    report.longitude = longitude

    if latitude is None or longitude is None:
        return
    if hasattr(type(report), "geom"):
        # WKT with SRID 4326 — plain GPS lat/lon.
        report.geom = f"SRID=4326;POINT({longitude} {latitude})"


async def process_report(
    db: Session,
    *,
    image_bytes: bytes,
    filename: str,
    crop_type: str,
    language: str = "en",
    latitude: float | None = None,
    longitude: float | None = None,
    region: str | None = None,
    client_uuid: str | None = None,
    captured_offline: bool = False,
    created_at: datetime | None = None,
) -> tuple[CropReport, Prediction | None, dict | None]:
    """Run one report end to end. Raises images.InvalidImageError on a bad image."""
    image_format = images.validate(image_bytes)  # raises before anything is stored
    image_url = images.save(image_bytes, image_format)

    report = CropReport(
        client_uuid=client_uuid,
        crop_type=crop_type,
        image_url=image_url,
        region=region,
        language=language,
        captured_offline=captured_offline,
    )
    if created_at is not None:
        report.created_at = created_at
    _set_location(report, latitude, longitude)

    db.add(report)
    # Commit before calling the ML service, for two reasons:
    #   1. The farmer's report is durable from this moment on, whatever happens
    #      to the model call.
    #   2. It releases the write lock. Holding a database transaction open
    #      across a network round-trip is what makes concurrent syncs collide
    #      ("database is locked" on SQLite) and can stall the event loop long
    #      enough for the ML request itself to time out.
    db.commit()
    db.refresh(report)

    prediction_row: Prediction | None = None
    treatment: dict | None = None

    try:
        result = await ml_client.predict(image_bytes, filename, crop_type)
    except ml_client.MLServiceError as exc:
        # Keep the report. The image is on disk and can be re-processed later.
        report.status = STATUS_FAILED
        report.error_message = str(exc)
        db.commit()
        db.refresh(report)
        return report, None, None

    prediction_row = Prediction(
        report_id=report.id,
        disease=result["disease"],
        crop=result["crop"],
        confidence=result["confidence"],
        model_version=result["model_version"],
        alternatives=json.dumps(result.get("alternatives", []), ensure_ascii=False),
        crop_supported=result.get("crop_supported", True),
    )
    db.add(prediction_row)

    treatment = treatments.lookup(
        db, crop=result["crop"], disease_key=result["disease"], language=language
    )

    report.status = STATUS_SYNCED
    report.synced_at = datetime.now(timezone.utc)
    report.error_message = None

    db.commit()
    db.refresh(report)
    db.refresh(prediction_row)
    return report, prediction_row, treatment
