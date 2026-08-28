"""Dashboard response shapes.

None of these expose farmer identity (CLAUDE.md section 20).
"""

from pydantic import BaseModel


class SummaryOut(BaseModel):
    total_reports: int
    affected_areas: int
    most_common_disease: str | None
    most_common_disease_count: int
    high_risk_areas: int
    healthy_reports: int
    diseased_reports: int


class MapPoint(BaseModel):
    id: int
    latitude: float
    longitude: float
    crop: str
    disease: str | None
    confidence: float | None
    region: str | None
    created_at: str


class DiseaseCount(BaseModel):
    disease: str
    crop: str
    count: int


class TrendPoint(BaseModel):
    date: str
    count: int
