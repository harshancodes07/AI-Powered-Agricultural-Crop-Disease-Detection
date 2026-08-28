# The prediction model

## What is running

The service tries to load a **real image-classification model** and falls back to
a deterministic mock only if that fails. `GET /health` always tells you which one
is answering:

```json
{ "status": "ok", "engine": "real", "model_version": "plantvillage-mobilenetv2-v1" }
```

`engine` is `"real"` or `"mock"`. A mock result can never be mistaken for a real
one, because the engine and the model version travel with every prediction.

## The real model

| | |
|---|---|
| Model | `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification` |
| Architecture | MobileNetV2, fine-tuned for image classification |
| Training data | PlantVillage (38 classes of leaf images) |
| Size | ~14 MB — runs on a CPU, no GPU needed |
| Cost | Free. Downloaded once from Hugging Face, then cached locally |

MobileNetV2 was chosen over a larger ViT deliberately: it is small enough to load
in seconds and predict on a laptop CPU, which matters far more here than the last
few points of accuracy.

## What it can and cannot do

**Crops it was trained on:** tomato, potato, maize, apple, grape, orange, peach,
bell pepper, cherry, strawberry, squash, blueberry, raspberry, soybean.

**Crops the app offers that the model does NOT cover:** rice.

When a farmer selects rice, the API returns `crop_supported: false` and the
interface says plainly that the model cannot diagnose that crop, rather than
returning a confident-sounding guess. This is the single most important honesty
property of the service.

## How the crop hint is used

The farmer tells us the crop before uploading. The predictor restricts the
model's output to that crop's classes and renormalises the probabilities. This
removes an entire class of absurd errors — a tomato leaf can no longer come back
as "Apple Scab" — and makes the reported confidence answer the question the
farmer actually asked: *which tomato disease is this?*

## Alternatives

Every prediction carries up to three runner-up diagnoses above 1% confidence.
Early blight and late blight genuinely look alike on a phone photo, and a single
confident answer hides that. Showing the alternatives lets the interface present
the result as evidence to check rather than a verdict to obey.

## Important limitations

- **PlantVillage images are mostly single leaves on a plain background.**
  Accuracy on a cluttered field photograph is meaningfully lower than the
  benchmark figures for this dataset suggest. Treat field photos with caution.
- The model identifies **visual patterns**, not causes. Nutrient deficiency,
  herbicide damage and drought stress can all mimic disease.
- It cannot detect anything outside its 38 classes, and will always return
  *something* from that list.
- It has no notion of severity or how far a disease has progressed.

This is why the interface always shows the confidence, the alternatives, an
explicit uncertainty note, and a prompt to confirm with an agricultural expert
before spending money on treatment.

## Forcing the mock

For fast offline testing, or if the download is unavailable:

```bash
USE_MOCK_MODEL=1 uvicorn app.main:app --port 8001
```

## Replacing the model

Swap the body of `predict()` in `app/inference/real_predictor.py`. As long as it
returns the same contract — `crop`, `disease`, `confidence`, `model_version`,
`alternatives`, `crop_supported` — nothing else in the platform changes. If you
train your own model on Indian field conditions (including rice), that is the
single highest-value improvement available to this project.
