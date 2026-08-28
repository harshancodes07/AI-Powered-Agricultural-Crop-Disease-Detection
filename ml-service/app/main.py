"""ML microservice.

Runs separately from the backend (port 8001) so the model can be scaled,
restarted or replaced without touching the API server.

Run it with:
    uvicorn app.main:app --reload --port 8001
"""

import io

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.inference.mock_predictor import MODEL_VERSION, SUPPORTED_CLASSES, predict
from app.schemas.prediction import HealthResponse, PredictionResponse

# Refuse anything larger than this, so a bad upload cannot exhaust memory.
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB

app = FastAPI(
    title="Crop Disease ML Service",
    description=(
        "Predicts crop diseases from leaf images. "
        "Currently backed by a deterministic mock model — see /health for the "
        "active model version."
    ),
    version="1.0.0",
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness probe. The backend uses this to report ML availability."""
    return HealthResponse(status="ok", model_version=MODEL_VERSION)


@app.get("/classes")
def classes() -> dict:
    """What this model can actually recognise.

    Exposed deliberately: the model is not an authority on every crop disease,
    and callers should be able to see its limits.
    """
    return {
        "model_version": MODEL_VERSION,
        "classes": [{"crop": c, "disease": d} for c, d in SUPPORTED_CLASSES],
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(
    file: UploadFile = File(..., description="Crop leaf image (JPEG/PNG/WebP)"),
    crop: str | None = Form(
        None, description="Optional crop hint from the farmer, e.g. 'tomato'"
    ),
) -> PredictionResponse:
    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image is larger than {MAX_IMAGE_BYTES // (1024 * 1024)} MB.",
        )

    # Verify it really is a decodable image rather than trusting the filename or
    # the client-supplied content type.
    try:
        Image.open(io.BytesIO(contents)).verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=422,
            detail="The uploaded file is not a readable image.",
        )

    return PredictionResponse(**predict(contents, crop_hint=crop))
