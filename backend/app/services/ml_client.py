"""The only place that talks to the ML microservice.

Keeping it in one module means swapping the mock model for the real one, or
moving the service to another host, is a single configuration change.
"""

import httpx

from app.core.config import settings

TIMEOUT = httpx.Timeout(30.0, connect=5.0)


class MLServiceError(Exception):
    """Raised when the ML service is unreachable or returns a bad response.

    The caller must still keep the farmer's report — a model outage is never a
    reason to lose captured data.
    """


async def predict(image_bytes: bytes, filename: str, crop: str | None) -> dict:
    files = {"file": (filename, image_bytes, "application/octet-stream")}
    data = {"crop": crop} if crop else {}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(
                f"{settings.ML_SERVICE_URL}/predict", files=files, data=data
            )
    except httpx.RequestError as exc:
        raise MLServiceError(
            f"Could not reach the ML service at {settings.ML_SERVICE_URL}: {exc}"
        ) from exc

    if response.status_code == 422:
        raise MLServiceError("The ML service could not read that image.")
    if response.status_code >= 400:
        raise MLServiceError(
            f"ML service returned {response.status_code}: {response.text[:200]}"
        )

    return response.json()


async def health() -> dict:
    """Used by the backend's own /api/health so the UI can warn when AI is down."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            response = await client.get(f"{settings.ML_SERVICE_URL}/health")
            response.raise_for_status()
            return response.json()
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        raise MLServiceError(str(exc)) from exc
