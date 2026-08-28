"""Local-filesystem image storage.

The database stores a reference (a URL path), never the image bytes. Swapping
this for MinIO or S3 later means changing only this module.
"""

import io
import uuid
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from app.core.config import settings

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


class InvalidImageError(Exception):
    pass


def validate(image_bytes: bytes) -> str:
    """Confirm the bytes really are a supported image; return its format.

    We check the decoded content rather than trusting the filename or the
    client-declared content type.
    """
    if not image_bytes:
        raise InvalidImageError("The uploaded file is empty.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise InvalidImageError(
            f"Image is larger than {MAX_IMAGE_BYTES // (1024 * 1024)} MB."
        )
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise InvalidImageError("The uploaded file is not a readable image.") from exc

    if img.format not in ALLOWED_FORMATS:
        raise InvalidImageError(
            f"Unsupported image format '{img.format}'. Use JPEG, PNG or WebP."
        )
    return img.format


def save(image_bytes: bytes, image_format: str) -> str:
    """Write the image under a random name and return its public URL path.

    A generated UUID name means a malicious or odd client filename can never
    influence where the file lands.
    """
    extension = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}[image_format]
    name = f"{uuid.uuid4().hex}.{extension}"

    directory: Path = settings.storage_dir
    directory.mkdir(parents=True, exist_ok=True)
    (directory / name).write_bytes(image_bytes)

    # Served by the backend's static mount in app/main.py
    return f"/uploads/{name}"
