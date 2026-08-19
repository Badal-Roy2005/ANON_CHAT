# CONTEXT.md — Project Context Snapshot

## What this project is
A hyperlocal, anonymous, temporary text-chat web app. Users are automatically grouped into a chat "room" based on their real-time GPS location (via geohashing), so only people currently within a defined physical radius can talk to each other. No accounts, no permanent history — sessions and messages are ephemeral.

## Why it exists (decision history)
- Considered Bluetooth/P2P mesh for "nearby people" chat — **rejected** because: limited range (~10–100m), iOS background BLE restrictions, high battery drain on scanning, no scalability path, and no central point for spam/abuse moderation.
- Chose **network-based + geohashing** instead: same "people nearby" effect, but reliable, scalable, works in background, and allows server-side abuse prevention.
- Chose **Next.js on Vercel** for frontend because Vercel serverless functions cannot hold persistent WebSocket connections — so real-time logic is split into a **separate always-on Node.js + Socket.io server** hosted on Render's free tier, kept awake via UptimeRobot pings to a `/health` endpoint.
- Chose **Redis (Upstash free tier)** over a traditional database because the product is explicitly ephemeral — TTL-based expiry is a natural fit and avoids paying for/maintaining a persistent DB.
- Deliberately **no accounts, no login** — anonymous UUID session generated client-side and stored in `sessionStorage` (dies when tab closes), aligned with the privacy-first requirement.

## Current architecture (high level)
```
Browser (Next.js frontend on Vercel)
   |
   |-- Geolocation API --> geohash (ngeohash)
   |
   |-- socket.io-client -----------------> Node.js + Express + Socket.io server (Render, free tier)
                                                   |
                                                   |-- Redis (Upstash) for:
                                                   |     - room membership (geohash -> socket IDs)
                                                   |     - message buffer with TTL
                                                   |     - rate-limit counters
                                                   |
                                           UptimeRobot pings /health every 5 min to prevent Render sleep
```

## Key constraints to always remember
- Render free tier: 750 hrs/month cap, sleeps after ~15 min idle without pinging.
- Upstash free tier: request/storage limits — do not add heavy persistent data patterns.
- No PII stored anywhere. Location is used transiently to compute a geohash and is not stored raw.
- Text-only chat in v1. No media uploads.

## Where to find more detail
- Product requirements → `prd.md`
- Fixed technology choices and rationale → `techstack.md`
- Visual/UX direction → `design.md`
- Security rules → `security.md`
- Agent behavior rules → `agent.md`
- Build sequence/prompts → `prompts.md`

## Status
Documentation/planning phase — no code written yet. This file should be updated as major architecture decisions are made or changed, so any agent or contributor picking up the project later has accurate context without re-deriving decisions.