"""Government / administrative dashboard endpoints.

Privacy (CLAUDE.md section 20): nothing here returns farmer names, emails or
any personal contact detail. Only crop, disease and coarse location leave the
backend.
"""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import CropReport, Prediction
from app.schemas.dashboard import DiseaseCount, MapPoint, SummaryOut, TrendPoint

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Reports of the same disease within this many decimal degrees (~11 km) are
# treated as the same locality when counting hotspots.
HOTSPOT_GRID = 0.1
# A locality becomes "high risk" at this many reports of one disease.
HOTSPOT_THRESHOLD = 3


def _filtered(
    db: Session,
    crop: str | None,
    disease: str | None,
    region: str | None,
    date_from: date | None,
    date_to: date | None,
):
    """Reports joined to their prediction, with the standard dashboard filters."""
    query = db.query(CropReport, Prediction).outerjoin(
        Prediction, Prediction.report_id == CropReport.id
    )
    if crop:
        query = query.filter(CropReport.crop_type == crop)
    if disease:
        query = query.filter(Prediction.disease == disease)
    if region:
        query = query.filter(CropReport.region == region)
    if date_from:
        query = query.filter(CropReport.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(CropReport.created_at <= datetime.combine(date_to, datetime.max.time()))
    return query


@router.get("/summary", response_model=SummaryOut)
def summary(
    crop: str | None = None,
    disease: str | None = None,
    region: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
) -> SummaryOut:
    rows = _filtered(db, crop, disease, region, date_from, date_to).all()

    total = len(rows)
    healthy = sum(1 for _, p in rows if p is not None and p.disease == "healthy")
    diseased = sum(1 for _, p in rows if p is not None and p.disease != "healthy")

    # Distinct localities that reported any disease.
    areas: set[tuple[float, float]] = set()
    clusters: dict[tuple[str, float, float], int] = {}
    disease_counts: dict[str, int] = {}

    for report, prediction in rows:
        if prediction is None or prediction.disease == "healthy":
            continue
        disease_counts[prediction.disease] = disease_counts.get(prediction.disease, 0) + 1
        if report.latitude is None or report.longitude is None:
            continue
        cell = (
            round(report.latitude / HOTSPOT_GRID) * HOTSPOT_GRID,
            round(report.longitude / HOTSPOT_GRID) * HOTSPOT_GRID,
        )
        areas.add(cell)
        key = (prediction.disease, cell[0], cell[1])
        clusters[key] = clusters.get(key, 0) + 1

    most_common, most_common_count = (None, 0)
    if disease_counts:
        most_common, most_common_count = max(disease_counts.items(), key=lambda kv: kv[1])

    high_risk = sum(1 for count in clusters.values() if count >= HOTSPOT_THRESHOLD)

    return SummaryOut(
        total_reports=total,
        affected_areas=len(areas),
        most_common_disease=most_common,
        most_common_disease_count=most_common_count,
        high_risk_areas=high_risk,
        healthy_reports=healthy,
        diseased_reports=diseased,
    )


@router.get("/map", response_model=list[MapPoint])
def map_points(
    crop: str | None = None,
    disease: str | None = None,
    region: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(1000, ge=1, le=5000),
    db: Session = Depends(get_db),
) -> list[MapPoint]:
    """Report locations for the map. Deliberately carries no farmer identity."""
    rows = (
        _filtered(db, crop, disease, region, date_from, date_to)
        .filter(CropReport.latitude.isnot(None))
        .filter(CropReport.longitude.isnot(None))
        .order_by(CropReport.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        MapPoint(
            id=report.id,
            latitude=report.latitude,
            longitude=report.longitude,
            crop=report.crop_type,
            disease=prediction.disease if prediction else None,
            confidence=prediction.confidence if prediction else None,
            region=report.region,
            created_at=report.created_at.isoformat(),
        )
        for report, prediction in rows
    ]


@router.get("/diseases", response_model=list[DiseaseCount])
def disease_breakdown(
    crop: str | None = None,
    region: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
) -> list[DiseaseCount]:
    rows = _filtered(db, crop, None, region, date_from, date_to).all()
    counts: dict[tuple[str, str], int] = {}
    for _, prediction in rows:
        if prediction is None:
            continue
        key = (prediction.disease, prediction.crop)
        counts[key] = counts.get(key, 0) + 1
    return [
        DiseaseCount(disease=d, crop=c, count=n)
        for (d, c), n in sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    ]


@router.get("/trends", response_model=list[TrendPoint])
def trends(
    days: int = Query(30, ge=1, le=365),
    crop: str | None = None,
    disease: str | None = None,
    db: Session = Depends(get_db),
) -> list[TrendPoint]:
    """Reports per day for the last N days, including days with zero reports."""
    since = datetime.now(timezone.utc) - timedelta(days=days - 1)
    query = db.query(CropReport, Prediction).outerjoin(
        Prediction, Prediction.report_id == CropReport.id
    ).filter(CropReport.created_at >= since)
    if crop:
        query = query.filter(CropReport.crop_type == crop)
    if disease:
        query = query.filter(Prediction.disease == disease)

    counts: dict[str, int] = {}
    for report, _ in query.all():
        key = report.created_at.date().isoformat()
        counts[key] = counts.get(key, 0) + 1

    today = datetime.now(timezone.utc).date()
    series = []
    for offset in range(days - 1, -1, -1):
        day = (today - timedelta(days=offset)).isoformat()
        series.append(TrendPoint(date=day, count=counts.get(day, 0)))
    return series


@router.get("/crops")
def crop_breakdown(db: Session = Depends(get_db)) -> list[dict]:
    """Distinct crops with report counts — used to populate filter dropdowns."""
    rows = (
        db.query(CropReport.crop_type, func.count(CropReport.id))
        .group_by(CropReport.crop_type)
        .all()
    )
    return [{"crop": crop, "count": count} for crop, count in rows]
