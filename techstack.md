# TECHSTACK.md — Fixed Technology Stack

This stack is **fixed** for the MVP. Do not swap components without updating this file and getting explicit approval (see `agent.md`).

## Frontend
- **Next.js 14+ (App Router)**
- **React 18**
- **TailwindCSS** — utility CSS, small bundle, good for low-end devices
- **socket.io-client** — connects directly to the real-time server (not through Next.js API routes)
- Hosting: **Vercel (Free/Hobby tier)**

## Real-time Server (separate from Next.js)
- **Node.js (LTS) + Express + Socket.io**
- Handles: WebSocket connections, geohash room join/leave, message broadcast, rate limiting, profanity filtering
- Hosting: **Render (Free tier, Web Service)**
  - Free tier caps: 750 instance-hours/month, spins down after ~15 min idle
  - Kept awake via **UptimeRobot** (free tier, 5-min interval HTTP ping) to a `/health` route

## Geolocation → Room Mapping
- **ngeohash** (npm) — encodes lat/lng into a geohash string
- Default precision: geohash-6 (~600m x 600m cell), configurable
- Client joins its own cell + 8 neighboring cells to avoid hard-boundary cutoffs

## Data / Session Store
- **Redis via Upstash (Free tier)**
- Used for:
  - Room membership sets (geohash → socket IDs), with expiry
  - Recent message buffers per room (capped length + TTL, e.g., 1–2 hours)
  - Rate-limit counters (`@upstash/ratelimit`)
- **No relational/NoSQL persistent database.** This is intentional — nothing should outlive its TTL.

## Auth / Identity
- **No accounts, no login.**
- Anonymous session UUID generated client-side (`crypto.randomUUID()`), stored in `sessionStorage` only (cleared when tab closes)
- Optional: server assigns a friendly display name (e.g., "Falcon-42") derived from the UUID, never shown to other users as the raw UUID

## Abuse & Spam Protection
- **@upstash/ratelimit** — per-session and per-IP-hash message rate limiting
- **bad-words** (npm) or custom regex list — server-side profanity/spam filtering before broadcast
- Auto-mute: track message frequency in Redis, temporarily block on flood
- IP addresses are **hashed** (e.g., SHA-256 + salt) before any storage — never stored raw

## Monitoring / Uptime
- **UptimeRobot (Free tier)** — keeps Render service warm, alerts on downtime

## Explicitly Rejected Alternatives (with reasons)
| Option | Why rejected |
|---|---|
| Bluetooth/BLE mesh | Short range, iOS background restrictions, high battery drain, no central abuse-prevention point, not scalable |
| Persistent SQL/NoSQL DB (Postgres/Mongo) | Conflicts with "temporary session" privacy goal; adds cost and complexity not needed for ephemeral chat |
| Firebase/Supabase real-time DB | Viable alternative, but adds vendor lock-in and a different pricing model than the chosen free-tier combo; not chosen for MVP to keep stack minimal and fully under our control |
| Native mobile app | Out of scope for v1 — web app must work well on mobile browsers instead |
| Vercel serverless functions for WebSockets | Not supported — serverless functions can't hold persistent connections, hence the separate Render service |

## Environment Variables (names only — never commit actual values)
- `NEXT_PUBLIC_SOCKET_SERVER_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `IP_HASH_SALT`
- `PORT` (Render-assigned)

## Deployment Summary
| Component | Where | Cost |
|---|---|---|
| Next.js frontend | Vercel | Free |
| Socket.io server | Render | Free |
| Redis | Upstash | Free |
| Uptime pinger | UptimeRobot | Free |
| **Total** | | **₹0** |