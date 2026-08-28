# Demo script

The exact click-path to demonstrate the complete system. Budget about 6 minutes.

---

## Before you start

Three terminals:

```bash
# 1
cd ml-service && ./.venv/bin/uvicorn app.main:app --port 8001

# 2
cd backend && ./.venv/bin/uvicorn app.main:app --port 8000

# 3
cd frontend && npm run dev
```

Then load demo data so the dashboard is not empty:

```bash
cd backend && ./.venv/bin/python scripts_demo_data.py 60
```

Confirm everything is healthy:

```bash
curl localhost:8000/api/health
```

Expect `"status":"ok"` and `"ml_service":{"available":true,...}`.

Have one real crop-leaf photo saved on the machine (or use a phone).

---

## Part 1 — The farmer flow (2 min)

1. Open <http://localhost:5173>. You land on the farmer home screen.
2. **Switch the language to தமிழ்** using the toggle in the header.
   *Point out: the entire interface changes, including the navigation.* Switch back to
   English if it is easier to narrate, or stay in Tamil to make the point.
3. Tap **Take a photo of my crop**.
4. Tap **Take photo**.
   - *On a laptop*, a live viewfinder opens using the built-in webcam. Point it at a leaf
     (or a photo of one on your phone screen) and press **Capture photo**.
   - *On a phone*, this opens the camera app directly.
   - **Choose from gallery** is always available if you would rather use a saved photo —
     useful if the room is dark or you want a guaranteed-good demo image.
5. Choose the crop, e.g. **Tomato**.
6. Tap **Share my location** and allow the browser prompt.
   *Point out: location is only ever requested on an explicit tap, and the report works
   fine without it.*
7. Tap **Get diagnosis**.

On the result screen, highlight:

- The predicted problem, **the confidence percentage, and the model version**
- The uncertainty note: *"This is an AI prediction, not a confirmed diagnosis."*
- The treatment recommendation **in the selected language**
- The **Source** line — and say plainly that these recommendations come from a
  structured database, not from a generative model inventing pesticide advice

---

## Part 2 — Offline capture and automatic sync (2 min)

This is the part worth rehearsing.

1. Open DevTools (`F12`) → **Network** tab → set throttling to **Offline**.
2. Notice the dark banner appear at the top: *"You are offline. Reports will be saved on
   this device."*
3. Go to **New report** and capture a report exactly as before. The button now reads
   **Save report (offline)**.
4. Submit. You are taken to **My reports**, where the report sits with a
   **⏳ Waiting to send** badge.
5. Repeat once more so there are two queued reports. The banner shows the pending count.
6. **Set the Network throttling back to Online.**
7. Within a second or two, both badges flip to **✓ Sent** on their own — no button press.
   *Point out: the `online` event triggers the queue drain automatically.*

To show that sync is safe to retry: press **Send now** again. Nothing duplicates, because
each report carries a device-generated UUID that the backend deduplicates on.

> If you want to prove that at the API level:
> ```bash
> curl -s localhost:8000/api/reports?limit=200 | python3 -c "import json,sys;print(len(json.load(sys.stdin)))"
> ```
> Run it before and after a repeat sync — the count is unchanged.

---

## Part 3 — The government dashboard (2 min)

1. From the farmer home screen tap **Government dashboard** (or go to
   <http://localhost:5173/dashboard>).
2. **Overview tab.** Walk through the KPIs: total reports, affected areas, most common
   problem, high-risk areas. *Point out: "high-risk areas" are localities where three or
   more reports of the same disease cluster together — that is the outbreak signal.*
3. **Map tab.** Show the OpenStreetMap view with clustered markers around the Tamil Nadu
   districts. Zoom in so a cluster splits into individual markers. Click one to open its
   popup.
   *Point out two things:* this is Leaflet + OpenStreetMap, requiring **no API key and no
   billing account**; and the popup shows crop, disease, confidence and district —
   **no farmer name, email or contact detail anywhere.**
4. **Reports tab.** The same data as a table.
5. Use the **filters** — pick a crop or a disease — and show the map, KPIs and table all
   responding.
6. **Analytics tab.** Disease frequency, crop distribution, and reports over the last 14
   days.
7. Switch the language to **தமிழ்** here too — the dashboard is fully translated as well.

---

## Part 4 — Show it is installable (optional, 30 s)

In Chrome, the address bar shows an install icon. Install it and open it — it runs
standalone, without browser chrome, like a native app.

---

## If something goes wrong

| Symptom | Fix |
|---|---|
| Result screen says analysis failed | The ML service is not running. Start it on port 8001. The report was still saved. |
| Dashboard is empty | Run `scripts_demo_data.py`. |
| Queued reports never sync | Check DevTools throttling really is back to **Online**, then press **Send now**. |
| Map tiles are blank | OpenStreetMap tiles need internet. Turn throttling off. |
| Viewfinder shows "permission declined" | Allow camera access for `localhost` in the browser's site settings, then reopen. |
| No viewfinder on a phone over Wi-Fi | Expected — plain http is not a secure context, so the phone uses its native camera app instead. |
| Port already in use | `lsof -ti:8000 \| xargs kill` (or 8001 / 5173). |

---

## The one-sentence summary

> A farmer photographs a diseased leaf on a cheap phone with no signal; the report queues
> on the device, syncs itself when the connection returns, is analysed by an AI model,
> answered with a verified treatment in Tamil, and appears within seconds as a disease
> hotspot on a government map — built entirely on free, open-source software.
