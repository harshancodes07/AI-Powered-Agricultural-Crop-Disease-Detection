"""Mock crop-disease predictor.

Why this exists: the rest of the platform must not be blocked waiting for a
trained model. This module produces predictions with exactly the shape the real
model will produce.

The prediction is DETERMINISTIC — derived from a hash of the image bytes — so
the same photo always yields the same answer. That matters for demos and for
tests: you can re-run a walkthrough and get a stable result.

To swap in a real model later, replace `predict()` with one that runs the
PyTorch forward pass. Nothing else in the codebase changes.
"""

import hashlib

MODEL_VERSION = "mock-v1"

# The classes this mock "supports". These intentionally mirror the diseases
# that have verified treatment entries in the backend's treatment database, so
# every prediction can be resolved to a real recommendation.
SUPPORTED_CLASSES: list[tuple[str, str]] = [
    ("tomato", "early_blight"),
    ("tomato", "late_blight"),
    ("tomato", "leaf_mold"),
    ("tomato", "healthy"),
    ("potato", "early_blight"),
    ("potato", "late_blight"),
    ("potato", "healthy"),
    ("corn", "common_rust"),
    ("corn", "northern_leaf_blight"),
    ("corn", "healthy"),
    ("rice", "leaf_blast"),
    ("rice", "bacterial_leaf_blight"),
    ("rice", "healthy"),
]


def predict(image_bytes: bytes, crop_hint: str | None = None) -> dict:
    """Return a deterministic pseudo-prediction for the given image.

    crop_hint: if the farmer told us which crop this is, we narrow the choice to
    that crop's classes. A real model would use this the same way (or ignore it).
    """
    digest = hashlib.sha256(image_bytes).digest()

    candidates = SUPPORTED_CLASSES
    if crop_hint:
        narrowed = [c for c in SUPPORTED_CLASSES if c[0] == crop_hint.lower().strip()]
        if narrowed:
            candidates = narrowed

    crop, disease = candidates[digest[0] % len(candidates)]

    # Spread confidence over a believable 0.72-0.96 band.
    confidence = 0.72 + (digest[1] / 255.0) * 0.24

    return {
        "crop": crop,
        "disease": disease,
        "confidence": round(confidence, 4),
        "model_version": MODEL_VERSION,
    }
