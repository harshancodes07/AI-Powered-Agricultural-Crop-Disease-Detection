"""Chooses which predictor backs the service.

Preference order:
  1. The real PlantVillage model, when torch/transformers are installed and the
     weights can be loaded.
  2. The deterministic mock, otherwise.

The fallback is deliberate. A missing model must degrade the *quality* of the
answer, never take the whole platform down mid-demo — but the active engine is
always reported through /health and in every prediction's `model_version`, so a
mock result can never be mistaken for a real one.

Set USE_MOCK_MODEL=1 to force the mock (useful for fast, offline testing).
"""

import logging
import os

from app.inference import mock_predictor

logger = logging.getLogger(__name__)

_engine = "mock"
_real = None
_load_error: str | None = None


def initialise() -> str:
    """Pick and warm up an engine. Returns the active engine name."""
    global _engine, _real, _load_error

    if os.getenv("USE_MOCK_MODEL", "").strip() in {"1", "true", "yes"}:
        logger.warning("USE_MOCK_MODEL is set — using the mock predictor.")
        _engine = "mock"
        return _engine

    try:
        from app.inference import real_predictor

        real_predictor.load()
        _real = real_predictor
        _engine = "real"
        logger.info("Using real model: %s", real_predictor.MODEL_VERSION)
    except Exception as exc:  # noqa: BLE001 — any failure must fall back safely
        _load_error = f"{type(exc).__name__}: {exc}"
        logger.warning("Real model unavailable (%s). Falling back to mock.", _load_error)
        _engine = "mock"

    return _engine


def engine_name() -> str:
    return _engine


def model_version() -> str:
    return _real.MODEL_VERSION if _engine == "real" else mock_predictor.MODEL_VERSION


def load_error() -> str | None:
    return _load_error


def predict(image_bytes: bytes, crop_hint: str | None = None) -> dict:
    if _engine == "real":
        return _real.predict(image_bytes, crop_hint=crop_hint)
    return mock_predictor.predict(image_bytes, crop_hint=crop_hint)
