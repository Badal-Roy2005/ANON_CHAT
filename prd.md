# PRD.md — Hyperlocal Anonymous Chat

## 1. Problem Statement
People physically present in the same locality (a street, a market, a campus, a stadium, a queue) have no easy way to talk to each other digitally without exchanging contacts, adding on social media, or being in the same WhatsApp group beforehand. This product creates a temporary, anonymous, location-scoped chat room that anyone nearby can join instantly — and that disappears when they leave the area.

## 2. Goals
- Let anyone within a defined radius join a live text chat with zero signup.
- Keep the experience anonymous and temporary — no permanent identity, no permanent history.
- Run on ₹0 infrastructure using free tiers, while staying usable on low-end phones and slow (2G/3G) networks.
- Prevent spam/abuse without requiring accounts.

## 3. Non-Goals (explicitly out of scope for v1)
- No permanent user accounts, profiles, or login.
- No media sharing (images/video/voice) in v1 — text-only.
- No DMs/private 1:1 chat in v1 — only room-based public chat.
- No native mobile app — web app (mobile-responsive) only.
- No offline/Bluetooth mesh mode (evaluated and rejected — see techstack.md rationale).

## 4. Target Users
- People at events, markets, campuses, transit hubs, protests/gatherings, housing societies — anyone who wants to talk to "whoever is around right now."

## 5. Core User Flow
1. User opens the website.
2. Browser asks for location permission.
3. App computes a geohash cell for the user's location and joins the corresponding chat room via WebSocket.
4. User sees an anonymous auto-generated display name (e.g., "Falcon-42") and the live message feed for that room.
5. User sends/receives messages in real time.
6. If the user closes the tab or moves out of the geohash range, their session ends and they leave the room. No message history persists beyond a short TTL.

## 6. Functional Requirements
- FR1: Real-time bidirectional messaging within a geo-scoped room.
- FR2: Room membership determined by geohash of current location (configurable precision/radius).
- FR3: Anonymous session identity, generated client-side, never tied to personal data.
- FR4: Messages auto-expire (TTL) server-side; nothing is stored permanently.
- FR5: Rate limiting per session to prevent flooding.
- FR6: Basic profanity/spam filtering before broadcast.
- FR7: Graceful reconnect on network drop (important for mobile/flaky networks).
- FR8: Visible online-user count per room.

## 7. Non-Functional Requirements
1. Very low infrastructure cost (target: ₹0 to run at small/MVP scale).
2. ₹0 development cost (open-source stack only).
3. ₹0 deployment cost using free tiers (Vercel, Render, Upstash, UptimeRobot).
4. Low CPU/RAM/network usage on client devices.
5. Smooth operation on low-end Android phones and 2G/3G networks.
6. Real-time communication (sub-second message delivery under normal conditions).
7. Scalable architecture (horizontal scaling path via Redis pub/sub, even if not needed at MVP scale).
8. Privacy-focused temporary sessions (no PII, no permanent storage).
9. Strong protection against spam and abuse (rate limiting, filtering, auto-mute).
10. Only people physically present in a particular geographic range can talk in that room.

## 8. Success Metrics (MVP)
- Median message delivery latency < 1s on 4G, < 3s on 3G.
- Time-to-first-message (page load → able to send) < 5s on a low-end device.
- Zero permanent PII stored (auditable via schema/code review).
- Spam message rate < 1% of total messages after filtering (manual sampling).

## 9. Constraints
- Free-tier hosting limits (Render free web service: 750 hrs/month, sleeps when idle; Upstash Redis free tier request/storage caps).
- Browser Geolocation API accuracy varies (10m–a few hundred meters), which affects room-boundary precision — acceptable for v1.
- No native push notifications in v1 (browser tab must be open/foregrounded, or use Web Push as a stretch goal).

## 10. Open Questions (to revisit, not blockers for MVP)
- Exact geohash precision (room radius) — needs field testing.
- Whether to auto-merge sparse neighboring cells when a room has too few people.
- Whether moderation needs a human-in-the-loop reporting flow in v2.