# AI-Powered Agricultural Crop Disease Detection & Geospatial Monitoring

A multilingual, offline-capable Progressive Web App that lets a farmer photograph a
diseased crop leaf, get an AI prediction with a **verified** treatment recommendation in
their own language, and have that report appear on a government monitoring dashboard as a
point on a map.

**Every part of this system is free and open source. No paid API, no cloud account, no
credit card is required to run it.**

---

## What it does

**For the farmer** (mobile-first PWA)

- Choose a language (English or Tamil) — remembered across visits
- Photograph an affected leaf straight from the phone camera
- Get a disease prediction from a real trained model, with its confidence, the
  runner-up diagnoses, and an honest uncertainty note
- Get verified treatment guidance in the chosen language, broken into what to
  look for, why it happened, what to do today, and how to prevent it returning
- Optionally share location — always asked for explicitly, never taken silently
- **Capture reports with no internet.** They queue on the device and sync automatically
  when the connection returns

**For government / agricultural officials** (dashboard)

- KPIs: total reports, affected areas, most common problem, high-risk areas
- Map of reports on OpenStreetMap with marker clustering and disease hotspots
- Filter by crop, disease and date range
- Analytics: disease frequency, crop distribution, reports over time
- **No farmer names, emails or contact details are ever exposed**

---

## Architecture

```text
                    ┌────────────────────────────┐
                    │        React PWA           │
                    │  Farmer app  +  Dashboard  │
                    └─────────────┬──────────────┘
                                  │  REST (JSON / multipart)
                    ┌─────────────▼──────────────┐
                    │      FastAPI backend       │  :8000
                    │  validation · storage ·    │
                    │  treatment lookup · sync   │
                    └──────┬──────────────┬──────┘
                           │              │
              ┌────────────▼───┐   ┌──────▼─────────────┐
              │  ML service    │   │ PostgreSQL+PostGIS │
              │  :8001         │   │ (or SQLite)        │
              │  mock → PyTorch│   └────────────────────┘
              └────────────────┘
                           │
                    ┌──────▼─────────┐
                    │ Local filesystem│  crop images
                    └────────────────┘
```

The ML service is deliberately a **separate process** with its own API contract, so the
mock model can be replaced by a real PyTorch model without touching the backend.

### The report pipeline

```text
image → validate → store file → create report row → call ML service
      → store prediction → look up VERIFIED treatment → localise → return
```

If the ML service is unreachable the report is still stored with status `FAILED`, and the
image stays on disk so it can be re-analysed. A captured report is never lost.

---

## Prerequisites

| Tool | Why | Required? |
|---|---|---|
| Python 3.11+ | backend and ML service | yes |
| Node.js 18+ | frontend | yes |
| Docker Desktop | PostgreSQL + PostGIS | optional — SQLite fallback works |

This project was developed on Python 3.14 and Node 24.

---

## Installation

```bash
git clone <your-repo-url>
cd agri-ai-platform
cp .env.example .env
```

### 1. ML service (port 8001)

```bash
cd ml-service
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn app.main:app --reload --port 8001
```

Check it: <http://localhost:8001/health> — the `engine` field says whether the
real model or the mock fallback is answering.

This installs PyTorch (~200 MB, free) and downloads a ~14 MB model on first run.
If you cannot do that, `pip install -r requirements-mock.txt` instead: the
service still runs and the API is identical, but predictions come from a
deterministic mock. See [ml-service/MODEL.md](ml-service/MODEL.md) for what the
model can and cannot do.

### 2. Backend (port 8000)

In a new terminal:

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn app.main:app --reload --port 8000
```

Tables and the treatment database are created automatically on first start.
Interactive API docs: <http://localhost:8000/docs>

### 3. Frontend (port 5173)

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` and `/uploads` to the backend, so there
is no API URL to configure.

To try it on a real phone, use the `Network:` address Vite prints — both devices must be
on the same Wi-Fi.

#### How the camera works

The app takes photos two different ways, chosen automatically:

- **Laptop / desktop** — a live viewfinder using `getUserMedia`, with a shutter button
  that grabs a frame and encodes it as a JPEG. Desktop browsers ignore the
  `capture` attribute on file inputs, so without this there would be no way to use a
  built-in webcam.
- **Phone, or any browser without `getUserMedia`** — falls back to
  `<input type="file" capture="environment">`, which hands off to the phone's own camera
  app.

`getUserMedia` requires a **secure context**. `http://localhost` counts as secure, so the
viewfinder works on the dev machine. A plain-http LAN address (`http://192.168.x.x:5173`)
does **not**, so a phone on the LAN automatically uses the file-input fallback — which is
the better experience on a phone anyway. Choosing an existing photo from files always
works everywhere.

### 4. Database

**SQLite (default, zero setup).** Nothing to do — a file `backend/agri.db` is created
automatically. Good enough for the full demo including the map.

**PostgreSQL + PostGIS (the intended setup).** Start Docker Desktop, then:

```bash
docker compose up -d
```

and in `.env` switch the active line to:

```text
DATABASE_URL=postgresql+psycopg://agri:agri@localhost:5432/agri
```

Restart the backend. On PostgreSQL each report additionally gets a real PostGIS
`POINT` geometry, enabling proper spatial queries. Everything else is identical — the
app detects which database it is on and adapts.

### 5. Demo data (optional but recommended)

With the backend and ML service running:

```bash
cd backend && ./.venv/bin/python scripts_demo_data.py 60
```

This posts 60 reports through the real API, clustered around six Tamil Nadu districts, so
the dashboard, the map clustering and the hotspot detection all have something to show.

---

## Environment variables

Set in `.env` (see `.env.example`). No secret has a real default committed.

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, or `sqlite:///./agri.db` |
| `ML_SERVICE_URL` | Where the backend finds the ML service |
| `STORAGE_PATH` | Directory for uploaded crop images |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `JWT_SECRET` | Reserved for authentication (not used in the MVP) |

---

## API

Full interactive documentation at <http://localhost:8000/docs>.

### Farmer

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/reports` | Upload an image, get prediction + treatment |
| `POST` | `/api/reports/sync` | Sync a batch of offline reports (idempotent) |
| `GET` | `/api/reports` | List reports |
| `GET` | `/api/reports/{id}` | One report with its prediction and treatment |

### Dashboard

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/dashboard/summary` | KPI figures |
| `GET` | `/api/dashboard/map` | Map points (no farmer identity) |
| `GET` | `/api/dashboard/diseases` | Disease frequency |
| `GET` | `/api/dashboard/trends` | Reports per day |
| `GET` | `/api/dashboard/crops` | Crop distribution |

### ML service

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + active model version |
| `GET` | `/classes` | What the model can actually recognise |
| `POST` | `/predict` | Image → `{crop, disease, confidence, model_version}` |

---

## How offline sync works

1. With no connection, a captured report is written to **IndexedDB** — image blob included
   — with a device-generated UUID and status `PENDING`.
2. The banner shows the offline state and how many reports are waiting.
3. When the browser fires `online` (or the user presses *Send now*), the queue is posted
   to `/api/reports/sync`.
4. The backend deduplicates on that UUID, so a sync interrupted halfway and retried
   **cannot create duplicate reports**.
5. Anything that fails goes back to `PENDING`, not silently dropped — it is retried later.

> **AI inference does not run offline.** The model lives on the server. Offline mode
> captures and queues reports; prediction happens when connectivity returns. The UI says
> this plainly rather than pretending otherwise.

---

## Treatment recommendations are not AI-generated

This is a deliberate safety decision. A generative model is **never** asked to invent
agricultural advice. Treatments come from a structured database (`backend/app/database/seed.py`),
keyed by disease and language.

The seeded entries are standard integrated-disease-management practices, written
**without specific pesticide products, dosages or application rates**, because those are
region-, crop- and regulation-specific. Each entry tells the farmer to confirm chemical
control with a local agricultural officer.

Each entry is structured rather than a single paragraph — symptoms to check, the
conditions that caused it, numbered actions for today, prevention for next season,
and when a human expert is genuinely needed. Every disease the model can predict for
a crop the app offers has a verified entry in both English and Tamil.

When no verified entry exists, the app says so:

> *No verified recommendation is currently available. Please consult a qualified
> agricultural expert.*

**Before any real-world use**, each row should be checked against your state agricultural
university or extension service, and the `source` field updated to cite the exact document.

---

## Accessibility

- Semantic HTML with real headings, `<fieldset>`/`<legend>` and labelled inputs
- Visible focus rings everywhere; a skip link to main content
- Touch targets at least 48 px tall
- Status shown by **icon + text**, never colour alone
- `role="status"` / `role="alert"` live regions for connection and error messages
- Larger base font size, high-contrast palette
- Fully keyboard navigable

---

## Running tests

There is no automated test suite in this MVP. Verify manually:

```bash
# ML service contract
curl localhost:8001/health
curl -F file=@some-leaf.jpg localhost:8001/predict
curl -F file=@README.md localhost:8001/predict     # expect 422

# Backend end to end
curl localhost:8000/api/health
curl -F file=@some-leaf.jpg -F crop_type=tomato -F language=ta localhost:8000/api/reports
```

See [`docs/DEMO.md`](docs/DEMO.md) for the full click-through, including the offline test.

---

## Known limitations

These are deliberate scope cuts for the MVP, not oversights:

- **The model is trained on PlantVillage, whose images are mostly single leaves on a
  plain background.** Accuracy on a cluttered field photograph is meaningfully lower
  than the benchmark numbers for that dataset suggest. This is why the interface always
  shows confidence, alternatives and an explicit "confirm with an expert" note.
- **Rice is not covered by the model.** The app accepts rice reports and stores them,
  but returns `crop_supported: false` and refuses to diagnose rather than guessing.
- **A mock predictor still exists as a fallback.** If PyTorch or the weights are
  unavailable the service keeps running on the mock, and says so in `/health` and in
  every `model_version`. A mock result can never be mistaken for a real one.
- **No authentication.** The dashboard is open. It is fine locally; **do not deploy this
  as-is.** `JWT_SECRET` is already wired for when auth is added.
- **No Alembic migrations.** Tables are created with `create_all()` on startup, which will
  not alter tables that already exist. Add Alembic before the schema changes in anger.
- **No automated tests.**
- Images are stored on the local filesystem. MinIO or S3 would slot in behind
  `backend/app/storage/images.py`.

---

## Project structure

```text
agri-ai-platform/
├── frontend/          React PWA (farmer app + dashboard)
│   └── src/
│       ├── pages/       Home, Capture, Result, History, Dashboard*
│       ├── components/  shared UI
│       ├── offline/     IndexedDB queue + sync engine
│       ├── i18n/        en.json, ta.json
│       └── services/    API client
├── backend/           FastAPI
│   └── app/
│       ├── api/routes/  reports, dashboard
│       ├── models/      SQLAlchemy tables
│       ├── services/    ML client, treatment lookup, report pipeline
│       ├── storage/     image storage
│       └── database/    session, seed data
├── ml-service/        Separate prediction service
├── database/          init.sql (enables PostGIS)
├── docs/              DEMO.md
└── docker-compose.yml PostgreSQL + PostGIS
```

---

## Licence and attribution

Map data © OpenStreetMap contributors.
