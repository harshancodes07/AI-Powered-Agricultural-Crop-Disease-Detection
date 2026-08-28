"""Maps the pretrained model's label set onto this platform's (crop, disease) keys.

The model is trained on the PlantVillage dataset and emits human-readable labels
like "Tomato with Late Blight". The rest of the platform speaks in machine keys
like ("tomato", "late_blight"), which is what the treatment database is keyed on.

Anything the model can predict but we have no treatment for still maps to a
correct (crop, disease) pair — the backend then reports honestly that no
verified recommendation exists, rather than silently showing the wrong advice.
"""

# PlantVillage label -> (crop, disease_key)
LABEL_MAP: dict[str, tuple[str, str]] = {
    # --- Tomato ---
    "Tomato with Early Blight": ("tomato", "early_blight"),
    "Tomato with Late Blight": ("tomato", "late_blight"),
    "Tomato with Leaf Mold": ("tomato", "leaf_mold"),
    "Tomato with Bacterial Spot": ("tomato", "bacterial_spot"),
    "Tomato with Septoria Leaf Spot": ("tomato", "septoria_leaf_spot"),
    "Tomato with Spider Mites or Two-spotted Spider Mite": ("tomato", "spider_mites"),
    "Tomato with Target Spot": ("tomato", "target_spot"),
    "Tomato Yellow Leaf Curl Virus": ("tomato", "yellow_leaf_curl_virus"),
    "Tomato Mosaic Virus": ("tomato", "mosaic_virus"),
    "Healthy Tomato Plant": ("tomato", "healthy"),
    # --- Potato ---
    "Potato with Early Blight": ("potato", "early_blight"),
    "Potato with Late Blight": ("potato", "late_blight"),
    "Healthy Potato Plant": ("potato", "healthy"),
    # --- Maize / corn ---
    "Corn (Maize) with Common Rust": ("corn", "common_rust"),
    "Corn (Maize) with Northern Leaf Blight": ("corn", "northern_leaf_blight"),
    "Corn (Maize) with Cercospora and Gray Leaf Spot": ("corn", "gray_leaf_spot"),
    "Healthy Corn (Maize) Plant": ("corn", "healthy"),
    # --- Other crops the model knows, kept so its output is never mislabelled ---
    "Apple Scab": ("apple", "scab"),
    "Apple with Black Rot": ("apple", "black_rot"),
    "Cedar Apple Rust": ("apple", "cedar_rust"),
    "Healthy Apple": ("apple", "healthy"),
    "Healthy Blueberry Plant": ("blueberry", "healthy"),
    "Cherry with Powdery Mildew": ("cherry", "powdery_mildew"),
    "Healthy Cherry Plant": ("cherry", "healthy"),
    "Grape with Black Rot": ("grape", "black_rot"),
    "Grape with Esca (Black Measles)": ("grape", "esca"),
    "Grape with Isariopsis Leaf Spot": ("grape", "leaf_spot"),
    "Healthy Grape Plant": ("grape", "healthy"),
    "Orange with Citrus Greening": ("orange", "citrus_greening"),
    "Peach with Bacterial Spot": ("peach", "bacterial_spot"),
    "Healthy Peach Plant": ("peach", "healthy"),
    "Bell Pepper with Bacterial Spot": ("pepper", "bacterial_spot"),
    "Healthy Bell Pepper Plant": ("pepper", "healthy"),
    "Healthy Raspberry Plant": ("raspberry", "healthy"),
    "Healthy Soybean Plant": ("soybean", "healthy"),
    "Squash with Powdery Mildew": ("squash", "powdery_mildew"),
    "Strawberry with Leaf Scorch": ("strawberry", "leaf_scorch"),
    "Healthy Strawberry Plant": ("strawberry", "healthy"),
}

# Crops the farmer can choose in the app.
APP_CROPS = ["tomato", "potato", "corn", "rice"]

# Crops the model was actually trained on. Rice is NOT among them — the app must
# say so rather than guessing, which would be worse than no answer.
SUPPORTED_CROPS = sorted({crop for crop, _ in LABEL_MAP.values()})
UNSUPPORTED_APP_CROPS = [c for c in APP_CROPS if c not in SUPPORTED_CROPS]


def to_keys(label: str) -> tuple[str, str]:
    """Convert a model label to (crop, disease_key), degrading gracefully."""
    if label in LABEL_MAP:
        return LABEL_MAP[label]
    # Unknown label: derive something sane rather than crashing.
    slug = label.lower().replace("(", "").replace(")", "").replace(" ", "_")
    return ("unknown", slug)
