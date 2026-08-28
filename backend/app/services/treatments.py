"""Look up a verified treatment for a predicted disease.

Treatments come from the database only. Nothing here generates agricultural
advice (CLAUDE.md section 14) — if we have no verified entry, we say so.
"""

from sqlalchemy.orm import Session

from app.database.seed import NO_TREATMENT_TEXT
from app.models import Disease, Treatment

DEFAULT_LANGUAGE = "en"


def lookup(db: Session, crop: str, disease_key: str, language: str) -> dict:
    """Return {recommendation, source, verified, disease_name, description}.

    Falls back to English if the requested language has no entry yet, so adding
    a language later degrades gracefully instead of showing nothing.
    """
    disease = db.query(Disease).filter_by(key=disease_key, crop=crop).one_or_none()
    if disease is None:
        # The model recognised something our treatment database does not cover.
        disease = db.query(Disease).filter_by(key=disease_key).first()

    if disease is not None:
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
        if treatment is not None:
            return {
                "disease_name": disease.name,
                "description": disease.description,
                "recommendation": treatment.recommendation,
                "source": treatment.source,
                "verified": True,
                "language": treatment.language,
            }

    return {
        "disease_name": disease.name if disease else disease_key.replace("_", " ").title(),
        "description": disease.description if disease else None,
        "recommendation": NO_TREATMENT_TEXT.get(
            language, NO_TREATMENT_TEXT[DEFAULT_LANGUAGE]
        ),
        "source": None,
        "verified": False,
        "language": language if language in NO_TREATMENT_TEXT else DEFAULT_LANGUAGE,
    }
