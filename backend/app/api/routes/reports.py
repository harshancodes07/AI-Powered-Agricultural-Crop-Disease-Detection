"""Farmer-facing report endpoints."""

import base64
import binascii

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import CropReport
from app.schemas.report import (
    PredictionOut,
    ReportDetail,
    ReportOut,
    SyncRequest,
    SyncResponse,
    SyncResultItem,
    TreatmentOut,
)
from app.services import reports as report_service
from app.services import treatments as treatment_service
from app.storage import images

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _detail(db: Session, report: CropReport, treatment: dict | None) -> ReportDetail:
    prediction = report.prediction
    if treatment is None and prediction is not None:
        treatment = treatment_service.lookup(
            db,
            crop=prediction.crop,
            disease_key=prediction.disease,
            language=report.language,
        )
    return ReportDetail(
        report=ReportOut.model_validate(report),
        prediction=PredictionOut.model_validate(prediction) if prediction else None,
        treatment=TreatmentOut(**treatment) if treatment else None,
    )


@router.post("", response_model=ReportDetail, status_code=201)
async def create_report(
    file: UploadFile = File(..., description="Crop image"),
    crop_type: str = Form(...),
    language: str = Form("en"),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    region: str | None = Form(None),
    client_uuid: str | None = Form(None),
    db: Session = Depends(get_db),
) -> ReportDetail:
    """Upload a crop image and get a prediction plus a verified treatment.

    If the ML service is unavailable the report is still stored (status FAILED)
    so nothing the farmer captured is lost.
    """
    # If this uuid was already stored, return the existing result instead of
    # creating a duplicate — a retried request must be harmless.
    if client_uuid:
        existing = db.query(CropReport).filter_by(client_uuid=client_uuid).one_or_none()
        if existing is not None:
            return _detail(db, existing, None)

    contents = await file.read()
    try:
        report, _, treatment = await report_service.process_report(
            db,
            image_bytes=contents,
            filename=file.filename or "upload.jpg",
            crop_type=crop_type,
            language=language,
            latitude=latitude,
            longitude=longitude,
            region=region,
            client_uuid=client_uuid,
        )
    except images.InvalidImageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return _detail(db, report, treatment)


@router.post("/sync", response_model=SyncResponse)
async def sync_reports(
    payload: SyncRequest, db: Session = Depends(get_db)
) -> SyncResponse:
    """Accept a batch of reports captured while the device was offline.

    Idempotent: each report carries a client-generated uuid, so re-sending a
    batch after a dropped connection cannot create duplicates. One bad report in
    the batch does not prevent the others from syncing.
    """
    results: list[SyncResultItem] = []

    for queued in payload.reports:
        existing = (
            db.query(CropReport).filter_by(client_uuid=queued.client_uuid).one_or_none()
        )
        if existing is not None:
            results.append(
                SyncResultItem(
                    client_uuid=queued.client_uuid,
                    status=existing.status,
                    report_id=existing.id,
                    duplicate=True,
                )
            )
            continue

        raw = queued.image_base64
        if "," in raw[:64] and raw.strip().startswith("data:"):
            raw = raw.split(",", 1)[1]  # strip a data: URI prefix if present

        try:
            image_bytes = base64.b64decode(raw, validate=True)
        except (binascii.Error, ValueError):
            results.append(
                SyncResultItem(
                    client_uuid=queued.client_uuid,
                    status="FAILED",
                    error="Image data could not be decoded.",
                )
            )
            continue

        try:
            report, _, _ = await report_service.process_report(
                db,
                image_bytes=image_bytes,
                filename=f"{queued.client_uuid}.jpg",
                crop_type=queued.crop_type,
                language=queued.language,
                latitude=queued.latitude,
                longitude=queued.longitude,
                region=queued.region,
                client_uuid=queued.client_uuid,
                captured_offline=True,
                created_at=queued.created_at,
            )
        except images.InvalidImageError as exc:
            db.rollback()
            results.append(
                SyncResultItem(
                    client_uuid=queued.client_uuid, status="FAILED", error=str(exc)
                )
            )
            continue

        results.append(
            SyncResultItem(
                client_uuid=queued.client_uuid,
                status=report.status,
                report_id=report.id,
                error=report.error_message,
            )
        )

    return SyncResponse(results=results)


@router.get("", response_model=list[ReportOut])
def list_reports(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    crop: str | None = None,
    db: Session = Depends(get_db),
) -> list[ReportOut]:
    query = db.query(CropReport)
    if crop:
        query = query.filter(CropReport.crop_type == crop)
    rows = (
        query.order_by(CropReport.created_at.desc()).offset(offset).limit(limit).all()
    )
    return [ReportOut.model_validate(r) for r in rows]


@router.get("/{report_id}", response_model=ReportDetail)
def get_report(report_id: int, db: Session = Depends(get_db)) -> ReportDetail:
    report = db.get(CropReport, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    return _detail(db, report, None)
