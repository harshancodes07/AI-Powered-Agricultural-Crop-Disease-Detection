"""Generate realistic demo reports so the dashboard is not empty during a demo.

This talks to the running API exactly as the frontend does — it is not a
database backdoor, so whatever you see is a genuine end-to-end result.

Usage (backend and ML service must be running):
    python scripts_demo_data.py            # 40 reports
    python scripts_demo_data.py 100
"""

import io
import random
import sys
import uuid

import httpx
from PIL import Image

API = "http://localhost:8000"

# Clusters around real Tamil Nadu districts, so the map and the hotspot logic
# have something meaningful to show.
DISTRICTS = [
    ("Coimbatore", 11.0168, 76.9558),
    ("Madurai", 9.9252, 78.1198),
    ("Thanjavur", 10.7870, 79.1378),
    ("Erode", 11.3410, 77.7172),
    ("Salem", 11.6643, 78.1460),
    ("Tiruchirappalli", 10.7905, 78.7047),
]
CROPS = ["tomato", "potato", "corn", "rice"]


def random_leaf_image() -> bytes:
    """A small synthetic 'leaf' image. Content varies so predictions vary."""
    img = Image.new(
        "RGB",
        (224, 224),
        (random.randint(20, 90), random.randint(80, 160), random.randint(20, 70)),
    )
    # A few random blotches, so each image hashes differently.
    pixels = img.load()
    for _ in range(random.randint(50, 400)):
        x, y = random.randrange(224), random.randrange(224)
        pixels[x, y] = (random.randint(90, 180), random.randint(60, 120), 40)

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    return buffer.getvalue()


def main() -> None:
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 40

    created = 0
    with httpx.Client(timeout=30.0) as client:
        try:
            client.get(f"{API}/api/health").raise_for_status()
        except httpx.HTTPError:
            print(f"Backend is not reachable at {API}. Start it first.")
            sys.exit(1)

        for _ in range(count):
            district, base_lat, base_lon = random.choice(DISTRICTS)
            # Scatter within roughly 4 km of the district centre. Kept tight on
            # purpose so reports genuinely cluster and the hotspot detection on
            # the dashboard has something real to find.
            lat = base_lat + random.uniform(-0.04, 0.04)
            lon = base_lon + random.uniform(-0.04, 0.04)

            response = client.post(
                f"{API}/api/reports",
                files={"file": ("leaf.jpg", random_leaf_image(), "image/jpeg")},
                data={
                    "crop_type": random.choice(CROPS),
                    "language": random.choice(["en", "ta"]),
                    "latitude": str(lat),
                    "longitude": str(lon),
                    "region": district,
                    "client_uuid": f"demo-{uuid.uuid4().hex[:16]}",
                },
            )
            if response.status_code == 201:
                created += 1
            else:
                print(f"  failed: {response.status_code} {response.text[:120]}")

    print(f"Created {created} demo reports.")
    summary = httpx.get(f"{API}/api/dashboard/summary").json()
    print("Dashboard summary now:", summary)


if __name__ == "__main__":
    main()
