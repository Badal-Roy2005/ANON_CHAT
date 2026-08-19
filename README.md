# Anon_Chat

A hyperlocal, anonymous, temporary text-chat web app. People within the same ~600m geohash cell can talk to each other in real time. No accounts, no permanent history — sessions and messages are ephemeral.

- **Frontend**: Next.js 14 (App Router) + TailwindCSS, hosted on **Vercel**
- **Backend**: Node.js + Express + Socket.io, hosted on **Render**
- **Data**: Upstash Redis (room membership, message buffers, rate-limit counters) — everything expires via TTL
- **Keep-alive**: UptimeRobot pings `/health` every 5 minutes to prevent Render free-tier sleep

## Project structure

```
frontend/   Next.js 14 App Router app (Vercel)
backend/    Express + Socket.io server (Render)
```

## Local development

### Prerequisites

- Node.js 18+ (LTS recommended)
- A free [Upstash Redis](https://upstash.com) database (optional for offline dev — the backend falls back to an in-memory store when `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are not set)

### 1. Backend

```bash
cd backend
cp .env.example .env      # then fill in real values
npm install
npm run dev               # starts on http://localhost:4000
```

Verify: `curl http://localhost:4000/health` → `{"status":"ok","uptime":...,"timestamp":...}`

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev               # starts on http://localhost:3000
```

Open `http://localhost:3000`, grant location, and you should be in your local chat cell.

## Environment variables

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | Backend Socket.io URL. Dev: `http://localhost:4000`. Production: `https://<your-backend>.onrender.com` |

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on. Render injects this automatically. |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `IP_HASH_SALT` | Random secret salt used to hash client IPs before any storage. Never expose it. |
| `CLIENT_ORIGIN` | Comma-separated allowed frontend origins, e.g. `http://localhost:3000,https://your-app.vercel.app` |

> Secrets must never be prefixed with `NEXT_PUBLIC_` or shipped to the client bundle.

## Deploying the backend to Render

1. Push this repo to GitHub.
2. In [Render](https://render.com), create a **New Web Service** and connect the repo.
3. Select the `backend` directory as the root directory.
4. Use the following settings (also defined in `backend/render.yaml`):
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Health Check Path**: `/health`
5. Add the environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `IP_HASH_SALT`
   - `CLIENT_ORIGIN` = `http://localhost:3000,https://<your-frontend>.vercel.app`
6. Deploy. Once live, confirm `https://<your-backend>.onrender.com/health` returns 200.

> Free-tier notes: Render web services sleep after ~15 minutes of inactivity and cap at 750 instance-hours/month. The UptimeRobot ping below keeps it warm.

## Deploying the frontend to Vercel

1. In [Vercel](https://vercel.com), import the same repo.
2. Set the **Root Directory** to `frontend`.
3. Add the environment variable:
   - `NEXT_PUBLIC_SOCKET_SERVER_URL` = `https://<your-backend>.onrender.com`
4. Deploy. Vercel automatically runs `next build` and serves the app over HTTPS.

The included `frontend/vercel.json` applies security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy).

## Keeping the backend awake (UptimeRobot)

1. Sign up at [UptimeRobot](https://uptimerobot.com) (free tier).
2. Add a new **HTTP(s)** monitor.
3. **URL**: `https://<your-backend>.onrender.com/health`
4. **Interval**: 5 minutes.
5. Save. The monitor pings `/health` every 5 minutes, which prevents the free-tier Render service from sleeping.

## Security model (summary)

- Raw GPS never leaves the client — only a 6-character geohash cell is transmitted.
- IPs are hashed (SHA-256 + `IP_HASH_SALT`) before any storage; raw IPs are never logged or persisted.
- Messages are sanitized (profanity-masked, HTML-escaped, 280-char cap) before broadcast.
- Rate limiting: 5 messages / 10s per session, 30 / min per hashed IP (`@upstash/ratelimit`).
- All Redis data expires via TTL (rooms: 1h, message buffers: 1h, capped at 50 per cell).
- CORS is locked to the origins in `CLIENT_ORIGIN` — no wildcard.

See `security.md` for the full specification.

## Verification

End-to-end sanity checks were run against a live local backend + frontend build:

- `GET /health` returns 200 with `{ status, uptime, timestamp }`.
- Socket clients connect, join primary geohash room + 8 neighbors, broadcast `new_message`, and receive `user_count_update`.
- Sending >5 messages in 10s emits `rate_limit_exceeded` without crashing the server.
- Clients auto-reconnect and re-join after a server restart.
- `next build` completes with zero lint, type, or build errors.
- Server shuts down cleanly on SIGTERM/SIGINT.# ANON_CHAT
