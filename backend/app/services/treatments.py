"""Look up a verified treatment for a predicted disease.

Treatments come from the database only. Nothing here generates agricultural
advice (CLAUDE.md section 14) — if we have no verified entry, we say so plainly
rather than improvising.
"""

import json

from sqlalchemy.orm import Session

from app.database.treatment_data import NO_TREATMENT_TEXT
from app.models import Disease, Treatment

DEFAULT_LANGUAGE = "en"


def _json_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
        return value if isinstance(value, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def _unverified(disease: Disease | None, disease_key: str, language: str) -> dict:
    """The honest answer when the treatment database has nothing for this result."""
    lang = language if language in NO_TREATMENT_TEXT else DEFAULT_LANGUAGE
    return {
        "disease_name": disease.name
        if disease
        else disease_key.replace("_", " ").title(),
        "description": disease.description if disease else None,
        "summary": None,
        "symptoms": None,
        "cause": None,
        "immediate_actions": [],
        "prevention": [],
        "expert_note": None,
        "severity": disease.severity if disease else "moderate",
        "recommendation": NO_TREATMENT_TEXT[lang],
        "source": None,
        "verified": False,
        "language": lang,
    }


def lookup(db: Session, crop: str, disease_key: str, language: str) -> dict:
    """Return the full structured treatment for a (crop, disease) prediction.

    Falls back to English when the requested language has no entry yet, so
    adding a language later degrades gracefully instead of showing nothing.
    """
    disease = db.query(Disease).filter_by(key=disease_key, crop=crop).one_or_none()
    if disease is None:
        # The model named a disease our database does not have for this crop.
        # Try the same disease on any crop before giving up.
        disease = db.query(Disease).filter_by(key=disease_key).first()

    if disease is None:
        return _unverified(None, disease_key, language)

    treatment = (
        db.query(Treatment)
        .filter_by(disease_id=disease.id, language=language)
        .one_or_none()
    )
    if treatment is None and language != DEFAULT_LANGUAGE:
        treatment = (
            db.query(Treatment)
            .filter_by(disease_id=disease.id, language=DEFAULT_LANGUAGE)
            .one_or_none()
        )
    if treatment is None:
        return _unverified(disease, disease_key, language)

    return {
        "disease_name": disease.name,
        "description": disease.description,
        "summary": treatment.summary,
        "symptoms": treatment.symptoms,
        "cause": treatment.cause,
        "immediate_actions": _json_list(treatment.immediate_actions),
        "prevention": _json_list(treatment.prevention),
        "expert_note": treatment.expert_note,
        "severity": disease.severity,
        "recommendation": treatment.recommendation,
        "source": treatment.source,
        "verified": True,
        "language": treatment.language,
    }
