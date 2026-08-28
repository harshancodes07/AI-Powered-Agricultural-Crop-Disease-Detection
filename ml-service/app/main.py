"""ML microservice.

Runs separately from the backend (port 8001) so the model can be scaled,
restarted or replaced without touching the API server.

Run it with:
    uvicorn app.main:app --reload --port 8001
"""

import io

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.inference import engine
from app.inference.labels import SUPPORTED_CROPS, UNSUPPORTED_APP_CROPS
from app.schemas.prediction import HealthResponse, PredictionResponse

# Refuse anything larger than this, so a bad upload cannot exhaust memory.
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB

app = FastAPI(
    title="Crop Disease ML Service",
    description=(
        "Predicts crop diseases from leaf images using a MobileNetV2 model "
        "fine-tuned on the PlantVillage dataset. Falls back to a deterministic "
        "mock if the model cannot be loaded — always check /health to see which "
        "engine is actually answering."
    ),
    version="2.0.0",
)


@app.on_event("startup")
def startup() -> None:
    # Load the model now, so the first farmer request does not pay for it.
    engine.initialise()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness probe, and which engine is actually answering right now."""
    return HealthResponse(
        status="ok",
        model_version=engine.model_version(),
        engine=engine.engine_name(),
        model_error=engine.load_error(),
    )


@app.get("/classes")
def classes() -> dict:
    """What this model can actually recognise.

    Exposed deliberately: the model is not an authority on every crop disease,
    and callers should be able to see its limits.
    """
    return {
        "model_version": engine.model_version(),
        "engine": engine.engine_name(),
        "supported_crops": SUPPORTED_CROPS,
        "unsupported_app_crops": UNSUPPORTED_APP_CROPS,
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

    return PredictionResponse(**engine.predict(contents, crop_hint=crop))
