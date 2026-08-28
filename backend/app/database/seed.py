"""Seeds the disease + treatment reference tables from `treatment_data.py`.

`diseases` and `treatments` are pure reference data — nothing in `crop_reports`
or `predictions` points at them by foreign key (a prediction stores the disease
as a plain string). That means we can safely drop and rebuild these two tables
whenever the reference content changes, WITHOUT touching a single farmer report.

That is how this project gets away with having no migration tool yet: report
data is preserved, reference data is rebuilt from source on every startup.
"""

import json

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.database.session import Base, SessionLocal, engine
from app.database.treatment_data import (
    DISEASES,
    EXTENSION_SOURCE,
    HEALTHY_CONTENT,
    HEALTHY_CROPS,
    NO_TREATMENT_TEXT,
    SEVERITY_NONE,
)
from app.models import Disease, Treatment

__all__ = ["seed", "main", "NO_TREATMENT_TEXT"]

# Bump this whenever treatment_data.py changes shape, to force a rebuild.
REFERENCE_SCHEMA_VERSION = 2


def _build_recommendation(content: dict) -> str:
    """A single readable paragraph, kept for API clients that want plain text."""
    parts = [content.get("summary", "")]
    if content.get("immediate_actions"):
        parts.append(" ".join(content["immediate_actions"]))
    if content.get("expert_note"):
        parts.append(content["expert_note"])
    return "\n\n".join(p for p in parts if p)


def _entries():
    """Every (crop, key) entry to seed, including the per-crop healthy rows."""
    for (crop, key), value in DISEASES.items():
        yield crop, key, value

    for crop in HEALTHY_CROPS:
        yield crop, "healthy", {
            "name": f"Healthy {crop.capitalize()}",
            "severity": SEVERITY_NONE,
            "en": HEALTHY_CONTENT["en"],
            "ta": HEALTHY_CONTENT["ta"],
        }


def seed(db: Session) -> None:
    """Rebuild the reference tables from treatment_data.py.

    Reference data only — crop_reports and predictions are never touched.
    """
    # Rebuilding rather than upserting keeps the database honest: an entry
    # deleted from treatment_data.py disappears here too.
    db.query(Treatment).delete()
    db.query(Disease).delete()
    db.flush()

    for crop, key, value in _entries():
        disease = Disease(
            key=key,
            crop=crop,
            name=value["name"],
            description=value["en"].get("summary"),
            severity=value["severity"],
        )
        db.add(disease)
        db.flush()  # assign an id the treatments can reference

        for language in ("en", "ta"):
            content = value[language]
            db.add(
                Treatment(
                    disease_id=disease.id,
                    language=language,
                    summary=content.get("summary"),
                    symptoms=content.get("symptoms"),
                    cause=content.get("cause") or None,
                    immediate_actions=json.dumps(
                        content.get("immediate_actions", []), ensure_ascii=False
                    ),
                    prevention=json.dumps(
                        content.get("prevention", []), ensure_ascii=False
                    ),
                    expert_note=content.get("expert_note"),
                    recommendation=_build_recommendation(content),
                    source=EXTENSION_SOURCE,
                )
            )

    db.commit()


# Columns added to already-existing tables that hold real data, so they cannot
# simply be dropped and rebuilt. SQLite and PostgreSQL both support a plain
# additive ALTER TABLE, which is all we need.
_ADDITIVE_COLUMNS = {
    "predictions": {
        "alternatives": "TEXT",
        "crop_supported": "BOOLEAN DEFAULT 1",
    },
}


def _add_missing_columns() -> None:
    """Apply purely additive column changes to tables holding live data.

    This is a deliberately tiny stand-in for Alembic. It only ever ADDs nullable
    columns, so it cannot destroy data — but it is not a substitute for real
    migrations once the schema starts changing in earnest.
    """
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table, columns in _ADDITIVE_COLUMNS.items():
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, ddl in columns.items():
                if name not in existing:
                    connection.execute(
                        text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")
                    )


def ensure_schema() -> None:
    """Create tables, and rebuild the reference tables if their shape is stale.

    Without a migration tool, `create_all` will not add a new column to a table
    that already exists. Since the reference tables are disposable, the safe fix
    is to drop just those two and let create_all rebuild them.
    """
    inspector = inspect(engine)
    if inspector.has_table("treatments"):
        columns = {c["name"] for c in inspector.get_columns("treatments")}
        expected = {"summary", "symptoms", "cause", "immediate_actions", "prevention"}
        if not expected.issubset(columns):
            # Old-shape reference tables: drop them, keeping all report data.
            Treatment.__table__.drop(engine, checkfirst=True)
            Disease.__table__.drop(engine, checkfirst=True)

    Base.metadata.create_all(bind=engine)
    _add_missing_columns()


def main() -> None:
    """Entry point: `python -m app.database.seed`"""
    ensure_schema()
    db = SessionLocal()
    try:
        seed(db)
        print(
            f"Seeded {db.query(Disease).count()} diseases and "
            f"{db.query(Treatment).count()} treatments."
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
