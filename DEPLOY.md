# Deployment: frontend on Vercel, backend on your machine

The frontend is deployed to Vercel and calls the backend running on this
laptop through an HTTPS tunnel. This is a **demo deployment**, not a
production one — read the caveats below before sharing the link widely.

**Live URL:** https://agri-ai-platform-coral.vercel.app

## Why not deploy the whole stack to Vercel

Vercel is a serverless/edge platform: no persistent disk, and strict
function size/time limits. This project has three services — the backend,
a separate PyTorch ML service (~200 MB of dependencies, ~13s model load
time), and a SQLite database with local file storage for uploaded images.
None of that survives a serverless cold start. Only the static frontend
belongs on Vercel; the backend and ML service need a host that keeps a
real, persistent process running (see "Going further" below).

## How this setup works

```text
Browser
   │  HTTPS
   ▼
agri-ai-platform-coral.vercel.app   (frontend, static, always up)
   │  HTTPS (VITE_API_URL, baked in at build time)
   ▼
<tunnel>.trycloudflare.com          (Cloudflare quick tunnel)
   │
   ▼
localhost:8000                      (backend, on this machine)
   │
   ▼
localhost:8001                      (ML service, on this machine)
```

The tunnel exists because modern Chrome blocks a public HTTPS page from
calling a plain `http://localhost` endpoint directly (Private Network
Access) — this isn't a CORS setting, it's a browser-level block with no
workaround short of serving the backend over real HTTPS. A free Cloudflare
quick tunnel is the simplest way to get that HTTPS without deploying the
backend anywhere.

## What this means in practice

- **The deployed site only works while this laptop is on**, with the
  backend, ML service, and the `cloudflared` tunnel all running.
- **The tunnel URL is not stable.** A quick tunnel (no Cloudflare account)
  gets a new random `trycloudflare.com` subdomain every time it restarts.
  If you restart `cloudflared`, you must update `VITE_API_URL` on Vercel
  and redeploy (see below) — the old tunnel URL will 404.
- **CORS is already configured** to accept both `*.vercel.app` and your
  local dev origins (`backend/app/main.py`), so nothing there needs to
  change when the tunnel URL changes — only the Vercel env var does.

## Starting it up

```bash
# 1. ML service
cd ml-service && ./.venv/bin/uvicorn app.main:app --port 8001

# 2. Backend
cd backend && ./.venv/bin/uvicorn app.main:app --port 8000

# 3. Tunnel (prints an https://*.trycloudflare.com URL)
cloudflared tunnel --url http://localhost:8000
```

If the tunnel URL is new (first run, or after a restart):

```bash
cd frontend
vercel env rm VITE_API_URL production --yes
printf "https://<your-new-tunnel-url>" | vercel env add VITE_API_URL production
vercel --prod --yes    # env vars are baked in at build time — this is required
```

## Going further: hosting the backend properly

To get a link that works for anyone, at any time, without your laptop
staying on:

- **Backend + ML service:** a host with a persistent process and enough
  memory for PyTorch — [Render](https://render.com) or
  [Fly.io](https://fly.io) both have free tiers suited to this.
- **Database:** swap SQLite for a hosted Postgres — [Neon](https://neon.tech)
  or [Supabase](https://supabase.com), both free tier, both drop-in via
  `DATABASE_URL` (the app already supports PostgreSQL, see the main
  README). Also solves the persistent-disk problem SQLite has once the
  backend itself isn't tied to one long-running machine.
- **Image storage:** local disk stops working once the backend can be
  killed/redeployed — object storage (Cloudflare R2 or an S3-compatible
  free tier) would replace `backend/app/storage/images.py`.

None of this is set up yet — it's a real re-architecture, not a config
change, and per this project's cost policy (see the main `CLAUDE.md`)
should only be done deliberately, not as a silent side effect of a deploy.
