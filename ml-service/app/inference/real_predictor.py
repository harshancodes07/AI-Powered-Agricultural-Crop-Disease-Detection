"""Real crop-disease prediction using a pretrained PlantVillage model.

Model: linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
A MobileNetV2 fine-tuned on the PlantVillage dataset (38 classes covering
tomato, potato, maize, apple, grape and others). MobileNetV2 is deliberately
small, so it loads fast and runs on a CPU — no GPU and no paid inference API.

Two design decisions worth knowing:

1. **The crop hint narrows the search.** The farmer already told us which crop
   they photographed, so we restrict the model's output to that crop's classes
   and renormalise. This removes whole categories of embarrassing mistakes, such
   as calling a tomato leaf "Apple Scab".

2. **We return alternatives.** Early blight and late blight genuinely look
   similar, and a single confident-sounding answer hides that. Returning the
   runner-up diagnoses lets the farmer and the UI treat the result as evidence
   rather than a verdict.
"""

import io
import logging
import threading

import torch
from PIL import Image
from transformers import (
    AutoModelForImageClassification,
    MobileNetV2ImageProcessor,
)

from app.inference.labels import SUPPORTED_CROPS, to_keys

logger = logging.getLogger(__name__)

MODEL_ID = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
MODEL_VERSION = "plantvillage-mobilenetv2-v1"

# Loaded once, on first use, behind a lock so concurrent requests cannot race.
_model = None
_processor = None
_lock = threading.Lock()


def load() -> bool:
    """Load the model into memory. Returns True once it is usable.

    Called at startup so the first farmer request is not the one that pays the
    download cost.
    """
    global _model, _processor
    if _model is not None:
        return True

    with _lock:
        if _model is not None:
            return True
        logger.info("Loading model %s …", MODEL_ID)
        # The published repo declares the pre-5.x class name
        # "MobileNetV2FeatureExtractor", which AutoImageProcessor can no longer
        # resolve. The preprocessing itself is unchanged, so we name the current
        # class directly instead of relying on auto-detection.
        processor = MobileNetV2ImageProcessor.from_pretrained(MODEL_ID)
        model = AutoModelForImageClassification.from_pretrained(MODEL_ID)
        model.eval()  # inference only: disables dropout/batchnorm updates
        _processor, _model = processor, model
        logger.info("Model loaded: %d classes", model.config.num_labels)
        return True


def is_loaded() -> bool:
    return _model is not None


def _class_indices_for_crop(crop: str) -> list[int]:
    """Indices of the model's classes that belong to the given crop."""
    id2label = _model.config.id2label
    return [
        index
        for index, label in id2label.items()
        if to_keys(label)[0] == crop
    ]


def predict(image_bytes: bytes, crop_hint: str | None = None) -> dict:
    """Classify a leaf image.

    Returns the standard contract plus `alternatives` and `crop_supported`.
    """
    load()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = _processor(images=image, return_tensors="pt")

    with torch.no_grad():  # no gradients needed for inference; saves memory
        logits = _model(**inputs).logits[0]

    crop = (crop_hint or "").lower().strip()
    crop_supported = crop in SUPPORTED_CROPS if crop else True

    if crop and crop_supported:
        # Restrict to this crop's classes, then renormalise so the confidence
        # is "how sure among this crop's diseases", which is the question the
        # farmer actually asked.
        indices = _class_indices_for_crop(crop)
        subset = logits[indices]
        probabilities = torch.softmax(subset, dim=-1)
        ranked = sorted(
            zip(indices, probabilities.tolist()), key=lambda pair: pair[1], reverse=True
        )
    else:
        probabilities = torch.softmax(logits, dim=-1)
        ranked = sorted(
            enumerate(probabilities.tolist()), key=lambda pair: pair[1], reverse=True
        )

    id2label = _model.config.id2label
    top_index, top_confidence = ranked[0]
    top_crop, top_disease = to_keys(id2label[top_index])

    alternatives = [
        {
            "crop": to_keys(id2label[index])[0],
            "disease": to_keys(id2label[index])[1],
            "confidence": round(confidence, 4),
        }
        for index, confidence in ranked[1:4]
        if confidence >= 0.01  # not worth showing a 0.2% possibility
    ]

    return {
        "crop": top_crop,
        "disease": top_disease,
        "confidence": round(top_confidence, 4),
        "model_version": MODEL_VERSION,
        "alternatives": alternatives,
        "crop_supported": crop_supported,
    }
