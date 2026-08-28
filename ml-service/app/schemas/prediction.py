"""Request/response contract for the ML microservice.

This contract is the boundary between the backend and the model. The mock
predictor and a future real PyTorch model must both satisfy it, so swapping in
the trained model requires no backend changes.
"""

from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    crop: str = Field(..., description="Crop the model believes it is looking at")
    disease: str = Field(
        ...,
        description="Machine-readable disease id, e.g. 'early_blight'. "
        "'healthy' means no problem detected.",
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Model confidence, 0.0-1.0"
    )
    model_version: str = Field(..., description="Which model produced this result")

    model_config = {
        # 'model_' is a protected prefix in Pydantic v2; we use it deliberately
        # because it reads better in the API, so silence the warning.
        "protected_namespaces": (),
        "json_schema_extra": {
            "example": {
                "crop": "tomato",
                "disease": "early_blight",
                "confidence": 0.94,
                "model_version": "mock-v1",
            }
        },
    }


class HealthResponse(BaseModel):
    status: str
    model_version: str

    model_config = {"protected_namespaces": ()}
